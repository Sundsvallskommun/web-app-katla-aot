import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { mockOrganization } from '../fixtures/getMyOrganizations';
import { disclosureByTitle } from './stakeholder';

export const errandOwnerSection = (page: Page): Locator => disclosureByTitle(page, 'Ärendeägare');

/** Picks the errand owner, which registration requires. */
export const selectErrandOwner = async (page: Page, organization = mockOrganization) => {
  const section = errandOwnerSection(page);
  await section.getByTestId('errand-owner-select').selectOption(organization.partyId);

  // The card is the confirmation that the choice reached the form.
  await expect(section.getByTestId('stakeholder-card')).toBeVisible();
  await expect(section.getByTestId('stakeholder-name')).toHaveText(organization.organizationName);
};
