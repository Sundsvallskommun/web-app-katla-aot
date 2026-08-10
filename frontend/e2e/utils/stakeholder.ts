import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { mockManualEditStakeholder, mockReporterStakeholder, mockStakeholder } from '../fixtures/mockStakeholder';
import {
  MOCK_COUNTRY_CODE_PHONE_NUMBER,
  MOCK_EMAIL,
  MOCK_INVALID_DATE_PERSON_NUMBER,
  MOCK_NON_EXISTENT_PERSON_NUMBER,
  MOCK_PERSON_NUMBER,
  MOCK_PHONE_NUMBER,
} from './constants';
import { emptyRoute, jsonRoute } from './routes';

/** Hittar disclosure-sektionen med angiven rubrik, motsvarar Cypress .contains().closest('.sk-disclosure') */
export const disclosureByTitle = (page: Page, title: string): Locator =>
  page.locator('.sk-disclosure').filter({ has: page.locator('.sk-disclosure-header-title', { hasText: title }) });

/**
 * Knapparna i sök-/formulärsektionerna täcks av en transparent .sk-form-control-wrapper
 * som fångar pekarhändelser, så ett vanligt Playwright-klick når dem inte.
 * Ett syntetiskt klick-event motsvarar hur Cypress klickade på dem.
 */
const syntheticClick = (locator: Locator) => locator.dispatchEvent('click');

export const addStakeholder = async (page: Page, scope: Locator, role: string) => {
  await page.route(`**/citizen/person/${MOCK_PERSON_NUMBER}`, jsonRoute({ ...mockStakeholder, role }));
  await page.route(`**/citizen/person/${MOCK_NON_EXISTENT_PERSON_NUMBER}`, emptyRoute(204));

  const personNumberInput = scope.getByTestId('person-number-input');
  const searchButton = scope.locator('button', { hasText: 'Sök' });

  // Personnummer
  await personNumberInput.fill('PERSONNUMBER');
  await syntheticClick(searchButton);
  await expect(scope.getByTestId('person-number-error')).toBeVisible();
  await personNumberInput.fill(MOCK_NON_EXISTENT_PERSON_NUMBER);
  const emptyPersonResponse = page.waitForResponse(`**/citizen/person/${MOCK_NON_EXISTENT_PERSON_NUMBER}`);
  await syntheticClick(searchButton);
  await emptyPersonResponse;
  await expect(scope.getByTestId('empty-person-error')).toBeVisible();
  await syntheticClick(scope.locator('button[aria-label="Rensa"]'));
  await expect(scope.getByTestId('empty-person-error')).toHaveCount(0);
  await personNumberInput.fill(MOCK_INVALID_DATE_PERSON_NUMBER);
  await syntheticClick(searchButton);
  await expect(scope.getByTestId('person-number-error')).toBeVisible();
  await syntheticClick(scope.locator('button[aria-label="Rensa"]'));
  await expect(scope.getByTestId('person-number-error')).toHaveCount(0);
  await personNumberInput.fill(MOCK_PERSON_NUMBER);
  const personResponse = page.waitForResponse(`**/citizen/person/${MOCK_PERSON_NUMBER}`);
  await syntheticClick(searchButton);
  await personResponse;

  // E-post
  await expect(scope.getByTestId('person-number-error')).toHaveCount(0);
  await expect(scope.getByTestId('email-input-error')).toHaveCount(0);
  await expect(scope.getByTestId('phone-number-input-error')).toHaveCount(0);
  const emailInput = scope.getByTestId('stakeholder-email-input');
  await emailInput.fill('EMAIL');
  await syntheticClick(scope.locator('button', { hasText: 'Lägg till person' }));
  await expect(scope.getByTestId('email-input-error')).toBeVisible();
  await emailInput.fill(MOCK_EMAIL);

  // Telefon
  const phoneInput = scope.getByTestId('stakeholder-mobilephone-input');
  await phoneInput.fill('PHONENUMBER');
  await expect(scope.getByTestId('phone-number-input-error')).toBeVisible();
  await phoneInput.fill(MOCK_PHONE_NUMBER);
  await syntheticClick(scope.locator('button', { hasText: 'Lägg till person' }));
};

export const addEmployeeStakeholder = async (page: Page, scope: Locator, role: string) => {
  await page.route('**/employee/personal/ABC12DEF', jsonRoute({ ...mockReporterStakeholder, role }));
  await page.route('**/employee/personal/ADACCOUNT', emptyRoute(204));

  const personNumberInput = scope.getByTestId('person-number-input');
  const searchButton = scope.locator('button', { hasText: 'Sök' });

  // Sök på AD-konto i stället för personnummer
  await expect(scope.getByTestId('radiobutton-person')).toBeAttached();
  await scope.getByTestId('radiobutton-employee').check();

  await personNumberInput.fill('ADACCOUNT');
  const emptyPersonResponse = page.waitForResponse('**/employee/personal/ADACCOUNT');
  await syntheticClick(searchButton);
  await expect(scope.getByTestId('empty-person-error')).toBeVisible();
  await emptyPersonResponse;
  await syntheticClick(scope.locator('button[aria-label="Rensa"]'));
  await expect(scope.getByTestId('empty-person-error')).toHaveCount(0);
  await personNumberInput.fill('ABC12DEF');
  const personResponse = page.waitForResponse('**/employee/personal/ABC12DEF');
  await syntheticClick(searchButton);
  await expect(scope.getByTestId('person-number-error')).toHaveCount(0);
  await personResponse;

  // E-post
  await expect(scope.getByTestId('person-number-error')).toHaveCount(0);
  await expect(scope.getByTestId('email-input-error')).toHaveCount(0);
  await expect(scope.getByTestId('phone-number-input-error')).toHaveCount(0);
  await expect(scope.getByTestId('stakeholder-email-input')).toHaveValue(mockReporterStakeholder.emails?.[0] ?? '');

  // Telefon
  await expect(scope.getByTestId('stakeholder-mobilephone-input')).toHaveValue(
    mockReporterStakeholder.phoneNumbers?.[0] ?? ''
  );
  await syntheticClick(scope.locator('button', { hasText: 'Lägg till person' }));
};

