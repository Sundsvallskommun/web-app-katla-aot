import type { Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { jsonRoute } from '../utils/routes';
import { addStakeholder, disclosureByTitle } from '../utils/stakeholder';
import { expect, test } from '../utils/test';

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

test.describe('Language switching', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.route('**/supportmanagement/errand/create', jsonRoute(mockErrand));
    await page.route('**/supportmanagement/metadata', jsonRoute(mockMetadata));
    await page.goto(appUrl('/arende/registrera'));
  });

  test('keeps the entered registration form when the language changes', async ({ page }) => {
    await expect(page.getByTestId('register-errand')).toBeEnabled();

    // Tillagda parter är den enda ifyllda uppgiften som finns i formuläret tills
    // AoT-fälten byggs, så överlämningen mäts på dem.
    const ovrigaParter = disclosureByTitle(page, 'Övriga parter');
    await addStakeholder(page, ovrigaParter, 'CONTACT');
    await expect(ovrigaParter.getByTestId('stakeholder-card')).toHaveCount(1);

    await switchLanguageTo(page, 'English');

    await expect(page).toHaveURL(/\/en\/arende\/registrera$/);

    // Språkbytet monterar om hela ärendeträdet. Utan överlämningen står användaren
    // inför ett tomt formulär, och priset för att byta språk blir att börja om.
    await expect(disclosureByTitle(page, 'Other parties').getByTestId('stakeholder-card')).toHaveCount(1);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('changes language from the registration header without leaving the wizard', async ({ page }) => {
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
