import type { JsonParameterDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDataItem } from '@interfaces/errand-form';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validatorAjv8 from '@rjsf/validator-ajv8';
import type { TFunction } from 'i18next';

// Cache schema to avoid repeated fetches
const schemaCache = new Map<
  string,
  { schema: RJSFSchema; uiSchema?: UiSchema<Record<string, unknown>>; schemaId?: string }
>();

export function getSchemaIdFromCache(schemaName: string): string | undefined {
  return schemaCache.get(schemaName)?.schemaId;
}

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
  schemaId?: string;
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
    const { schema, uiSchema, schemaId } = (await response.json()) as {
      schema: RJSFSchema;
      uiSchema?: UiSchema<Record<string, unknown>>;
      schemaId?: string;
    };

    // Save to cache
    const result = { schema, uiSchema, schemaId };
    schemaCache.set(schemaName, result);

    return result;
  } catch (error) {
    console.error(`Failed to load schema: ${schemaName}`, error);
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
  const cached = schemaCache.get(schemaId);
  if (cached) {
    return { ...cached, schemaId };
  }

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '') || '/api';

  try {
    const response = await fetch(`${apiUrl}/schemas/${schemaId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to load schema: ${response.statusText}`);
    }
    const { schema, uiSchema } = (await response.json()) as {
      schema: RJSFSchema;
      uiSchema?: UiSchema<Record<string, unknown>>;
      schemaId: string;
    };

    const result = { schema, uiSchema, schemaId };
    schemaCache.set(schemaId, result);

    return result;
  } catch (error) {
    console.error(`Failed to load schema by ID: ${schemaId}`, error);
    const errorMessage = t ? t('schema_load_error', { schemaName: schemaId }) : `Could not load schema: ${schemaId}`;
    throw new Error(errorMessage);
  }
}

/**
 * Validate all errand form data against their schemas
 * Returns array of error messages, empty if all valid
 * @param formDataEntries - Array of form data entries to validate
 * @param t - Optional translation function for error messages
 */
export async function validateErrandFormData(
  formDataEntries: ErrandFormDataItem[] | undefined,
  t?: TFunction
): Promise<string[]> {
  if (!formDataEntries || formDataEntries.length === 0) return [];

  const errors: string[] = [];

  for (const entry of formDataEntries) {
    if (!entry.schemaName) continue;

    try {
      const { schema } = await loadFormSchema(entry.schemaName, t);
      const parsedData: unknown = entry.data ? JSON.parse(entry.data) : {};
      const { errors: validationErrors } = validatorAjv8.validateFormData(parsedData, schema);

      if (validationErrors.length > 0) {
        const schemaTitle = schema.title ?? entry.schemaName;
        errors.push(`${schemaTitle}: ${validationErrors[0].message}`);
      }
    } catch {
      const errorMessage =
        t ? t('schema_validation_error', { schemaName: entry.schemaName }) : `Could not validate ${entry.schemaName}`;
      errors.push(errorMessage);
    }
  }

  return errors;
}

export function errandFormDataToJsonParameters(formData: ErrandFormDataItem[] | undefined): JsonParameterDTO[] {
  if (!formData) return [];
  return formData
    .map((entry) => {
      const schemaId = (entry.schemaId ?? '') || getSchemaIdFromCache(entry.schemaName);
      if (!schemaId) return null;
      const value: unknown = JSON.parse(entry.data || '{}');
      return {
        key: entry.schemaName,
        value,
        schemaId,
      };
    })
    .filter((entry): entry is JsonParameterDTO => entry !== null);
}

export function jsonParametersToErrandFormData(jsonParameters: JsonParameterDTO[] | undefined): ErrandFormDataItem[] {
  if (!jsonParameters) return [];
  return jsonParameters.map((param) => ({
    schemaName: param.key,
    schemaId: param.schemaId,
    data: JSON.stringify(param.value ?? {}),
  }));
}
