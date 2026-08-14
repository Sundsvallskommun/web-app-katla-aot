import type { Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const MOCK_FORM_SCHEMA_NAME = 'avvikelse-plats-handelse';
const MOCK_FORM_SCHEMA_ID = 'e2e-avvikelse-plats-handelse-v1';
const MOCK_INCIDENT_DESCRIPTION = 'Händelsen inträffade i testmiljön';
const mockFormSchemaResponse = {
  schemaId: MOCK_FORM_SCHEMA_ID,
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      incidentDescription: {
        type: 'string',
        title: 'Beskriv händelsen',
        minLength: 1,
      },
    },
    required: ['incidentDescription'],
  },
  uiSchema: {},
};

/**
 * Språkvalet ska nås från sidhuvudet, utan omvägen via användarmenyn. Namnen står på
 * språket självt, så samma selektor fungerar oavsett vilket språk sidan visas på.
 *
 * Sidhuvudet renderar både desktop- och mobilraden och döljer den ena med CSS. Filtret
 * väljer den som faktiskt går att använda vid aktuell bredd – samma val en användare gör.
 */
const switchLanguageTo = async (page: Page, language: string) => {
  await page.getByTestId('language-switch-button').filter({ visible: true }).click();
  await page.getByRole('menuitemradio', { name: language }).click();
};

const selectRequiredErrandParameters = async (page: Page) => {
  const eventType = page.getByTestId('event-type-deviation');
  const eventConcerns = page.getByTestId('event-concerns-individual');

  await eventType.check();
  await expect(eventType).toBeChecked();
  await eventConcerns.check();
  await expect(eventConcerns).toBeChecked();
};

test.describe('Language switching', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route('**/employee/personal/*', jsonRoute(mockReporterStakeholder));
    await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
    await page.route(`**/schemas/latest/${MOCK_FORM_SCHEMA_NAME}`, jsonRoute(mockFormSchemaResponse));
    await page.route(`**/schemas/${MOCK_FORM_SCHEMA_ID}`, jsonRoute(mockFormSchemaResponse));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.goto(appUrl('/arende/registrera'));
  });

  test('keeps the entered registration form when the language changes', async ({ page }) => {
    await expect(page.getByTestId('stakeholder-card').first()).toBeVisible();
    await selectRequiredErrandParameters(page);

    const description = page.getByRole('textbox', { name: /Beskriv händelsen/ });
    await description.fill(MOCK_INCIDENT_DESCRIPTION);
    await expect(description).toHaveValue(MOCK_INCIDENT_DESCRIPTION);

    await switchLanguageTo(page, 'English');

    await expect(page).toHaveURL(/\/en\/arende\/registrera$/);

    // Språkbytet monterar om hela ärendeträdet. Utan överlämningen står användaren
    // inför ett tomt formulär, och priset för att byta språk blir att börja om.
    await expect(page.getByTestId('event-type-deviation')).toBeChecked();
    await expect(page.getByTestId('event-concerns-individual')).toBeChecked();
    await expect(page.getByRole('textbox', { name: /Beskriv händelsen/ })).toHaveValue(MOCK_INCIDENT_DESCRIPTION);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('changes language from the registration header without leaving the wizard', async ({ page }) => {
      await selectRequiredErrandParameters(page);
      await page.getByRole('button', { name: 'Nästa' }).click();
      await expect(page.getByText('Steg 2/5')).toBeVisible();

      await switchLanguageTo(page, 'English');

      await expect(page).toHaveURL(/\/en\/arende\/registrera$/);

      // Kvar i wizarden, på samma steg. Tidigare fanns ingen språkkontroll alls här,
      // så bytet krävde att användaren lämnade registreringen helt.
      await expect(page.getByText('Step 2/5')).toBeVisible();
    });

    test('opens the language panel under the button and inside the viewport', async ({ page }) => {
      const button = page.getByTestId('language-switch-button').filter({ visible: true });
      await button.click();

      const panel = page.getByRole('menu').filter({ visible: true }).first();
      await expect(panel).toBeVisible();

      const buttonBox = await button.boundingBox();
      const panelBox = await panel.boundingBox();
      const viewport = page.viewportSize();
      if (!buttonBox || !panelBox || !viewport) throw new Error('Saknar mått för knapp, panel eller viewport');

      // Designsystemet ger panelen bara `right: 0`; den vertikala placeringen kommer från
      // dess statiska position i normalflödet. Ligger kontrollen i en flex-container med
      // items-center centreras panelen på knappen i stället och lägger sig över sidhuvudet,
      // delvis utanför skärmen. Måtten är därför det som fångar en sådan regression.
      expect(panelBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width);
    });
  });
});
