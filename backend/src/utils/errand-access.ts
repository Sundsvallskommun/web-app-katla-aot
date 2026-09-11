import { MUNICIPALITY_ID, NAMESPACE } from '@/config';
import { Errand, Stakeholder } from '@/data-contracts/supportmanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@/services/api.service';
import { apiURL } from '@/utils/util';

const PRIMARY_STAKEHOLDER_ROLE = 'PRIMARY';

const isPrimaryStakeholder = (stakeholder: Stakeholder): boolean => stakeholder.role === PRIMARY_STAKEHOLDER_ROLE;

/**
 * Party ids of the organisations the logged-in citizen may see errands for.
 *
 * Read from the session only — never from the request — so a client cannot widen its own scope.
 * Fails closed: no organisations in the session means no errand query at all.
 */
export const requireOrganizationPartyIds = (req: RequestWithUser): string[] => {
  const partyIds = (req.session.representingBusinessChoices ?? []).map(organization => organization.partyId);

  if (partyIds.length === 0) {
    throw new HttpException(403, 'No organization in session to scope the errand query to');
  }

  return partyIds;
};

/**
 * Whether the errand's primary stakeholder is one of the session's organisations.
 *
 * The upstream filter is the belt and this is the braces: a filter that is wrong, dropped or
 * loosened upstream would otherwise hand back another organisation's errand silently.
 */
export const belongsToOrganizations = (errand: Errand, organizationPartyIds: string[]): boolean => {
  const primaryExternalId = errand.stakeholders?.find(isPrimaryStakeholder)?.externalId;

  return primaryExternalId !== undefined && organizationPartyIds.includes(primaryExternalId);
};

const fetchErrandById = (apiService: ApiService, apiBase: string, id: string, req: RequestWithUser): Promise<Partial<Errand> | undefined> => {
  const url = `${MUNICIPALITY_ID}/${NAMESPACE}/errands/${id}`;
  const baseURL = apiURL(apiBase);

  return apiService.get<Partial<Errand>>({ baseURL, url, propagateClientError: true }, req).then(res => res.data);
};

/**
 * Upstream accepts any errand id in the namespace, so knowing an id is enough to change someone
 * else's errand. Ownership is enforced here: only the citizen who registered the errand, named
 * by their party id in reporterUserId, may change it.
 *
 * An errand with no reporterUserId (not registered through this app) is owned by nobody and
 * cannot be edited here.
 */
export async function assertErrandOwnedByUser(apiService: ApiService, apiBase: string, id: string, req: RequestWithUser): Promise<void> {
  const errand = await fetchErrandById(apiService, apiBase, id, req);

  // Party ids are guids; a casing difference between sources must not lock a citizen out of
  // their own errand.
  if (errand?.reporterUserId?.toLowerCase() !== req.user.partyId.toLowerCase()) {
    throw new HttpException(403, 'Errand belongs to another user');
  }
}

/**
 * Reading is scoped by organisation rather than by reporter, the same rule the errand list uses:
 * a colleague in the same organisation sees the errand, and so must see what is attached to it.
 *
 * 404, not 403: ids are opaque but the distinction would still confirm that an errand exists.
 */
export async function assertErrandReadableByUser(apiService: ApiService, apiBase: string, id: string, req: RequestWithUser): Promise<void> {
  const organizationPartyIds = requireOrganizationPartyIds(req);
  const errand = await fetchErrandById(apiService, apiBase, id, req);

  if (!errand || !belongsToOrganizations(errand, organizationPartyIds)) {
    throw new HttpException(404, 'Errand not found');
  }
}
