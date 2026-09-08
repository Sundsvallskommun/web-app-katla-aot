import { MUNICIPALITY_ID } from '@/config';
import { JsonSchema } from '@/data-contracts/jsonschema/data-contracts';

import aotSchema from './aot-schema.json';
import aotUiSchema from './aot-ui-schema.json';

/**
 * FIXME: temporary stand-in for the jsonschema microservice. The AoT schema is still being
 * designed and has not been published upstream, so it is served from disk. Delete this module
 * and its three call sites in schema.controller.ts once the schema exists in the service.
 *
 * aot-schema.json is the OpenE export and aot-ui-schema.json the generated ui schema; both are
 * also kept in docs/jsonschemas/, where the generator lives.
 */

interface StoredSchema {
  name: string;
  version: string;
  value: unknown;
  description?: string;
}

const schemaId = (schema: StoredSchema): string => `${MUNICIPALITY_ID}_${schema.name}_${schema.version}`;

/** The generated wire type models `value` as Jackson's JsonNode; the payload is the schema object. */
const asJsonSchema = (schema: StoredSchema): JsonSchema => ({
  ...schema,
  value: schema.value as JsonSchema['value'],
  id: schemaId(schema),
});

const aotSchemaId = schemaId(aotSchema);
const mockedSchemas: JsonSchema[] = [asJsonSchema(aotSchema)];

/** UI schemas keyed by schema ID, in the same `value` envelope the API stores them in. */
const mockedUiSchemas: Record<string, Record<string, unknown>> = {
  [aotSchemaId]: aotUiSchema.value,
};

export const mockedSchemaById = (id: string): JsonSchema | undefined => mockedSchemas.find(schema => schema.id === id);

export const mockedSchemaByName = (name: string): JsonSchema | undefined => mockedSchemas.find(schema => schema.name === name);

/** A mocked schema owns its ui schema too, so a mocked form never reaches the jsonschema API. */
export const mockedUiSchemaById = (id: string): Record<string, unknown> | undefined =>
  mockedSchemaById(id) ? (mockedUiSchemas[id] ?? {}) : undefined;
