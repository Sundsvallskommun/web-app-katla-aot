import type { MyOrganizationsDTO, OrganizationDTO } from '@data-contracts/backend/data-contracts';

export const mockOrganization: OrganizationDTO = {
  partyId: 'f1e2d3c4-0000-4000-8000-000000000001',
  organizationNumber: '5560000001',
  organizationName: 'Acme Restaurang AB',
  isAuthorizedSignatory: true,
};

export const mockSecondOrganization: OrganizationDTO = {
  partyId: 'f1e2d3c4-0000-4000-8000-000000000002',
  organizationNumber: '5560000002',
  organizationName: 'Bolaget Krog HB',
  isAuthorizedSignatory: false,
};

// Two organisations so the registration flow has a choice to make; a single one is preselected
// and would never exercise the picker.
export const getMyOrganizations: MyOrganizationsDTO = {
  organizations: [mockOrganization, mockSecondOrganization],
};
