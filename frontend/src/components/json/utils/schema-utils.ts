import type { JsonParameterDTO } from '@data-contracts/backend/data-contracts';
import type { ErrandFormDataItem } from '@interfaces/errand-form';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import type { TFunction } from 'i18next';

import { getJsonValueSchemaValidator } from '../schema/form-schema-validator';

export const ERRAND_FORM_SCHEMA_NAMES = ['avvikelse-plats-handelse'] as const;

export type ErrandFormDataContractErrorCode = 'invalid-json' | 'missing-schema-id' | 'missing-schema-name';

export class ErrandFormDataContractError extends Error {
  constructor(
    readonly code: ErrandFormDataContractErrorCode,
    readonly schemaName: string
  ) {
    super(`${code}: ${schemaName || 'unknown schema'}`);
    this.name = 'ErrandFormDataContractError';
  }
}

export type ParsedErrandFormData =
  { valid: true; value: unknown } | { valid: false; error: ErrandFormDataContractError };

export function parseErrandFormData(rawData: string, schemaName: string): ParsedErrandFormData {
  try {
    const value: unknown = JSON.parse(rawData);
    return { valid: true, value };
  } catch {
    return { valid: false, error: new ErrandFormDataContractError('invalid-json', schemaName) };
  }
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function errandFormDataContractErrorMessage(error: unknown, t?: TFunction): string | undefined {
  if (!(error instanceof ErrandFormDataContractError)) return undefined;

  const translationKey: Record<ErrandFormDataContractErrorCode, string> = {
    'invalid-json': 'invalid_form_data',
    'missing-schema-id': 'missing_schema_id',
    'missing-schema-name': 'missing_schema_name',
  };
  const fallback: Record<ErrandFormDataContractErrorCode, string> = {
    'invalid-json': `Invalid JSON data for ${error.schemaName}`,
    'missing-schema-id': `Missing schema ID for ${error.schemaName}`,
    'missing-schema-name': 'Missing schema name for JSON data',
  };

  return t ? t(translationKey[error.code], { schemaName: error.schemaName }) : fallback[error.code];
}

function requireSchemaId(schemaId: unknown, schemaName: string): string {
  if (typeof schemaId !== 'string' || schemaId.trim().length === 0) {
    throw new ErrandFormDataContractError('missing-schema-id', schemaName);
  }
  return schemaId;
}

// Cachea schemat för att undvika upprepade hämtningar
const schemaCache = new Map<
  string,
  { schema: RJSFSchema; uiSchema?: UiSchema<Record<string, unknown>>; schemaId: string }
>();

export function enumTitleOf(schema: RJSFSchema | null, field: string, value: string): string {
  if (!schema || !value) return value ?? '';
  const schemaRecord = schema as Record<string, unknown>;
  const properties = schemaRecord.properties as Record<string, unknown> | undefined;
  const fieldSchema = properties?.[field] as Record<string, unknown> | undefined;
  const oneOf = fieldSchema?.oneOf as { const: string; title?: string }[] | undefined;
  return oneOf?.find((o) => o.const === value)?.title ?? value;
}

export function enumTitlesOfArray(schema: RJSFSchema | null, field: string, values: string[] = []): string[] {
  if (!schema) return values ?? [];
  const schemaRecord = schema as Record<string, unknown>;
  const properties = schemaRecord.properties as Record<string, unknown> | undefined;
  const fieldSchema = properties?.[field] as Record<string, unknown> | undefined;
  const items = fieldSchema?.items as Record<string, unknown> | undefined;
  const oneOf = items?.oneOf as { const: string; title?: string }[] | undefined;
  if (!oneOf) return values ?? [];
  return (values ?? []).map((v) => oneOf.find((o) => o.const === v)?.title ?? v);
}

export async function loadFormSchema(
  schemaName: string,
  t?: TFunction
): Promise<{
  schema: RJSFSchema;
  uiSchema?: UiSchema<Record<string, unknown>>;
  schemaId: string;
}> {
  const cached = schemaCache.get(schemaName);
  if (cached) {
    return cached;
  }

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '') || '/api';

  try {
    const response = await fetch(`${apiUrl}/schemas/latest/${schemaName}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to load schema: ${response.statusText}`);
    }
    const {
      schema,
      uiSchema,
      schemaId: responseSchemaId,
    } = (await response.json()) as {
      schema: RJSFSchema;
      uiSchema?: UiSchema<Record<string, unknown>>;
      schemaId?: unknown;
    };

    if (!isJsonObject(schema)) {
      throw new Error(`Schema definition is missing: ${schemaName}`);
    }
    const schemaId = requireSchemaId(responseSchemaId, schemaName);

    // Spara den exakta versionen under både sitt logiska namn och sitt oföränderliga ID.
    const result = { schema, uiSchema, schemaId };
    schemaCache.set(schemaName, result);
    schemaCache.set(schemaId, result);

    return result;
  } catch (error) {
    console.error(`Failed to load schema: ${schemaName}`, error);
    if (error instanceof ErrandFormDataContractError) throw error;
    const errorMessage = t ? t('schema_load_error', { schemaName }) : `Could not load schema: ${schemaName}`;
    throw new Error(errorMessage);
  }
}

