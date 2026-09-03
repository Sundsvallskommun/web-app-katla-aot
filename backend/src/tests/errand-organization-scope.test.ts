// Errands may only ever be fetched for the organisations the session belongs to. The scope comes
// from the session, so these tests drive the controller directly with the session they want.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { ErrandsQueryDTO } from '@/responses/supportmanagement.response';

const { get } = vi.hoisted(() => ({ get: vi.fn<(config: { url: string }) => Promise<{ data: unknown }>>() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = get;
    patch = vi.fn();
    post = vi.fn();
    put = vi.fn();
    delete = vi.fn();
  },
}));

const requestWithOrganizations = (organizationPartyIds?: string[]) => ({ user: { username: 'user1' }, session: { organizationPartyIds } }) as never;

const asQuery = (query: Record<string, unknown>): ErrandsQueryDTO => query;
// Read the param back rather than decoding the raw URL: URLSearchParams encodes the spaces in
// `and`/`or` as '+', which decodeURIComponent leaves alone.
const requestedFilter = (): string => new URLSearchParams(get.mock.calls[0]?.[0].url.split('?')[1] ?? '').get('filter') ?? '';

describe('errand organization scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: { content: [], count: 0 } });
  });

  it('scopes the listing to the organisation in the session', async () => {
    await new SupportManagementController().getErrands(requestWithOrganizations(['org-1']), asQuery({}));

    expect(requestedFilter()).toContain("stakeholders.externalId:'org-1'");
  });

  it('keeps the organisation scope alongside a client filter', async () => {
    await new SupportManagementController().getErrands(requestWithOrganizations(['org-1']), asQuery({ status: 'NEW' }));

    const filter = requestedFilter();
    expect(filter).toContain("stakeholders.externalId:'org-1'");
    expect(filter).toContain("status:'NEW'");
  });

  // Spring filter grammar: alternatives are an `or` group, terms are joined with `and`. A comma
  // is not an operator, so joining with one would not mean what it reads like.
  it('ORs the organisations together into one group', async () => {
    await new SupportManagementController().getErrands(requestWithOrganizations(['org-1', 'org-2']), asQuery({}));

    expect(requestedFilter()).toContain("(stakeholders.externalId:'org-1' or stakeholders.externalId:'org-2')");
  });

  it('ANDs a client filter onto the organisation group rather than widening it', async () => {
    await new SupportManagementController().getErrands(requestWithOrganizations(['org-1', 'org-2']), asQuery({ status: 'NEW' }));

    expect(requestedFilter()).toBe("(stakeholders.externalId:'org-1' or stakeholders.externalId:'org-2') and status:'NEW'");
  });

  it('refuses to fetch errands when the session carries no organisation', async () => {
    await expect(new SupportManagementController().getErrands(requestWithOrganizations(undefined), asQuery({}))).rejects.toMatchObject({
      status: 403,
    });

    expect(get).not.toHaveBeenCalled();
  });

  it('refuses an empty organisation list rather than fetching everything', async () => {
    await expect(new SupportManagementController().getErrands(requestWithOrganizations([]), asQuery({}))).rejects.toMatchObject({ status: 403 });

    expect(get).not.toHaveBeenCalled();
  });

  it('rejects a client attempt to set the organisation scope itself', async () => {
    const query = asQuery({ 'stakeholders.externalId': 'someone-elses-org' });

    await expect(new SupportManagementController().getErrands(requestWithOrganizations(['org-1']), query)).rejects.toMatchObject({ status: 400 });

    expect(get).not.toHaveBeenCalled();
  });

  describe('reading one errand by errand number', () => {
    const errandOwnedBy = (partyId: string) => ({
      data: { content: [{ errandNumber: 'AIA-25120019', stakeholders: [{ role: 'PRIMARY', externalId: partyId }] }] },
    });

    it('returns a draft whose primary stakeholder is one of the session organisations', async () => {
      get.mockResolvedValue(errandOwnedBy('org-1'));

      const errand = await new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), 'AIA-25120019');

      expect(errand.errandNumber).toBe('AIA-25120019');
    });

    it('ANDs the errand number with the organisation group', async () => {
      get.mockResolvedValue(errandOwnedBy('org-1'));

      await new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), 'AIA-25120019');

      expect(requestedFilter()).toContain("errandNumber:'AIA-25120019' and (stakeholders.externalId:'org-1')");
    });

    // The upstream filter should already exclude this. The check must not depend on that.
    it('hides an errand whose primary stakeholder is another organisation, even if upstream returns it', async () => {
      get.mockResolvedValue(errandOwnedBy('someone-elses-org'));

      await expect(new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), 'AIA-25120019')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('hides an errand that has no primary stakeholder at all', async () => {
      get.mockResolvedValue({ data: { content: [{ errandNumber: 'AIA-25120019', stakeholders: [{ role: 'CONTACT', externalId: 'org-1' }] }] } });

      await expect(new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), 'AIA-25120019')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('reports a missing errand the same way as one belonging to another organisation', async () => {
      get.mockResolvedValue({ data: { content: [] } });

      await expect(new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), 'AIA-25999999')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('refuses to read an errand when the session carries no organisation', async () => {
      await expect(new SupportManagementController().getErrand(requestWithOrganizations(undefined), 'AIA-25120019')).rejects.toMatchObject({
        status: 403,
      });

      expect(get).not.toHaveBeenCalled();
    });

    it('rejects an errand number that would break out of the upstream filter literal', async () => {
      await expect(new SupportManagementController().getErrand(requestWithOrganizations(['org-1']), "ABC' or status:'NEW")).rejects.toMatchObject({
        status: 400,
      });

      expect(get).not.toHaveBeenCalled();
    });
  });

  it('applies the same rules to the count endpoint', async () => {
    await expect(new SupportManagementController().getNumberOfErrands(requestWithOrganizations(undefined), asQuery({}))).rejects.toMatchObject({
      status: 403,
    });

    get.mockResolvedValue({ data: { count: 2 } });
    await new SupportManagementController().getNumberOfErrands(requestWithOrganizations(['org-1']), asQuery({}));

    expect(requestedFilter()).toContain("stakeholders.externalId:'org-1'");
  });
});
