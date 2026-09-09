import { MUNICIPALITY_ID } from '@/config';
import { JsonSchema } from '@/data-contracts/jsonschema/data-contracts';

import aotSchema from './aot-schema.json';
import aotUiSchema from './aot-ui-schema.json';

/**
 * FIXME: temporary stand-in for the jsonschema microservice. The AoT schema is still being
 * designed and has not been published upstream, so it is served from disk. Delete this module
 * and its three call sites in schema.controller.ts once the schema exists in the service.
 *
 * Both JSON files are generated — do not edit them by hand. `docs/jsonschemas/build-ui-schema.mjs`
 * turns the OpenE export for flow 2181 into the two request bodies the jsonschema service takes,
 * and these are copies of that output. The generator also forces `$schema` to 2020-12; the export
 * declares draft-07, which Ajv2020 refuses to compile.
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
