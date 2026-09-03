import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, PageErrand } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { ErrandCountDTO, ErrandDTO, ErrandsQueryDTO, PageErrandDTO } from '@/responses/supportmanagement.response';
import { MetadataResponseDTO } from '@/responses/supportmanagement-metadata.response';
import ApiService from '@/services/api.service';
import { mapStakeholderDTOToStakeholder, mapStakeholderToStakeholderDTO } from '@/utils/stakeholder-mapping';
import { apiURL } from '@/utils/util';

// Builds the filter value; unknown value types are skipped.
const toFilterValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value !== '' ? value : undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

// The upstream filter grammar wraps each value in single quotes. Values come from the client,
// so characters that could end the literal or add a condition are rejected rather than escaped —
// the escaping dialect belongs to upstream and must not be guessed here.
const SAFE_FILTER_VALUE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

const toFilterTerm = (key: string, value: string): string => {
  if (!SAFE_FILTER_VALUE_PATTERN.test(value)) {
    throw new HttpException(400, 'Invalid filter value');
  }

  return `${key}:'${value}'`;
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

  @Patch('/supportmanagement/errand/:id')
  @OpenAPI({ summary: 'Update errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async updateErrand(@Req() req: RequestWithUser, @Param('id') id: string, @Body() errand: Partial<Errand>): Promise<Partial<Errand>> {
    if (!id.trim()) throw new HttpException(400, 'Errand id is required when updating an errand');

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

    // Translate both ways, as on create: the DTO has emails/phoneNumbers/personNumber,
    // upstream Stakeholder has only contactChannels.
    const errandInformation = {
      ...errandData,
      stakeholders: errandData.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    const res = await this.apiService.patch<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when updating errand');

    const stakeholders = await Promise.all(res.data.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? []);

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read maching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<ErrandDTO> {
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?filter=${toFilterTerm('errandNumber', errandNumber)}`;

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
        filterParts.push(toFilterTerm(key, value));
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
        filterParts.push(toFilterTerm(key, value));
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
}
