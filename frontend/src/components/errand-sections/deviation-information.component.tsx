'use client';

import { useFormSchema } from '@components/json/hooks/use-form-schema';
import SchemaForm from '@components/json/schema/schema-form.component';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

interface SchemaFormFieldProps {
  schemaName: string;
  index: number;
  compact?: boolean;
}

function SchemaFormField({ schemaName, index, compact }: SchemaFormFieldProps) {
  const { watch, setValue } = useFormContext<ErrandFormDTO>();
  const { showValidation } = useFormValidation();
  const { schema, uiSchema, loading, error } = useFormSchema(schemaName);
  const status = watch('status');
  const isDraft = status === 'DRAFT';

  const rawData = watch(`errandFormData.${index}.data`) ?? '{}';
  const formData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

  const handleChange = useCallback(
    (data: Record<string, unknown>) => {
      setValue(`errandFormData.${index}`, { schemaName, data: JSON.stringify(data) });
    },
    [setValue, index, schemaName]
  );

  if (loading) {
    return <div className="text-gray-500">Laddar formulär...</div>;
  }

  if (error || !schema) {
    return <div className="text-error">Fel: {error ?? 'Kunde inte ladda schema'}</div>;
  }

  return (
    <SchemaForm
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onChange={handleChange}
      hideSubmitButton
      showValidation={showValidation}
      disabled={!isDraft}
      compact={compact}
    />
  );
}

const SCHEMAS = ['avvikelse-plats-handelse'];

interface DeviationInformationProps {
  compact?: boolean;
}

export const DeviationInformation: React.FC<DeviationInformationProps> = ({ compact }) => {
  return (
    <div className="flex flex-col gap-24">
      {SCHEMAS.map((schemaName, index) => (
        <SchemaFormField key={schemaName} schemaName={schemaName} index={index} compact={compact} />
      ))}
    </div>
  );
};
