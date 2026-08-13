import i18nConfig from '@app/i18nConfig';
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
  const { t, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchema<Record<string, unknown>> | undefined>(undefined);
  const [schemaId, setSchemaId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedSchemaRef = useRef<{ schemaName: string; schemaId: string; locale: string } | null>(null);
  const sourceKind = source.kind;
  const persistedSchemaId = source.kind === 'persisted' ? source.schemaId : undefined;

  useEffect(() => {
    if (
      sourceKind === 'persisted' &&
      persistedSchemaId !== undefined &&
      loadedSchemaRef.current?.schemaName === schemaName &&
      loadedSchemaRef.current.schemaId === persistedSchemaId &&
      // Utan språket i jämförelsen skulle ett språkbyte avbryta här och behålla
      // det tidigare språkets schema.
      loadedSchemaRef.current.locale === locale
    ) {
      return;
    }

    let active = true;
    loadedSchemaRef.current = null;
    setLoading(true);
    setError(null);

    // Skjut upp anropet till laddaren så att ett saknat persisterat ID hanteras
    // som ett avvisat kontraktslöfte i stället för att kastas synkront ur effekten.
    const schemaPromise = Promise.resolve().then(() =>
      sourceKind === 'new' ?
        loadFormSchema(schemaName, t, locale)
      : loadFormSchemaForEntry(schemaName, persistedSchemaId, t, locale)
    );

    schemaPromise
      .then(({ schema: loadedSchema, uiSchema: loadedUiSchema, schemaId: loadedSchemaId }) => {
        if (!active) return;
        loadedSchemaRef.current = { schemaName, schemaId: loadedSchemaId, locale };
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
  }, [locale, persistedSchemaId, schemaName, sourceKind, t]);

  return { schema, uiSchema, schemaId, loading, error };
}
