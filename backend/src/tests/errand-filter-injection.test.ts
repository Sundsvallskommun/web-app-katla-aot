// routing-controllers binds query params it never declared onto the DTO, so getErrands iterates
// keys the client chose. Both halves of `key:'value'` are therefore untrusted input.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { ErrandsQueryDTO } from '@/responses/supportmanagement.response';

import { mockCitizenPartyId, mockOrganizationName, mockOrganizationNumber, mockOrganizationPartyId } from './helpers/mock-data';

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

// Errand queries are scoped to the session's organisations, so every request needs one.
const req = {
  user: { partyId: mockCitizenPartyId },
  session: {
    representingBusinessChoices: [
      { partyId: mockOrganizationPartyId, organizationNumber: mockOrganizationNumber, organizationName: mockOrganizationName },
    ],
  },
} as never;
// Mirrors what routing-controllers hands the handler: declared fields plus whatever else the
// client put in the query string.
const asQuery = (query: Record<string, unknown>): ErrandsQueryDTO => query;
const requestedUrl = (): string => get.mock.calls[0]?.[0].url ?? '';
const requestedFilter = (): string | null => new URL(requestedUrl(), 'https://api.example').searchParams.get('filter');

describe('errand filter injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: { content: [] } });
  });

  it('passes a declared filter through', async () => {
    await new SupportManagementController().getErrands(req, asQuery({ status: 'NEW' }));

    expect(decodeURIComponent(requestedUrl())).toContain("status:'NEW'");
  });

  it('rejects a key that would close the quoted literal and add a condition', async () => {
    const query = asQuery({ "x':'1' or reporterUserId": 'someoneelse' });

    await expect(new SupportManagementController().getErrands(req, query)).rejects.toMatchObject({ status: 400 });
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an injected key on the count endpoint too', async () => {
    const query = asQuery({ "x':'1' or status": 'NEW' });

    await expect(new SupportManagementController().getNumberOfErrands(req, query)).rejects.toMatchObject({ status: 400 });
    expect(get).not.toHaveBeenCalled();
  });

  it('still rejects an injected value', async () => {
    await expect(new SupportManagementController().getErrands(req, asQuery({ status: "NEW' or '1'='1" }))).rejects.toMatchObject({ status: 400 });
  });

  // Upstream includes drafts only when the lifecycle term leads the filter, as getErrand builds it.
  it('puts the draft lifecycle term first in the list filter', async () => {
    await new SupportManagementController().getErrands(req, asQuery({ status: 'NEW', lifecycle: 'DRAFT' }));

    expect(requestedFilter()).toBe(`lifecycle:'DRAFT' and (stakeholders.externalId:'${mockOrganizationPartyId}') and status:'NEW'`);
  });

  it('puts the draft lifecycle term first in the count filter', async () => {
    get.mockResolvedValue({ data: { count: 0 } });

    await new SupportManagementController().getNumberOfErrands(req, asQuery({ lifecycle: 'DRAFT' }));

    expect(requestedFilter()).toBe(`lifecycle:'DRAFT' and (stakeholders.externalId:'${mockOrganizationPartyId}')`);
  });

  it('leaves the organisation group first when no draft is asked for', async () => {
    await new SupportManagementController().getErrands(req, asQuery({ lifecycle: 'ACTIVE' }));

    expect(requestedFilter()).toBe(`(stakeholders.externalId:'${mockOrganizationPartyId}') and lifecycle:'ACTIVE'`);
  });
});

// routing-controllers normalises each query field by its design:type. A field typed as an enum
// or union is bound as Object, which makes it JSON-parse the raw value and fail on plain text.
describe('errand query binding', () => {
  it('declares every query field as a primitive', () => {
    const fields = ['page', 'size', 'sort', 'status', 'lifecycle'];

    for (const field of fields) {
      const type: unknown = Reflect.getMetadata('design:type', ErrandsQueryDTO.prototype, field);
      expect([String, Number]).toContain(type);
    }
  });
});
