import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errandFormDataContractErrorMessage, loadFormSchema, loadFormSchemaForEntry } from '../utils/schema-utils';

interface UseFormSchemaResult {
  schema: RJSFSchema | null;
  uiSchema: UiSchema<Record<string, unknown>> | undefined;
  schemaId: string | undefined;
  loading: boolean;
  error: string | null;
}

export type FormSchemaSource =
  | { kind: 'new' }
  | {
      kind: 'persisted';
      schemaId?: string;
    };

export function useFormSchema(schemaName: string, source: FormSchemaSource = { kind: 'new' }): UseFormSchemaResult {
  const { t } = useTranslation('forms');
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema<Record<string, unknown>> | undefined>(undefined);
  const [schemaId, setSchemaId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedSchemaRef = useRef<{ schemaName: string; schemaId: string } | null>(null);
  const sourceKind = source.kind;
  const persistedSchemaId = source.kind === 'persisted' ? source.schemaId : undefined;

  useEffect(() => {
    if (
      sourceKind === 'persisted' &&
      persistedSchemaId !== undefined &&
      loadedSchemaRef.current?.schemaName === schemaName &&
      loadedSchemaRef.current.schemaId === persistedSchemaId
    ) {
      return;
    }

    let active = true;
    loadedSchemaRef.current = null;
    setLoading(true);
    setError(null);

    // Defer the loader call so a missing persisted ID is handled as a rejected
    // contract promise instead of escaping synchronously from the effect.
    const schemaPromise = Promise.resolve().then(() =>
      sourceKind === 'new' ? loadFormSchema(schemaName, t) : loadFormSchemaForEntry(schemaName, persistedSchemaId, t)
    );

    schemaPromise
      .then(({ schema: loadedSchema, uiSchema: loadedUiSchema, schemaId: loadedSchemaId }) => {
        if (!active) return;
        loadedSchemaRef.current = { schemaName, schemaId: loadedSchemaId };
        setSchema(loadedSchema);
        setUiSchema(loadedUiSchema);
        setSchemaId(loadedSchemaId);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        loadedSchemaRef.current = null;
        setSchema(null);
        setUiSchema(undefined);
        setSchemaId(undefined);
        setError(errandFormDataContractErrorMessage(err, t) ?? (err instanceof Error ? err.message : String(err)));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [persistedSchemaId, schemaName, sourceKind, t]);

  return { schema, uiSchema, schemaId, loading, error };
}
