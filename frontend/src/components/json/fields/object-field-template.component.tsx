'use client';
import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import type { ErrorSchema, ObjectFieldTemplateProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { Checkbox, Disclosure, Divider, Label } from '@sk-web-gui/react';
import { icons } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

interface ConditionalRule {
  if: {
    properties: Record<string, { const: unknown }>;
    required?: string[];
  };
  then: {
    required?: string[];
    properties?: Record<string, unknown>;
  };
}

interface RowDefinition {
  fields: string[];
  gap?: string;
}

interface SectionDefinition {
  id: string;
  title: string;
  icon?: string;
  fields: string[];
  defaultOpen?: boolean;
}

interface FormContext {
  originalSchema?: RJSFSchema;
  compact?: boolean;
  validationActive?: boolean;
}

function isConditionMet(condition: ConditionalRule['if'], formData: Record<string, unknown>): boolean {
  if (!condition?.properties) return false;

  for (const [field, rule] of Object.entries(condition.properties)) {
    if ('const' in rule) {
      if (formData[field] !== rule.const) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Extracts field names from a then-block (required fields and property keys)
 */
function extractDependentFields(then: ConditionalRule['then']): string[] {
  return [...(then.required ?? []), ...(then.properties ? Object.keys(then.properties) : [])];
}

/**
 * Extracts all conditional fields from the schema based on if/then rules
 */
function getConditionalFields(schema: RJSFSchema): Map<string, ConditionalRule['if']> {
  const conditionalFields = new Map<string, ConditionalRule['if']>();

  // Handle allOf with if/then
  const allOf = schema.allOf as ConditionalRule[] | undefined;
  if (allOf) {
    for (const rule of allOf) {
      if (rule.if && rule.then) {
        for (const field of extractDependentFields(rule.then)) {
          conditionalFields.set(field, rule.if);
        }
      }
    }
  }

  // Handle simple if/then at root level
  const rootIf = schema.if as ConditionalRule['if'] | undefined;
  const rootThen = schema.then as ConditionalRule['then'] | undefined;
  if (rootIf && rootThen) {
    for (const field of extractDependentFields(rootThen)) {
      conditionalFields.set(field, rootIf);
    }
  }

  return conditionalFields;
}

/**
 * Extracts row definitions from uiSchema
 */
function getRowDefinitions(uiSchema: UiSchema | undefined): RowDefinition[] {
  return (uiSchema?.['ui:rows'] ?? []) as RowDefinition[];
}

/**
 * Extracts section definitions from uiSchema
 */
function getSectionDefinitions(uiSchema: UiSchema | undefined): SectionDefinition[] {
  return (uiSchema?.['ui:sections'] ?? []) as SectionDefinition[];
}

/**
 * UI-schemat använder Lucides stabila kebab-case-namn medan lucide-reacts
 * ikonregister använder PascalCase som objektnycklar.
 */
function getSectionIcon(iconName: string | undefined) {
  if (!iconName) return undefined;

  const iconKey = iconName
    .trim()
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('') as keyof typeof icons;

  return icons[iconKey];
}

/**
 * Fältet kan ha fel både på sig självt och i underliggande objekt, så hela grenen gås igenom.
 */
function containsErrors(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return false;

  const branch = node as Record<string, unknown>;
  if (Array.isArray(branch.__errors) && branch.__errors.length > 0) return true;

  return Object.entries(branch).some(([key, value]) => key !== '__errors' && containsErrors(value));
}

function sectionHasErrors(fieldNames: string[], errorSchema: ErrorSchema | undefined): boolean {
  if (!errorSchema) return false;
  const errors = errorSchema as Record<string, unknown>;
  return fieldNames.some((fieldName) => containsErrors(errors[fieldName]));
}

/**
 * Avsnitten får sin status först när valideringen är igång. Innan dess vet formuläret inte
 * om ett tomt fält är ett fel eller bara något användaren inte hunnit fram till.
 */
type SectionStatus = 'error' | 'complete';

/**
 * Section component with completion checkbox
 */
interface SectionDisclosureProps {
  section: SectionDefinition;
  status?: SectionStatus;
  children: React.ReactNode;
}

function SectionDisclosure({ section, status, children }: SectionDisclosureProps) {
  const { t } = useTranslation('forms');
  // Öppen om inget annat sägs, samma standard som ErrandDisclosure. Sätt defaultOpen:false
  // i ui:sections för att stänga en enskild sektion.
  const [open, setOpen] = useState(section.defaultOpen ?? true);
  const [doneMark, setDoneMark] = useState(false);
  const SectionIcon = getSectionIcon(section.icon);

  const handleDoneMarkChange = () => {
    const newDoneMark = !doneMark;
    setDoneMark(newDoneMark);

    if (newDoneMark) {
      setOpen(false);
    }
  };

  return (
    <Disclosure variant="alt" className="w-full" open={open} onToggleOpen={setOpen}>
      <Disclosure.Header>
        {SectionIcon && <Disclosure.Icon icon={React.createElement(SectionIcon)} />}
        {/* min-w-0 låter rubriken krympa i stället för att trycka ut statusetiketten över kanten */}
        <Disclosure.Title className="min-w-0">{section.title}</Disclosure.Title>
        {status && (
          <Label
            inverted
            rounded
            color={status === 'error' ? 'error' : 'gronsta'}
            className="sk-disclosure-label whitespace-nowrap"
            data-cy={`section-status-${section.id}`}
          >
            {t(status === 'error' ? 'section_incomplete' : 'section_complete')}
          </Label>
        )}
        {doneMark && status !== 'complete' && (
          <Label inverted rounded color="gronsta" className="sk-disclosure-label whitespace-nowrap">
            {t('section_complete')}
          </Label>
        )}
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        <ErrandContentLock>
          {children}
          <Divider className="mt-16" />
          {appConfig.features.disclosureDoneMark && (
            <Checkbox className="mt-16" onClick={handleDoneMarkChange} checked={doneMark}>
              {t('errand-information:section.mark_complete')}
            </Checkbox>
          )}
        </ErrandContentLock>
      </Disclosure.Content>
    </Disclosure>
  );
}

/**
 * Renders fields based on order, rows, and visibility
 */
function renderFields(
  fieldNames: string[],
  properties: ObjectFieldTemplateProps['properties'],
  visibleFields: Set<string>,
  rows: RowDefinition[],
  rowFieldNames: Set<string>,
  renderedRows: Set<string>,
  compact = false
) {
  return fieldNames.map((fieldName) => {
    // Skip hidden fields
    if (!visibleFields.has(fieldName)) return null;

    // Check if field is the first field in a row
    const row = rows.find((r) => r.fields[0] === fieldName);
    if (row) {
      // Skip if we've already rendered this row
      const rowKey = row.fields.join('-');
      if (renderedRows.has(rowKey)) return null;
      renderedRows.add(rowKey);

      // Filter out hidden fields from the row
      const visibleRowFields = row.fields.filter((f) => visibleFields.has(f));
      if (visibleRowFields.length === 0) return null;

      return (
        <div key={rowKey} className={`flex ${compact ? 'flex-col gap-32' : (row.gap ?? '') || 'gap-32'}`}>
          {visibleRowFields.map((f) => {
            const prop = properties.find((p) => p.name === f);
            return prop ?
                <div key={f} className={compact ? '' : 'flex-1'}>
                  {prop.content}
                </div>
              : null;
          })}
        </div>
      );
    }

    // Skip if field is part of a row but not the first (already rendered with row)
    if (rowFieldNames.has(fieldName)) return null;

    // Standalone field
    const prop = properties.find((p) => p.name === fieldName);
    return prop ? <div key={fieldName}>{prop.content}</div> : null;
  });
}

/**
 * ObjectFieldTemplate that hides fields based on if/then conditions in the schema
 * and supports ui:rows for horizontal field grouping and ui:sections for Disclosure grouping
 */
export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { properties, uiSchema, errorSchema } = props;
  const formData = props.formData as Record<string, unknown> | undefined;

  // Get original schema from formContext (RJSF processes and removes allOf from schema prop)
  const ctx = props.formContext as FormContext | undefined;
  const originalSchema = ctx?.originalSchema;
  const conditionalFields =
    originalSchema ? getConditionalFields(originalSchema) : new Map<string, ConditionalRule['if']>();

  // Get row and section definitions from uiSchema
  const rows = getRowDefinitions(uiSchema);
  const rowFieldNames = new Set(rows.flatMap((r) => r.fields));
  const sections = getSectionDefinitions(uiSchema);

  // Get field order from uiSchema or use properties order
  const order = uiSchema?.['ui:order'] ?? properties.map((p) => p.name);

  // Filter out hidden conditional fields
  const visibleFields = new Set<string>();
  for (const prop of properties) {
    const condition = conditionalFields.get(prop.name);
    if (condition) {
      if (isConditionMet(condition, formData ?? {})) {
        visibleFields.add(prop.name);
      }
    } else {
      visibleFields.add(prop.name);
    }
  }

  const compact = ctx?.compact ?? false;
  const validationActive = ctx?.validationActive ?? false;

  // If no sections defined, use original flat rendering
  if (sections.length === 0) {
    const renderedRows = new Set<string>();
    return (
      <div className="flex flex-col gap-32">
        {renderFields(order, properties, visibleFields, rows, rowFieldNames, renderedRows, compact)}
      </div>
    );
  }

  // Track which fields belong to sections
  const sectionFieldNames = new Set(sections.flatMap((s) => s.fields));

  // Find fields not in any section (to render at the end)
  const unsectionedFields = order.filter((f) => !sectionFieldNames.has(f) && visibleFields.has(f));

  // Track rendered rows across all sections
  const renderedRows = new Set<string>();

  return (
    <div className="flex flex-col gap-32">
      {/* Render sections */}
      {sections.map((section) => {
        // Get visible fields for this section in order
        const sectionFieldsInOrder = order.filter((f) => section.fields.includes(f) && visibleFields.has(f));

        // Skip empty sections
        if (sectionFieldsInOrder.length === 0) return null;

        if (compact) {
          return (
            <div key={section.id} className="flex flex-col gap-32">
              {renderFields(
                sectionFieldsInOrder,
                properties,
                visibleFields,
                rows,
                rowFieldNames,
                renderedRows,
                compact
              )}
            </div>
          );
        }

        const status =
          !validationActive ? undefined
          : sectionHasErrors(sectionFieldsInOrder, errorSchema) ? 'error'
          : 'complete';

        return (
          <SectionDisclosure key={section.id} section={section} status={status}>
            <div className="flex flex-col gap-32 py-16">
              {renderFields(sectionFieldsInOrder, properties, visibleFields, rows, rowFieldNames, renderedRows)}
            </div>
          </SectionDisclosure>
        );
      })}

      {/* Render fields not in any section */}
      {unsectionedFields.length > 0 && (
        <div className="flex flex-col gap-32">
          {renderFields(unsectionedFields, properties, visibleFields, rows, rowFieldNames, renderedRows, compact)}
        </div>
      )}
    </div>
  );
}
