import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';

import { additionalConverters } from '@/utils/custom-validation-classes';

type OpenApiSchemas = ReturnType<typeof validationMetadatasToSchemas>;
type RoutingControllersOptions = NonNullable<Parameters<typeof routingControllersToSpec>[1]>;

/**
 * Bygger JSON Schema-komponenterna för DTO:erna. Ägs på ett ställe så att appen
 * och kontraktstesterna aldrig kan validera mot olika scheman: utan
 * `additionalConverters` saknar specen nullable-markeringarna från
 * `custom-validation-classes`.
 */
export const buildOpenApiSchemas = (): OpenApiSchemas =>
  validationMetadatasToSchemas({
    classTransformerMetadataStorage: defaultMetadataStorage,
    refPointerPrefix: '#/components/schemas/',
    additionalConverters,
  });

/** Bygger OpenAPI-specen för angivna controllers med samma scheman som servas. */
export const buildOpenApiSpec = (controllers: RoutingControllersOptions['controllers'], routePrefix: string): unknown =>
  routingControllersToSpec(getMetadataArgsStorage(), { routePrefix, controllers }, { components: { schemas: buildOpenApiSchemas() } });
