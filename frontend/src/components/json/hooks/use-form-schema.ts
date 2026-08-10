import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useEffect, useState } from 'react';

import { loadFormSchema } from '../utils/schema-utils';

interface UseFormSchemaResult {
  schema: RJSFSchema | null;
  uiSchema: UiSchema<Record<string, unknown>> | undefined;
  schemaId: string | undefined;
  loading: boolean;
  error: string | null;
}

export function useFormSchema(schemaName: string): UseFormSchemaResult {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema<Record<string, unknown>> | undefined>(undefined);
  const [schemaId, setSchemaId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFormSchema(schemaName)
      .then(({ schema, uiSchema, schemaId }) => {
        setSchema(schema);
        setUiSchema(uiSchema);
        setSchemaId(schemaId);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [schemaName]);

  return { schema, uiSchema, schemaId, loading, error };
}