export async function loadFormSchemaById(
  schemaId: string,
  t?: TFunction
): Promise<{
  schema: RJSFSchema;
  uiSchema?: UiSchema<Record<string, unknown>>;
  schemaId: string;
}> {
  const exactSchemaId = requireSchemaId(schemaId, schemaId);
  const cached = schemaCache.get(exactSchemaId);
  if (cached) {
    return { ...cached, schemaId: exactSchemaId };
  }

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '') || '/api';

  try {
    const response = await fetch(`${apiUrl}/schemas/${exactSchemaId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to load schema: ${response.statusText}`);
    }
    const {
      schema,
      uiSchema,
      schemaId: responseSchemaId,
    } = (await response.json()) as {
      schema: RJSFSchema;
      uiSchema?: UiSchema<Record<string, unknown>>;
      schemaId?: unknown;
    };

    if (!isJsonObject(schema)) {
      throw new Error(`Schema definition is missing: ${exactSchemaId}`);
    }
    const verifiedSchemaId = requireSchemaId(responseSchemaId, exactSchemaId);
    if (verifiedSchemaId !== exactSchemaId) {
      throw new Error(`Schema ID does not match request: ${exactSchemaId}`);
    }

    const result = { schema, uiSchema, schemaId: verifiedSchemaId };
    schemaCache.set(exactSchemaId, result);

    return result;
  } catch (error) {
    console.error(`Failed to load schema by ID: ${exactSchemaId}`, error);
    const errorMessage =
      t ? t('schema_load_error', { schemaName: exactSchemaId }) : `Could not load schema: ${exactSchemaId}`;
    throw new Error(errorMessage);
  }
}

export function loadFormSchemaForEntry(
  schemaName: string,
  schemaId?: string,
  t?: TFunction
): Promise<{
  schema: RJSFSchema;
  uiSchema?: UiSchema<Record<string, unknown>>;
  schemaId: string;
}> {
  return loadFormSchemaById(requireSchemaId(schemaId, schemaName), t);
}

function schemaValidationError(schemaName: string, t?: TFunction): string {
  return t ? t('schema_validation_error', { schemaName }) : `Could not validate ${schemaName}`;
}

// En post saknas tills användaren rört formuläret. Det är inte ett systemfel
// utan ett ifyllnadskrav, och meddelandet måste säga det för att vara handlingsbart.
function requiredFormDataError(schemaName: string, t?: TFunction): string {
  return t ? t('required_form_data', { schemaName }) : `Fill in ${schemaName} before continuing`;
}

/**
 * Validerar all ärendeformulärdata mot sina scheman.
 * Returnerar en lista med felmeddelanden, tom om allt är giltigt.
 * @param formDataEntries - Posterna som ska valideras
 * @param t - Valfri översättningsfunktion för felmeddelanden
 */
export async function validateErrandFormData(
  formDataEntries: ErrandFormDataItem[] | undefined,
  t?: TFunction
): Promise<string[]> {
  const errors: string[] = [];
  const entries = formDataEntries ?? [];
  const missingSchemaNames = ERRAND_FORM_SCHEMA_NAMES.filter(
    (schemaName) => !entries.some((entry) => entry.schemaName === schemaName)
  );

  for (const schemaName of missingSchemaNames) {
    errors.push(requiredFormDataError(schemaName, t));
  }

  for (const entry of entries) {
    if (!entry.schemaName.trim()) {
      const contractError = new ErrandFormDataContractError('missing-schema-name', entry.schemaName);
      errors.push(errandFormDataContractErrorMessage(contractError, t) ?? schemaValidationError(entry.schemaName, t));
      continue;
    }

    const parsedData = parseErrandFormData(entry.data, entry.schemaName);
    if (!parsedData.valid) {
      errors.push(
        errandFormDataContractErrorMessage(parsedData.error, t) ?? schemaValidationError(entry.schemaName, t)
      );
      continue;
    }

    try {
      const { schema, schemaId } = await loadFormSchemaForEntry(entry.schemaName, entry.schemaId, t);
      const validator = getJsonValueSchemaValidator(schemaId);
      const { errors: validationErrors } = validator.validateFormData(parsedData.value, schema);

      if (validationErrors.length > 0) {
        const schemaTitle = schema.title ?? entry.schemaName;
        errors.push(`${schemaTitle}: ${validationErrors[0].message}`);
      }
    } catch (error: unknown) {
      errors.push(errandFormDataContractErrorMessage(error, t) ?? schemaValidationError(entry.schemaName, t));
    }
  }

  return errors;
}

export function upsertErrandFormDataItem(
  formDataEntries: ErrandFormDataItem[] | undefined,
  nextEntry: ErrandFormDataItem
): ErrandFormDataItem[] {
  const entries = formDataEntries ?? [];
  const existingIndex = entries.findIndex((entry) => entry.schemaName === nextEntry.schemaName);

  if (existingIndex === -1) {
    return [...entries, nextEntry];
  }

  const nextEntries = [...entries];
  nextEntries[existingIndex] = {
    ...entries[existingIndex],
    ...nextEntry,
    schemaId: entries[existingIndex].schemaId ?? nextEntry.schemaId,
  };
  return nextEntries;
}

export function errandFormDataToJsonParameters(formData: ErrandFormDataItem[] | undefined): JsonParameterDTO[] {
  if (!formData) return [];
  return formData.map((entry) => {
    if (!entry.schemaName.trim()) {
      throw new ErrandFormDataContractError('missing-schema-name', entry.schemaName);
    }

    const schemaId = requireSchemaId(entry.schemaId, entry.schemaName);
    const parsedData = parseErrandFormData(entry.data, entry.schemaName);
    if (!parsedData.valid) throw parsedData.error;

    return {
      key: entry.schemaName,
      value: parsedData.value,
      schemaId,
    };
  });
}

export function jsonParametersToErrandFormData(jsonParameters: JsonParameterDTO[] | undefined): ErrandFormDataItem[] {
  if (!jsonParameters) return [];
  return jsonParameters.map((param) => ({
    schemaName: param.key,
    schemaId: param.schemaId,
    data: JSON.stringify(param.value === undefined ? {} : param.value),
  }));
}
