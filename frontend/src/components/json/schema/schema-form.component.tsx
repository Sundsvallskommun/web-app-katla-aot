'use client';
import { FieldTemplate } from '@components/json/fields/field-template.component';
import { ObjectFieldTemplate } from '@components/json/fields/object-field-template.component';
import { SubmitButtonFieldTemplate } from '@components/json/fields/submit-button-field-template.component';
import { CheckboxWidget } from '@components/json/widgets/checkbox-widget';
import { ComboboxWidget } from '@components/json/widgets/combobox-widget';
import { DateWidget } from '@components/json/widgets/date-widget';
import { FacilitySearchWidget } from '@components/json/widgets/facility-search-widget';
import { RadiobuttonWidget } from '@components/json/widgets/radio-widget';
import { SelectWidget } from '@components/json/widgets/select-widget';
import { TextWidget } from '@components/json/widgets/text-widget';
import { TexteditorWidget } from '@components/json/widgets/texteditor-widget';
import { stripHtml } from '@components/json/widgets/types';
import Form, { IChangeEvent } from '@rjsf/core';
import type { RegistryFieldsType, RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Ajv from 'ajv';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import createJsonErrorTransformer from '../utils/schema-form-error-handling';

// Custom AJV class that counts text length without HTML tags for minLength/maxLength
class HtmlAwareAjv extends Ajv {
  constructor(opts?: ConstructorParameters<typeof Ajv>[0]) {
    super(opts);
    this.addHtmlAwareLengthKeyword('minLength', (len, limit) => len >= limit);
    this.addHtmlAwareLengthKeyword('maxLength', (len, limit) => len <= limit);
  }

  private addHtmlAwareLengthKeyword(
    keyword: 'minLength' | 'maxLength',
    comparator: (len: number, limit: number) => boolean
  ) {
    this.removeKeyword(keyword);
    this.addKeyword({
      keyword,
      type: 'string',
      schemaType: 'number',
      validate: (schema: number, data: string) => comparator(stripHtml(data || '').length, schema),
    });
  }
}

const validator = customizeValidator({
  ajvOptionsOverrides: {
    allErrors: true,
  },
  AjvClass: HtmlAwareAjv as typeof Ajv,
});

const widgets: RegistryWidgetsType = {
  TextWidget,
  text: TextWidget,
  SelectWidget,
  select: SelectWidget,
  RadioWidget: RadiobuttonWidget,
  radio: RadiobuttonWidget,
  CheckboxWidget,
  checkbox: CheckboxWidget,
  DateWidget,
  date: DateWidget,
  ComboboxWidget,
  combobox: ComboboxWidget,
  TexteditorWidget,
  texteditor: TexteditorWidget,
};

// Custom fields for object types
const fields: RegistryFieldsType = {
  FacilitySearchWidget,
};

interface SchemaFormProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>, e?: IChangeEvent) => void;
  onSubmit?: (payload: Record<string, unknown>, e: IChangeEvent) => void;
  hideSubmitButton?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export default function SchemaForm({
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
      onSubmit?.(e.formData || {}, e);
    },
    [onSubmit]
  );

  const errorTransformer = useMemo(() => createJsonErrorTransformer(schema, t), [schema, t]);

  // Sends the original schema via formContext so ObjectFieldTemplate can read the conditions
  const formContext = useMemo(() => ({ originalSchema: schema, compact }), [schema, compact]);

  return (
    <Form
      schema={schema}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uiSchema={uiSchema as any}
      formData={data}
      formContext={formContext}
      onChange={handleChange}
      onSubmit={handleSubmit}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validator={validator as any}
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
