// The picker in the registration form offers what this endpoint returns, and errands are scoped
// by the session list. They must be the same list, or a citizen can file an errand for an
// organisation the session does not carry and never read it back.

import { describe, expect, it } from 'vitest';

import { LegalEntityController } from '@/controllers/legal-entity.controller';
import { HttpException } from '@/exceptions/HttpException';
import { OrganizationDTO } from '@/responses/legal-entity.response';

import { mockCitizenPartyId, mockOrganizationPartyId, mockSecondaryOrganizationPartyId } from './helpers/mock-data';

const organization = (partyId: string): OrganizationDTO => ({
  partyId,
  organizationNumber: `nr-${partyId}`,
  organizationName: `Org ${partyId}`,
  isAuthorizedSignatory: true,
});

const requestWithOrganizations = (organizations?: OrganizationDTO[]) =>
  ({ user: { partyId: mockCitizenPartyId, personNumber: '199001011234' }, session: { representingBusinessChoices: organizations } }) as never;

describe('my organizations', () => {
  it('returns the organizations the session was resolved with', () => {
    const organizations = [organization(mockOrganizationPartyId), organization(mockSecondaryOrganizationPartyId)];

    expect(new LegalEntityController().myOrganizations(requestWithOrganizations(organizations))).toEqual({ organizations });
  });

  it('returns an empty list for a citizen with no engagements', () => {
    expect(new LegalEntityController().myOrganizations(requestWithOrganizations([]))).toEqual({ organizations: [] });
  });

  // A failed lookup at login leaves the session without the list. Answering with an empty one
  // would read as "belongs to nothing", which is the same answer the errand endpoints refuse.
  it('fails closed when the session never got a list', () => {
    expect(() => new LegalEntityController().myOrganizations(requestWithOrganizations())).toThrow(HttpException);
  });
});
