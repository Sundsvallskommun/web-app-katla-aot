import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, Notification, PageErrand } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import type ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { NotificationAcknowledgementResponse, NotificationDTO } from '@/responses/notification.response';
import { ErrandCountDTO, ErrandDTO, ErrandsQueryDTO, PageErrandDTO } from '@/responses/supportmanagement.response';
import { MetadataResponseDTO } from '@/responses/supportmanagement-metadata.response';
import ApiService from '@/services/api.service';
import { mapStakeholderDTOToStakeholder, mapStakeholderToStakeholderDTO } from '@/utils/stakeholder-mapping';
import { apiURL } from '@/utils/util';

// Bygger filtervärdet på samma sätt som tidigare stränginterpolering; okända värdetyper hoppas över.
const toFilterValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value !== '' ? value : undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

@Controller()
export class SupportManagementController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  @Post('/supportmanagement/errand/create')
  @OpenAPI({ summary: 'Create new errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async createErrand(@Req() req: RequestWithUser, @Body() errand: ErrandDTO): Promise<ErrandDTO> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const baseURL = apiURL(this.apiBase);

    const errandInformation = {
      ...(errand as Errand),
      reporterUserId: req.user.username,
      stakeholders: errand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when creating errand');

    const resStakeholders = res.data.stakeholders;
    if (!resStakeholders) throw new HttpException(502, 'No stakeholders in response when creating errand');

    const stakeholders = await Promise.all(resStakeholders.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)));

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Patch('/supportmanagement/errand/save')
  @OpenAPI({ summary: 'Save an errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async saveErrand(@Req() req: RequestWithUser, @Body() errand: Errand): Promise<Partial<Errand>> {
    if (!errand.id) {
      throw new HttpException(400, 'Errand id is required when saving an errand');
    }

    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${errand.id}`;

    delete errand.activeNotifications;
    delete errand.created;
    delete errand.errandNumber;
    delete errand.id;
    delete errand.reporterUserId;
    delete errand.touched;
    delete errand.modified;

    const errandInformation = {
      ...errand,
      stakeholders: errand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    const baseURL = apiURL(this.apiBase);

    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when saving errand');

    const stakeholders = await Promise.all(res.data.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? []);

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Patch('/supportmanagement/errand/:id')
  @OpenAPI({ summary: 'Update errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async updateErrand(@Req() req: RequestWithUser, @Param('id') id: string, @Body() errand: Partial<Errand>): Promise<Partial<Errand>> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}`;
    const baseURL = apiURL(this.apiBase);
    // Strip read-only fields that the API does not accept on update
    const {
      id: _id,
      errandNumber: _errandNumber,
      created: _created,
      modified: _modified,
      touched: _touched,
      reporterUserId: _reporterUserId,
      activeNotifications: _activeNotifications,
      ...errandData
    } = errand;

    if (!id.trim()) throw new HttpException(400, 'Errand id is required when updating an errand');

    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandData, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when updating errand');

    return res.data;
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<ErrandDTO> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=errandNumber:'${errandNumber}'`;

    const res = await this.apiService.get<PageErrand>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errand');

    const matchedErrand = res.data.content?.[0];
    if (!matchedErrand) throw new HttpException(404, 'Errand not found');

    const stakeholders = await Promise.all(matchedErrand.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? []);

    return {
      ...matchedErrand,
      stakeholders,
    };
  }

  @Get('/supportmanagement/errands')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<PageErrand> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append('page', String(query.page));
    if (query.size !== undefined) params.append('size', String(query.size));
    if (query.sort !== undefined) params.append('sort', query.sort);

    const filterParts: string[] = [];
    const queryEntries = query as unknown as Record<string, unknown>;

    for (const key of Object.keys(queryEntries)) {
      if (['page', 'size', 'sort'].includes(key)) continue;
      const value = toFilterValue(queryEntries[key]);

      if (value !== undefined) {
        filterParts.push(`${key}:'${value}'`);
      }
    }

    if (filterParts.length > 0) {
      params.append('filter', filterParts.join(','));
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    const res = await this.apiService.get<PageErrand>({ url: finalUrl }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errands');

    return res.data;
  }

  @Get('/supportmanagement/count')
  @OpenAPI({ summary: 'Count errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandCountDTO)
  async getNumberOfErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<{ count: number }> {
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands/count`;
    const params = new URLSearchParams();

    const filterParts: string[] = [];
    const queryEntries = query as unknown as Record<string, unknown>;

    for (const key of Object.keys(queryEntries)) {
      const value = toFilterValue(queryEntries[key]);

      if (value !== undefined) {
        filterParts.push(`${key}:'${value}'`);
      }
    }

    if (filterParts.length > 0) {
      params.append('filter', filterParts.join(','));
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    const res = await this.apiService.get<{ count: number }>({ url: finalUrl }, req);
    if (!res.data || typeof res.data.count !== 'number') throw new HttpException(502, 'Invalid response when counting errands');

    return res.data;
  }

  @Get('/supportmanagement/metadata')
  @OpenAPI({ summary: 'Get all metadata for provided namespace and municipality' })
  @UseBefore(authMiddleware)
  @ResponseSchema(MetadataResponseDTO)
  async getMetadata(@Req() req: RequestWithUser): Promise<MetadataResponse> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/metadata`;

    const res = await this.apiService.get<MetadataResponse>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading metadata');

    return res.data;
  }

  @Get('/supportmanagement/notifications')
  @OpenAPI({ summary: 'Get notifications for the namespace and municipality with the specified ownerId' })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationDTO, { isArray: true })
  async getNotifications(@Req() req: RequestWithUser): Promise<Notification[]> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications?ownerId=${req.user.username}`;

    const res = await this.apiService.get<Notification[]>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading notifications');

    return res.data;
  }

  @Patch('/supportmanagement/notifications')
  @OpenAPI({
    summary: 'Acknowledge notifications',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/NotificationDTO' },
          },
        },
      },
    },
  })
  @UseBefore(authMiddleware)
  @ResponseSchema(NotificationAcknowledgementResponse)
  async acknowlegeNotifications(
    @Req() req: RequestWithUser,
    @Body({ required: false }) notifications: NotificationDTO[] | undefined,
  ): Promise<ApiResponse<boolean>> {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new HttpException(400, 'At least one notification is required');
    }

    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/notifications`;

    // SupportManagement acknowledges with 204 No Content. A resolved request is
    // therefore the success signal; the gateway keeps its existing boolean body
    // for Katla clients.
    await this.apiService.patch<undefined>({ url, data: notifications, propagateClientError: true }, req);

    return { data: true, message: 'Success' };
  }
}