export const manuallyAddStakeholder = async (page: Page) => {
  const modal = page.getByTestId('manual-person-modal');
  await expect(modal).toBeVisible();

  // Inga fel initialt
  await expect(modal.getByTestId('firstName-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('lastName-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('modal-email-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('modal-phone-input-error')).toHaveCount(0);

  // Fel visas efter första försöket att spara
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('firstName-input-error')).toBeVisible();
  await expect(modal.getByTestId('lastName-input-error')).toBeVisible();
  await expect(modal.getByTestId('modal-email-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('modal-phone-input-error')).toHaveCount(0);

  // Personnummer kan inte anges vid manuell registrering
  await expect(modal.getByTestId('modal-personNumber-input')).toHaveCount(0);

  // Namn
  await modal.getByTestId('modal-firstName-input').fill('Test');
  await modal.getByTestId('modal-lastName-input').fill('Testsson');
  await expect(modal.getByTestId('firstName-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('lastName-input-error')).toHaveCount(0);

  // E-post
  await modal.getByTestId('modal-email-input').fill('test');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('modal-email-input-error')).toBeVisible();
  await modal.getByTestId('modal-email-input').fill(MOCK_EMAIL);
  await expect(modal.getByTestId('modal-email-input-error')).toHaveCount(0);

  // Telefon
  await modal.getByTestId('modal-phone-input').fill('Testsson');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('modal-phone-input-error')).toBeVisible();
  await modal.getByTestId('modal-phone-input').fill(MOCK_PHONE_NUMBER);
  await expect(modal.getByTestId('modal-phone-input-error')).toHaveCount(0);

  // Adressfält finns inte vid manuell registrering
  await expect(modal.getByTestId('modal-address-input')).toHaveCount(0);
};

export const manuallyEditStakeholder = async (page: Page, stakeholder: StakeholderDTO) => {
  const modal = page.getByTestId('manual-person-modal');
  await expect(modal).toBeVisible();

  // Inga fel initialt
  await expect(modal.getByTestId('firstName-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('lastName-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('modal-email-input-error')).toHaveCount(0);
  await expect(modal.getByTestId('modal-phone-input-error')).toHaveCount(0);

  // Personnummer visas inte i redigeringsmodalen
  await expect(modal.getByTestId('modal-personNumber-input')).toHaveCount(0);

  // Namn
  const firstNameInput = modal.getByTestId('modal-firstName-input');
  await expect(firstNameInput).toHaveValue(stakeholder.firstName ?? '');
  await firstNameInput.fill('');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('firstName-input-error')).toBeVisible();
  await firstNameInput.fill(mockManualEditStakeholder.firstName || '');
  await expect(modal.getByTestId('firstName-input-error')).toHaveCount(0);
  const lastNameInput = modal.getByTestId('modal-lastName-input');
  await expect(lastNameInput).toHaveValue(stakeholder.lastName ?? '');
  await lastNameInput.fill('');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('lastName-input-error')).toBeVisible();
  await lastNameInput.fill(mockManualEditStakeholder.lastName || '');
  await expect(modal.getByTestId('lastName-input-error')).toHaveCount(0);

  // E-post
  const emailInput = modal.getByTestId('modal-email-input');
  await expect(emailInput).toHaveValue(MOCK_EMAIL);
  await emailInput.fill('test');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('modal-email-input-error')).toBeVisible();
  await emailInput.fill(MOCK_EMAIL);
  await expect(modal.getByTestId('modal-email-input-error')).toHaveCount(0);
  await emailInput.fill('');

  // Telefon
  const phoneInput = modal.getByTestId('modal-phone-input');
  await expect(phoneInput).toHaveValue(MOCK_COUNTRY_CODE_PHONE_NUMBER);
  await phoneInput.fill('Testsson');
  await modal.getByTestId('modal-add-person-button').click();
  await expect(modal.getByTestId('modal-phone-input-error')).toBeVisible();
  await phoneInput.fill(MOCK_PHONE_NUMBER);
  await expect(modal.getByTestId('modal-phone-input-error')).toHaveCount(0);

  // Adress
  const addressInput = modal.getByTestId('modal-address-input');
  await expect(addressInput).toHaveValue(stakeholder.address ?? '');
  await addressInput.fill(mockManualEditStakeholder.address || '');
  const careOfInput = modal.getByTestId('modal-careOf-input');
  await expect(careOfInput).toHaveValue(stakeholder.careOf ?? '');
  await careOfInput.fill(mockManualEditStakeholder.careOf || '');
  const zipCodeInput = modal.getByTestId('modal-zipCode-input');
  await expect(zipCodeInput).toHaveValue(stakeholder.zipCode ?? '');
  await zipCodeInput.fill(mockManualEditStakeholder.zipCode || '');
  const cityInput = modal.getByTestId('modal-city-input');
  await expect(cityInput).toHaveValue(stakeholder.city ?? '');
  await cityInput.fill(mockManualEditStakeholder.city || '');
};
