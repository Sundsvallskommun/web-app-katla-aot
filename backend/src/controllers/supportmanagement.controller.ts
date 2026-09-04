import { Body, Controller, Get, Param, Patch, Post, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Errand, MetadataResponse, PageErrand, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
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

// routing-controllers does not whitelist query params: keys the DTO never declared still reach
// the handler, so the key needs the same distrust as the value. A field name cannot contain a
// quote or comma, which is what it would take to close the literal and add a condition.
const SAFE_FILTER_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.]*$/;

// A stakeholder's externalId holds the organisation's party id.
const ORGANIZATION_FILTER_KEY = 'stakeholders.externalId';

const PRIMARY_STAKEHOLDER_ROLE = 'PRIMARY';

/**
 * Party ids of the organisations the logged-in citizen may see errands for.
 *
 * Read from the session only — never from the request — so a client cannot widen its own scope.
 * Fails closed: no organisations in the session means no errand query at all.
 */
const requireOrganizationPartyIds = (req: RequestWithUser): string[] => {
  const partyIds = (req.session.representingBusinessChoices ?? []).map(organization => organization.partyId);

  if (partyIds.length === 0) {
    throw new HttpException(403, 'No organization in session to scope the errand query to');
  }

  return partyIds;
};

const isPrimaryStakeholder = (stakeholder: Stakeholder): boolean => stakeholder.role === PRIMARY_STAKEHOLDER_ROLE;

/**
 * Whether the errand's primary stakeholder is one of the session's organisations.
 *
 * The upstream filter is the belt and this is the braces: a filter that is wrong, dropped or
 * loosened upstream would otherwise hand back another organisation's errand silently.
 */
const belongsToOrganizations = (errand: Errand, organizationPartyIds: string[]): boolean => {
  const primaryExternalId = errand.stakeholders?.find(isPrimaryStakeholder)?.externalId;

  return primaryExternalId !== undefined && organizationPartyIds.includes(primaryExternalId);
};

const toFilterTerm = (key: string, value: string): string => {
  if (!SAFE_FILTER_KEY_PATTERN.test(key)) {
    throw new HttpException(400, 'Invalid filter key');
  }

  if (!SAFE_FILTER_VALUE_PATTERN.test(value)) {
    throw new HttpException(400, 'Invalid filter value');
  }

  return `${key}:'${value}'`;
};

// SupportManagement uses the Spring filter grammar: terms are joined with `and`, alternatives are
// an `or` group in parentheses. Commas are not an operator — joining with one silently produces a
// filter that does not mean what it reads like.
const FILTER_AND = ' and ';

const toFilterOrGroup = (key: string, values: string[]): string => `(${values.map(value => toFilterTerm(key, value)).join(' or ')})`;

@Controller()
export class SupportManagementController {
  private apiService = new ApiService();
  private apiBase = getApiBase('supportmanagement');

