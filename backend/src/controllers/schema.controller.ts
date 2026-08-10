import { Response } from 'express';
import { Controller, Get, Param, Req, Res, UseBefore } from 'routing-controllers';

import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { JsonSchema, UiSchema } from '@/data-contracts/jsonschema/data-contracts';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { apiURL } from '@/utils/util';

@Controller()
export class SchemaController {
  private apiService = new ApiService();
  private apiBase = getApiBase('jsonschema');

  private async fetchUiSchema(schemaId: string | undefined, req: RequestWithUser): Promise<Record<string, unknown>> {
    try {
      const uiRes = await this.apiService.get<UiSchema>(
        {
          baseURL: apiURL(this.apiBase),
          url: `${MUNICIPALITY_ID}/schemas/${schemaId}/ui-schema`,
        },
        req,
      );
      return (uiRes.data.value as Record<string, unknown>) ?? {};
    } catch {
      logger.info(`No UI schema found for ${schemaId}, using empty object`);
      return {};
    }
  }

  @Get('/schemas/:schemaId')
  @UseBefore(authMiddleware)
  async getSchemaById(@Param('schemaId') schemaId: string, @Req() req: RequestWithUser, @Res() response: Response): Promise<Response> {
    try {
      const schemaRes = await this.apiService.get<JsonSchema>(
        {
          baseURL: apiURL(this.apiBase),
          url: `${MUNICIPALITY_ID}/schemas/${schemaId}`,
        },
        req,
      );

      const schema = schemaRes.data.value as Record<string, unknown>;
      const uiSchema = await this.fetchUiSchema(schemaId, req);

      return response.json({ schema, uiSchema, schemaId });
    } catch (error) {
      console.error('Error loading schema:', error);
      return response.status(500).json({
        error: 'Failed to load schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Get('/schemas/latest/:schemaName')
  @UseBefore(authMiddleware)
  async getLatestSchema(@Param('schemaName') schemaName: string, @Req() req: RequestWithUser, @Res() response: Response): Promise<Response> {
    try {
      const latestRes = await this.apiService.get<JsonSchema>(
        {
          baseURL: apiURL(this.apiBase),
          url: `${MUNICIPALITY_ID}/schemas/${schemaName}/versions/latest`,
        },
        req,
      );

      const schemaId = latestRes.data.id;
      const schema = latestRes.data.value as Record<string, unknown>;
      const uiSchema = await this.fetchUiSchema(schemaId, req);

      return response.json({ schema, uiSchema, schemaId });
    } catch (error) {
      console.error('Error loading schema:', error);
      return response.status(500).json({
        error: 'Failed to load schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
