import type { Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockManualEditStakeholder, mockReporterStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER, MOCK_EMAIL, MOCK_HYPHEN_PERSON_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import {
  addEmployeeStakeholder,
  addStakeholder,
  disclosureByTitle,
  manuallyAddStakeholder,
  manuallyEditStakeholder,
} from '../utils/stakeholder';
import { expect, test } from '../utils/test';

/** Registrerar ärendet och verifierar POST-anropet, motsvarar cy.wait('@createDraftErrand') med assertions */
interface CreateErrandRequestBody {
  parameters?: { key: string; values: string[] }[];
  stakeholders?: unknown[];
}

const registerErrandAndExpectDraft = async (page: Page, expectedStakeholderCount: number) => {
  const registerButton = page.getByTestId('register-errand');
  await expect(registerButton).toBeEnabled();
  await registerButton.click();
  await expect(page.getByTestId('submit-logout-button')).toBeEnabled();
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeEnabled();
  const createRequest = page.waitForRequest(
    (request) => request.url().includes('/supportmanagement/errand/create') && request.method() === 'POST'
  );
  await submitButton.click();
  const request = await createRequest;
  const response = await request.response();
  expect(response?.status()).toBe(200);
  const body = request.postDataJSON() as CreateErrandRequestBody;
  expect(body.parameters).toContainEqual({ key: 'eventType', values: ['AVVIKELSE'] });
  expect(body.parameters).toContainEqual({ key: 'eventConcerns', values: ['ENSKILD_BRUKARE'] });
  expect(body.stakeholders?.length).toBe(expectedStakeholderCount);
};

const selectRequiredErrandParameters = async (page: Page) => {
  const eventType = page.getByTestId('event-type-deviation');
  const eventConcerns = page.getByTestId('event-concerns-individual');

  await eventType.check();
  await expect(eventType).toBeChecked();
  await eventConcerns.check();
  await expect(eventConcerns).toBeChecked();
  await expect(eventType).toBeChecked();
};

test.describe('Register new errand page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
    await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
    // Cypress satte metadata via useMetadataStore.setState; här seedas motsvarande
    // persistade zustand-state i localStorage innan sidan laddas
    await page.addInitScript((metadata) => {
      window.localStorage.setItem('metadata-storage', JSON.stringify({ state: { metadata }, version: 0 }));
    }, mockMetadata);
    await page.goto('/arende/registrera');

    // Visibility alone does not prove that the server-rendered radio controls
    // have hydrated. The reporter is added by a client-side effect, so this is
    // the registration flow's observable readiness boundary.
    await expect(disclosureByTitle(page, 'Rapportör').getByTestId('stakeholder-card')).toHaveCount(1);
  });

  test('Add stakeholders using personnumber and register draft errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await selectRequiredErrandParameters(page);

    //Brukare
    const brukare = disclosureByTitle(page, 'Brukare');
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    //Övriga parter
    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    for (const role of ['CONTACT', 'CONTACT']) {
      await addStakeholder(page, ovrigaParter, role);
      await expect(ovrigaParter.getByTestId('edit-card-button').first()).toBeVisible();
      await expect(ovrigaParter.getByTestId('remove-card-button').first()).toBeVisible();
      await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();
    }

    await registerErrandAndExpectDraft(page, 4);
  });

  test('Preserves entered data and stays on the form when registration fails', async ({ page }) => {
    await page.route('**/supportmanagement/errand/create', jsonRoute({ message: 'Upstream unavailable' }, 502));
    await expect(disclosureByTitle(page, 'Rapportör').getByTestId('stakeholder-card')).toHaveCount(1);
    await selectRequiredErrandParameters(page);

    await page.getByTestId('register-errand').click();
    const failedResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/supportmanagement/errand/create') && response.request().method() === 'POST'
    );
    await page.getByTestId('submit-button').click();
    const response = await failedResponse;
    expect(response.status()).toBe(502);

    await expect(page).toHaveURL(/\/arende\/registrera$/);
    await expect(page.getByTestId('event-type-deviation')).toBeChecked();
    await expect(page.getByTestId('event-concerns-individual')).toBeChecked();
    await expect(page.getByText('Något gick fel när ärendet sparades')).toBeVisible();
    await expect(page.getByText('Ärendet skickades in')).toHaveCount(0);
  });

  test('Manually add stakeholders and register errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await selectRequiredErrandParameters(page);

    //Brukare
    const brukare = disclosureByTitle(page, 'Brukare');
    await brukare.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(brukare.getByTestId('reporter-card')).toHaveCount(0);
    await brukare.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    //Övriga parter
    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('reporter-card')).toHaveCount(0);
    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await registerErrandAndExpectDraft(page, 3);
  });

  test('Manually edit stakeholder and remove stakeholder', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await selectRequiredErrandParameters(page);

    //Brukare
    const brukare = disclosureByTitle(page, 'Brukare');
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);
    await brukare.getByTestId('remove-card-button').dispatchEvent('click');
    await expect(brukare.getByTestId('add-manual-person-button')).toBeVisible();
    await addStakeholder(page, brukare, 'PRIMARY');
    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);
    await brukare.getByTestId('edit-card-button').dispatchEvent('click');

    await manuallyEditStakeholder(page, mockStakeholder);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    const stakeholderCard = brukare.getByTestId('stakeholder-card');
    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Ärendeägare');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockStakeholder.firstName ?? ''} ${mockStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toContainText(MOCK_HYPHEN_PERSON_NUMBER);
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toContainText(
      `${mockStakeholder.address ?? ''} ${mockStakeholder.city ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);
    await brukare.getByTestId('edit-card-button').dispatchEvent('click');

    await manuallyEditStakeholder(page, mockStakeholder);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(brukare.getByTestId('edit-card-button')).toBeVisible();
    await expect(brukare.getByTestId('remove-card-button')).toBeVisible();
    await expect(brukare.getByTestId('add-manual-person-button')).toHaveCount(0);

    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Ärendeägare');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockManualEditStakeholder.firstName ?? ''} ${mockManualEditStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toContainText(MOCK_HYPHEN_PERSON_NUMBER);
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toContainText(
      `${mockManualEditStakeholder.address ?? ''} ${mockManualEditStakeholder.city ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText('');
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    await registerErrandAndExpectDraft(page, 2);
  });

  test('Manually edit employee stakeholder and remove stakeholder', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    //Om ärendet
    await selectRequiredErrandParameters(page);

    //Övriga parter
    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await addEmployeeStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();
    await ovrigaParter.getByTestId('remove-card-button').dispatchEvent('click');

    await addEmployeeStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();
    await ovrigaParter.getByTestId('edit-card-button').dispatchEvent('click');

    await manuallyEditStakeholder(page, mockReporterStakeholder);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    const stakeholderCard = ovrigaParter.getByTestId('stakeholder-card');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Kontaktperson');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockReporterStakeholder.firstName ?? ''} ${mockReporterStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-title')).toContainText(mockReporterStakeholder.title ?? '');
    await expect(stakeholderCard.getByTestId('stakeholder-department')).toContainText(
      mockReporterStakeholder.department ?? ''
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);
    await ovrigaParter.getByTestId('edit-card-button').dispatchEvent('click');

    await manuallyEditStakeholder(page, mockReporterStakeholder);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Kontaktperson');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockManualEditStakeholder.firstName ?? ''} ${mockManualEditStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-title')).toContainText(mockReporterStakeholder.title ?? '');
    await expect(stakeholderCard.getByTestId('stakeholder-department')).toContainText(
      mockReporterStakeholder.department ?? ''
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText('');
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    await registerErrandAndExpectDraft(page, 2);
  });

  test('Reporter information should be displayed', async ({ page }) => {
    const rapportor = disclosureByTitle(page, 'Rapportör');
    const stakeholderCard = rapportor.getByTestId('stakeholder-card');
    await expect(stakeholderCard.getByTestId('stakeholder-role')).toContainText('Rapportör');
    await expect(stakeholderCard.getByTestId('stakeholder-title')).toContainText(mockReporterStakeholder.title ?? '');
    await expect(stakeholderCard.getByTestId('stakeholder-department')).toContainText(
      mockReporterStakeholder.department ?? ''
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toHaveCount(0);
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockReporterStakeholder.firstName ?? ''} ${mockReporterStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    // Rapportörens uppgifter går numera att redigera, men kortet kan inte tas bort
    await expect(rapportor.getByTestId('edit-card-button')).toBeVisible();
    await expect(rapportor.getByTestId('remove-card-button')).toHaveCount(0);
    await expect(rapportor.getByTestId('add-manual-person-button')).toHaveCount(0);
  });

  // TODO: Add test for registering complete errand when frontend functionality is ready
});
