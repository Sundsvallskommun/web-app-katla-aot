import { Controller, Get, Param, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { JsonSchema, UiSchema } from '@/data-contracts/jsonschema/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { SchemaResponseDTO } from '@/responses/schema.response';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { mapSchemaResponse, mapUiSchema } from '@/utils/schema-response-mapping';
import { apiURL } from '@/utils/util';

@Controller()
export class SchemaController {
  private apiService = new ApiService();
  private apiBase = getApiBase('jsonschema');

  private async fetchUiSchema(schemaId: string, req: RequestWithUser): Promise<Record<string, unknown>> {
    try {
      const uiRes = await this.apiService.get<UiSchema>(
        {
          baseURL: apiURL(this.apiBase),
          url: `${MUNICIPALITY_ID}/schemas/${schemaId}/ui-schema`,
        },
        req,
      );
      return mapUiSchema(uiRes.data);
    } catch {
      logger.info(`No UI schema found for ${schemaId}, using empty object`);
      return {};
    }
  }

  @Get('/schemas/:schemaId')
  @OpenAPI({ summary: 'Get a JSON schema by immutable schema ID' })
  @UseBefore(authMiddleware)
  @ResponseSchema(SchemaResponseDTO)
  async getSchemaById(@Param('schemaId') schemaId: string, @Req() req: RequestWithUser): Promise<SchemaResponseDTO> {
    const schemaRes = await this.apiService.get<JsonSchema>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${MUNICIPALITY_ID}/schemas/${schemaId}`,
      },
      req,
    );

    const result = mapSchemaResponse(schemaRes.data, schemaId);
    const uiSchema = await this.fetchUiSchema(result.schemaId, req);

    return { schema: result.schema, schemaId: result.schemaId, uiSchema };
  }

  @Get('/schemas/latest/:schemaName')
  @OpenAPI({ summary: 'Get the latest version of a named JSON schema' })
  @UseBefore(authMiddleware)
  @ResponseSchema(SchemaResponseDTO)
  async getLatestSchema(@Param('schemaName') schemaName: string, @Req() req: RequestWithUser): Promise<SchemaResponseDTO> {
    const latestRes = await this.apiService.get<JsonSchema>(
      {
        baseURL: apiURL(this.apiBase),
        url: `${MUNICIPALITY_ID}/schemas/${schemaName}/versions/latest`,
      },
      req,
    );

    const result = mapSchemaResponse(latestRes.data);
    const uiSchema = await this.fetchUiSchema(result.schemaId, req);

    return { schema: result.schema, schemaId: result.schemaId, uiSchema };
  }
}
