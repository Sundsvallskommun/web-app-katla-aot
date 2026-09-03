import type { Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockManualEditStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER, MOCK_EMAIL, MOCK_HYPHEN_PERSON_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import {
  addStakeholder,
  disclosureByTitle,
  manuallyAddStakeholder,
  manuallyEditStakeholder,
} from '../utils/stakeholder';
import { expect, test } from '../utils/test';

interface CreateErrandRequestBody {
  jsonParameters?: { key: string; value: unknown; schemaId: string }[];
  parameters?: { key: string; values: string[] }[];
  stakeholders?: unknown[];
}

/**
 * Opens the confirmation dialog and returns the submit button. Shared by successful and failed
 * registrations so both paths go through the same checks.
 */
const openRegistrationConfirmation = async (page: Page) => {
  const registerButton = page.getByTestId('register-errand');
  await expect(registerButton).toBeEnabled();
  await registerButton.click();
  await expect(page.getByTestId('submit-logout-button')).toBeEnabled();
  const submitButton = page.getByTestId('submit-button');
  await expect(submitButton).toBeEnabled();
  return submitButton;
};

const registerErrandAndExpectDraft = async (page: Page, expectedStakeholderCount: number) => {
  const submitButton = await openRegistrationConfirmation(page);
  const createRequest = page.waitForRequest(
    (request) => request.url().includes('/supportmanagement/errand/create') && request.method() === 'POST'
  );
  await submitButton.click();
  const request = await createRequest;
  const response = await request.response();
  expect(response?.status()).toBe(200);
  const body = request.postDataJSON() as CreateErrandRequestBody;
  // The form has no fields until the AoT schemas exist, so the errand should go out with no
  // parameters and no schema answers — only the stakeholders carry information so far.
  expect(body.parameters ?? []).toEqual([]);
  expect(body.jsonParameters).toEqual([]);
  expect(body.stakeholders?.length).toBe(expectedStakeholderCount);
};

test.describe('Register new errand page', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.goto(appUrl('/arende/registrera'));

    // Visible sections do not prove the server-rendered page has hydrated.
    // The client enables the register button, so it is the flow's readiness boundary.
    await expect(page.getByTestId('register-errand')).toBeEnabled();
  });

  test('Shows the section scaffolding while the AoT fields are not built yet', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    for (const title of ['Om ärendet', 'Ärendeägare', 'Övriga parter']) {
      await expect(disclosureByTitle(page, title)).toBeVisible();
    }

    // These sections belong to the app this one was cloned from and must not remain.
    await expect(disclosureByTitle(page, 'Brukare')).toHaveCount(0);
    await expect(disclosureByTitle(page, 'Rapportör')).toHaveCount(0);

    await expect(page.getByRole('heading', { name: '2. Ärendeuppgifter' })).toBeVisible();
  });

  test('Registers an errand without any form fields filled in', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    await registerErrandAndExpectDraft(page, 0);
  });

  test('Adds a stakeholder using personnumber and registers the errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await addStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button').first()).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button').first()).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await registerErrandAndExpectDraft(page, 1);
  });

  test('Preserves entered data and stays on the form when registration fails', async ({ page }) => {
    await page.route('**/supportmanagement/errand/create', jsonRoute({ message: 'Upstream unavailable' }, 502));

    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await addStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('stakeholder-card')).toHaveCount(1);

    const submitButton = await openRegistrationConfirmation(page);
    const failedResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/supportmanagement/errand/create') && response.request().method() === 'POST'
    );
    await submitButton.click();
    const response = await failedResponse;
    expect(response.status()).toBe(502);

    await expect(page).toHaveURL(/\/arende\/registrera$/);
    await expect(ovrigaParter.getByTestId('stakeholder-card')).toHaveCount(1);
    await expect(page.getByText('Något gick fel när ärendet sparades')).toBeVisible();
    await expect(page.getByText('Ärendet skickades in')).toHaveCount(0);
  });

  test('Manually adds a stakeholder and registers the errand', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');

    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);
    await expect(ovrigaParter.getByTestId('stakeholder-card')).toHaveCount(0);

    await ovrigaParter.getByTestId('add-manual-person-button').dispatchEvent('click');
    await manuallyAddStakeholder(page);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('remove-card-button')).toBeVisible();
    await expect(ovrigaParter.getByTestId('add-manual-person-button')).toBeVisible();

    await registerErrandAndExpectDraft(page, 1);
  });

  test('Manually edits and removes a stakeholder', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();

    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await addStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('edit-card-button')).toBeVisible();
    await ovrigaParter.getByTestId('remove-card-button').dispatchEvent('click');
    await expect(ovrigaParter.getByTestId('stakeholder-card')).toHaveCount(0);

    await addStakeholder(page, ovrigaParter, 'CONTACT');
    await ovrigaParter.getByTestId('edit-card-button').dispatchEvent('click');

    await manuallyEditStakeholder(page, mockStakeholder);
    await page.getByTestId('modal-cancel-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    const stakeholderCard = ovrigaParter.getByTestId('stakeholder-card');
    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockStakeholder.firstName ?? ''} ${mockStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-personNumber')).toContainText(MOCK_HYPHEN_PERSON_NUMBER);
    await expect(stakeholderCard.getByTestId('stakeholder-email')).toContainText(MOCK_EMAIL);
    await expect(stakeholderCard.getByTestId('stakeholder-phonenumber')).toContainText(MOCK_COUNTRY_CODE_PHONE_NUMBER);

    await ovrigaParter.getByTestId('edit-card-button').dispatchEvent('click');
    await manuallyEditStakeholder(page, mockStakeholder);
    await page.getByTestId('modal-add-person-button').click();
    await expect(page.getByTestId('manual-person-modal')).toHaveCount(0);

    await expect(stakeholderCard.getByTestId('stakeholder-name')).toContainText(
      `${mockManualEditStakeholder.firstName ?? ''} ${mockManualEditStakeholder.lastName ?? ''}`
    );
    await expect(stakeholderCard.getByTestId('stakeholder-address')).toContainText(
      `${mockManualEditStakeholder.address ?? ''} ${mockManualEditStakeholder.city ?? ''}`
    );

    await registerErrandAndExpectDraft(page, 1);
  });
});
