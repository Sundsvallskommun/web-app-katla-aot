import { MUNICIPALITY_ID } from '@/config';
import { JsonSchema } from '@/data-contracts/jsonschema/data-contracts';

import folkolServingNotification from './aot-alcohol-folkol-serving-notification.schema.json';
import folkolServingNotificationUi from './aot-alcohol-folkol-serving-notification.ui-schema.json';
import farmSales from './aot-alcohol-serving-permit-application-farm-sales.schema.json';
import farmSalesUi from './aot-alcohol-serving-permit-application-farm-sales.ui-schema.json';
import permanentCatering from './aot-alcohol-serving-permit-application-permanent-catering.schema.json';
import permanentCateringUi from './aot-alcohol-serving-permit-application-permanent-catering.ui-schema.json';
import permanentServing from './aot-alcohol-serving-permit-application-permanent-serving.schema.json';
import permanentServingUi from './aot-alcohol-serving-permit-application-permanent-serving.ui-schema.json';
import tasting from './aot-alcohol-serving-permit-application-tasting.schema.json';
import tastingUi from './aot-alcohol-serving-permit-application-tasting.ui-schema.json';
import temporaryServingPrivate from './aot-alcohol-serving-permit-application-temporary-serving-private.schema.json';
import temporaryServingPrivateUi from './aot-alcohol-serving-permit-application-temporary-serving-private.ui-schema.json';
import temporaryServingPublic from './aot-alcohol-serving-permit-application-temporary-serving-public.schema.json';
import temporaryServingPublicUi from './aot-alcohol-serving-permit-application-temporary-serving-public.ui-schema.json';
import wholeFlow from './aot-schema.json';
import ecigaretteSalesNotification from './aot-tobacco-ecigarette-sales-notification.schema.json';
import ecigaretteSalesNotificationUi from './aot-tobacco-ecigarette-sales-notification.ui-schema.json';
import salesPermitApplication from './aot-tobacco-sales-permit-application.schema.json';
import salesPermitApplicationUi from './aot-tobacco-sales-permit-application.ui-schema.json';
import tobaccoFreeNicotineSalesNotification from './aot-tobacco-tobacco-free-nicotine-sales-notification.schema.json';
import tobaccoFreeNicotineSalesNotificationUi from './aot-tobacco-tobacco-free-nicotine-sales-notification.ui-schema.json';
import wholeFlowUi from './aot-ui-schema.json';

/**
 * FIXME: temporary stand-in for the jsonschema microservice. The AoT schemas are still being
 * designed and have not been published upstream, so they are served from disk. Delete this module
 * and its three call sites in schema.controller.ts once they exist in the service.
 *
 * Every JSON file here is generated — do not edit them by hand. `docs/jsonschemas/build-ui-schema.mjs`
 * turns the OpenE exports for flows 2181 (alkohol) and 2153 (tobak) into the request bodies the
 * jsonschema service takes, one pair per errand-type leaf plus the whole undivided alcohol flow. The
 * generator also forces `$schema` to 2020-12; the exports declare draft-07, which Ajv2020 refuses to
 * compile.
 *
 * A schema is named after the app's SupportManagement namespace and the whole categorization path
 * that selects it, lowercased. The frontend derives the name the same way, so no lookup table is
 * needed on either side.
 */

interface StoredSchema {
  name: string;
  version: string;
  value: unknown;
  description?: string;
}

interface StoredUiSchema {
  value: Record<string, unknown>;
}

const schemaId = (schema: StoredSchema): string => `${MUNICIPALITY_ID}_${schema.name}_${schema.version}`;

/** The generated wire type models `value` as Jackson's JsonNode; the payload is the schema object. */
const asJsonSchema = (schema: StoredSchema): JsonSchema => ({
  ...schema,
  value: schema.value as JsonSchema['value'],
  id: schemaId(schema),
});

const pairs: [StoredSchema, StoredUiSchema][] = [
  [permanentServing, permanentServingUi],
  [temporaryServingPublic, temporaryServingPublicUi],
  [temporaryServingPrivate, temporaryServingPrivateUi],
  [folkolServingNotification, folkolServingNotificationUi],
  [farmSales, farmSalesUi],
  [permanentCatering, permanentCateringUi],
  [tasting, tastingUi],
  // Tobacco, flow 2153. One form per sales type; the nicotine-free one omits the dödskallemärkta
  // question, which its scope rule excludes.
  [salesPermitApplication, salesPermitApplicationUi],
  [ecigaretteSalesNotification, ecigaretteSalesNotificationUi],
  [tobaccoFreeNicotineSalesNotification, tobaccoFreeNicotineSalesNotificationUi],
  // The undivided alcohol flow, kept while the split is being verified against it.
  [wholeFlow, wholeFlowUi],
];

const mockedSchemas: JsonSchema[] = pairs.map(([schema]) => asJsonSchema(schema));

/** UI schemas keyed by schema ID, in the same `value` envelope the API stores them in. */
const mockedUiSchemas: Record<string, Record<string, unknown>> = Object.fromEntries(
  pairs.map(([schema, uiSchema]) => [schemaId(schema), uiSchema.value]),
);

export const mockedSchemaById = (id: string): JsonSchema | undefined => mockedSchemas.find(schema => schema.id === id);

export const mockedSchemaByName = (name: string): JsonSchema | undefined => mockedSchemas.find(schema => schema.name === name);

/** A mocked schema owns its ui schema too, so a mocked form never reaches the jsonschema API. */
export const mockedUiSchemaById = (id: string): Record<string, unknown> | undefined =>
  mockedSchemaById(id) ? (mockedUiSchemas[id] ?? {}) : undefined;
