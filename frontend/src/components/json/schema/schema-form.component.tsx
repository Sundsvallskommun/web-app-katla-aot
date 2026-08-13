'use client';
import { FieldTemplate } from '@components/json/fields/field-template.component';
import { ObjectFieldTemplate } from '@components/json/fields/object-field-template.component';
import { SubmitButtonFieldTemplate } from '@components/json/fields/submit-button-field-template.component';
import { CheckboxWidget } from '@components/json/widgets/checkbox-widget';
import { ComboboxWidget } from '@components/json/widgets/combobox-widget';
import { DateWidget } from '@components/json/widgets/date-widget';
import { FacilitySearchWidget } from '@components/json/widgets/facility-search-widget';
import { RadiobuttonWidget } from '@components/json/widgets/radio-widget';
import { RADIO_WIDGET_NAMES } from '@components/json/widgets/radio-widget-names';
import { SelectWidget } from '@components/json/widgets/select-widget';
import { TextWidget } from '@components/json/widgets/text-widget';
import { TexteditorWidget } from '@components/json/widgets/texteditor-widget';
import { TimeWidget } from '@components/json/widgets/time-widget';
import Form, { IChangeEvent } from '@rjsf/core';
import type { RegistryFieldsType, RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import createJsonErrorTransformer from '../utils/schema-form-error-handling';
import { getFormSchemaValidator } from './form-schema-validator';

const widgets: RegistryWidgetsType = {
  TextWidget,
  text: TextWidget,
  SelectWidget,
  select: SelectWidget,
  ...Object.fromEntries(RADIO_WIDGET_NAMES.map((name) => [name, RadiobuttonWidget])),
  CheckboxWidget,
  checkbox: CheckboxWidget,
  DateWidget,
  date: DateWidget,
  // Namnet TimeWidget ersätter även RJSF:s standardwidget för `format: "time"`
  TimeWidget,
  time: TimeWidget,
  ComboboxWidget,
  combobox: ComboboxWidget,
  TexteditorWidget,
  texteditor: TexteditorWidget,
};

// Egna fält för objekttyper
const fields: RegistryFieldsType = {
  FacilitySearchWidget,
};

interface SchemaFormProps {
  schemaId: string;
  schema: RJSFSchema;
  uiSchema?: UiSchema<Record<string, unknown>>;
  formData?: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>, e?: IChangeEvent) => void;
  onSubmit?: (payload: Record<string, unknown>, e: IChangeEvent) => void;
  hideSubmitButton?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export default function SchemaForm({
  schemaId,
  schema,
  uiSchema = {},
  formData,
  onChange,
  onSubmit,
  hideSubmitButton = false,
  showValidation,
  disabled = false,
  compact = false,
}: SchemaFormProps) {
  const { t } = useTranslation('validation');
  const [localData, setLocalData] = useState<Record<string, unknown>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const data = formData ?? localData;
  const shouldValidate = showValidation ?? hasSubmitted;
  const validator = useMemo(() => getFormSchemaValidator(schemaId), [schemaId]);

  const handleChange = useCallback(
    (e: IChangeEvent<Record<string, unknown>>) => {
      const fd = { ...e.formData };
      if (formData !== undefined) {
        onChange?.(fd, e);
      } else {
        setLocalData(fd);
      }
    },
    [formData, onChange]
  );

  const handleSubmit = useCallback(
    (e: IChangeEvent<Record<string, unknown>>) => {
      setHasSubmitted(true);
      onSubmit?.(e.formData ?? {}, e);
    },
    [onSubmit]
  );

  const errorTransformer = useMemo(() => createJsonErrorTransformer(schema, t), [schema, t]);

  // Skickar originalschemat via formContext så att ObjectFieldTemplate kan läsa villkoren
  const formContext = useMemo(
    () => ({ originalSchema: schema, compact, validationActive: shouldValidate }),
    [schema, compact, shouldValidate]
  );

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={data}
      formContext={formContext}
      onChange={handleChange}
      onSubmit={handleSubmit}
      validator={validator}
      widgets={widgets}
      fields={fields}
      templates={{
        FieldTemplate,
        ObjectFieldTemplate,
        ButtonTemplates: {
          SubmitButton: hideSubmitButton ? () => null : SubmitButtonFieldTemplate,
        },
      }}
      transformErrors={errorTransformer}
      noHtml5Validate
      showErrorList={false}
      liveValidate={shouldValidate}
      disabled={disabled}
    />
  );
}