  /**
   * Upstream accepts any errand id in the namespace, so knowing an id is enough to patch someone
   * else's errand. Ownership is enforced here: only the citizen who registered the errand, named
   * by their party id in reporterUserId, may change it.
   *
   * An errand with no reporterUserId (not registered through this app) is owned by nobody and
   * cannot be edited here.
   */
  private async assertErrandOwnedByUser(id: string, req: RequestWithUser): Promise<void> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}`;
    const baseURL = apiURL(this.apiBase);

    const res = await this.apiService.get<Partial<Errand>>({ baseURL, url, propagateClientError: true }, req);
    const reporterUserId = res.data?.reporterUserId;

    // Party ids are guids; a casing difference between sources must not lock a citizen out of
    // their own errand.
    if (reporterUserId?.toLowerCase() !== req.user.partyId.toLowerCase()) {
      throw new HttpException(403, 'Errand belongs to another user');
    }
  }

  @Post('/supportmanagement/errand/create')
  @OpenAPI({ summary: 'Create new errand' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async createErrand(@Req() req: RequestWithUser, @Body() errand: ErrandDTO): Promise<ErrandDTO> {
    const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const baseURL = apiURL(this.apiBase);

    // routing-controllers binds body fields the DTO declares even when the client should never
    // send them. id and errandNumber are assigned upstream and must not exist on a new errand.
    const { id: _id, errandNumber: _errandNumber, ...newErrand } = errand;

    const errandInformation = {
      ...(newErrand as Errand),
      reporterUserId: req.user.partyId,
      stakeholders: newErrand.stakeholders?.map(mapStakeholderDTOToStakeholder),
    };

    const res = await this.apiService.post<Partial<Errand>>({ baseURL, url, data: errandInformation, propagateClientError: true }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when creating errand');

    const resStakeholders = res.data.stakeholders;
    if (!resStakeholders) throw new HttpException(502, 'No stakeholders in response when creating errand');

    const stakeholders = resStakeholders.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req));

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

    await this.assertErrandOwnedByUser(id, req);

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

    const stakeholders = res.data.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? [];

    return {
      ...res.data,
      stakeholders,
    };
  }

  @Get('/supportmanagement/errand/:errandNumber')
  @OpenAPI({ summary: 'Read one errand belonging to the session organisations' })
  @UseBefore(authMiddleware)
  @ResponseSchema(ErrandDTO)
  async getErrand(@Req() req: RequestWithUser, @Param('errandNumber') errandNumber: string): Promise<ErrandDTO> {
    const organizationPartyIds = requireOrganizationPartyIds(req);

    const filter = [toFilterTerm('errandNumber', errandNumber), toFilterOrGroup(ORGANIZATION_FILTER_KEY, organizationPartyIds)].join(FILTER_AND);
    const params = new URLSearchParams({ filter });
    const url = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands?${params.toString()}`;

    const res = await this.apiService.get<PageErrand>({ url }, req);
    if (!res.data) throw new HttpException(502, 'Invalid response when reading errand');

    const matchedErrand = res.data.content?.[0];

    // 404, not 403: errand numbers are enumerable, so another organisation's errand must be
    // indistinguishable from one that does not exist.
    if (!matchedErrand || !belongsToOrganizations(matchedErrand, organizationPartyIds)) {
      throw new HttpException(404, 'Errand not found');
    }

    const stakeholders = matchedErrand.stakeholders?.map(stakeholder => mapStakeholderToStakeholderDTO(stakeholder, req)) ?? [];

    return {
      ...matchedErrand,
      stakeholders,
    };
  }

  @Get('/supportmanagement/errands')
  @OpenAPI({ summary: 'Read matching errands' })
  @UseBefore(authMiddleware)
  @ResponseSchema(PageErrandDTO)
  async getErrands(@Req() req: RequestWithUser, @QueryParams() query: ErrandsQueryDTO): Promise<PageErrand> {
    const organizationPartyIds = requireOrganizationPartyIds(req);
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands`;
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append('page', String(query.page));
    if (query.size !== undefined) params.append('size', String(query.size));
    if (query.sort !== undefined) params.append('sort', query.sort);

    const filterParts = [toFilterOrGroup(ORGANIZATION_FILTER_KEY, organizationPartyIds)];
    const queryEntries = query as unknown as Record<string, unknown>;

    for (const key of Object.keys(queryEntries)) {
      if (['page', 'size', 'sort'].includes(key)) continue;
      if (key === ORGANIZATION_FILTER_KEY) throw new HttpException(400, 'Organization scope is set by the server');
      const value = toFilterValue(queryEntries[key]);

      if (value !== undefined) {
        filterParts.push(toFilterTerm(key, value));
      }
    }

    params.append('filter', filterParts.join(FILTER_AND));

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
    const organizationPartyIds = requireOrganizationPartyIds(req);
    const baseUrl = `${this.apiBase}/${MUNICIPALITY_ID}/${NAMESPACE}/errands/count`;
    const params = new URLSearchParams();

    const filterParts = [toFilterOrGroup(ORGANIZATION_FILTER_KEY, organizationPartyIds)];
    const queryEntries = query as unknown as Record<string, unknown>;

    for (const key of Object.keys(queryEntries)) {
      if (key === ORGANIZATION_FILTER_KEY) throw new HttpException(400, 'Organization scope is set by the server');
      const value = toFilterValue(queryEntries[key]);

      if (value !== undefined) {
        filterParts.push(toFilterTerm(key, value));
      }
    }

    params.append('filter', filterParts.join(FILTER_AND));

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
