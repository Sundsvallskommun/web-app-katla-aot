import type { Locator, Page } from '@playwright/test';

import { mockErrand } from '../fixtures/mockErrand';
import { mockMetadata } from '../fixtures/mockMetadata';
import { mockReporterStakeholder } from '../fixtures/mockStakeholder';
import { MOCK_COUNTRY_CODE_PHONE_NUMBER } from '../utils/constants';
import { jsonRoute } from '../utils/routes';
import { expect, test } from '../utils/test';

const MOBILE_VIEWPORT = { width: 431, height: 932 };
const DESKTOP_VIEWPORT = { width: 1536, height: 960 };

// Långa titlar, enhetsnamn och e-postadresser är normalfallet i verksamheten.
// En e-postadress saknar mellanslag och sätter därför kortets min-content-bredd
// om den inte tillåts brytas.
const longReporter = {
  ...mockReporterStakeholder,
  firstName: 'Ulrika',
  lastName: 'Wiklund',
  title: 'Specialistundersköterska',
  department: 'VOF HOS Korttidsboende 1',
  emails: ['ulrika.wiklund@example.com'],
  phoneNumbers: [MOCK_COUNTRY_CODE_PHONE_NUMBER],
};

// baseURL i playwright.config innehåller basstigen, men en absolut sökväg i goto()
// ersätter hela sökvägen och tappar den. Prefixet gör testet körbart både i CI
// (tom basstig) och lokalt med NEXT_PUBLIC_BASE_PATH satt.
const errandPath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/arende/${mockErrand.errandNumber}/grundinformation`;

// boundingBox() ger null för element som inte är synliga. Utan den här kontrollen
// skulle ett omätbart element tysta ned jämförelserna nedan till 0 <= 0 i stället
// för att fälla testet.
const measure = async (locator: Locator, name: string) => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error(`Kunde inte mäta ${name} — elementet är inte synligt`);
  }
  return { ...box, right: box.x + box.width };
};

const openReporterCard = async (page: Page) => {
  await page.route(
    `**/supportmanagement/errand/${mockErrand.errandNumber}`,
    jsonRoute({ ...mockErrand, stakeholders: [longReporter] })
  );
  // Motsvarar seedningen i registrera.spec.ts: persistat zustand-state före sidladdning.
  await page.addInitScript((metadata) => {
    window.localStorage.setItem('metadata-storage', JSON.stringify({ state: { metadata }, version: 0 }));
  }, mockMetadata);
  await page.goto(errandPath);

  const card = page.getByTestId('stakeholder-card').first();
  await expect(card).toBeVisible();
  return card;
};

test.describe('Errand basic information page', () => {
  test('Reporter card keeps long contact details inside its own bounds on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    const card = await openReporterCard(page);

    const cardBox = await measure(card, 'stakeholder-card');
    const emailBox = await measure(card.getByTestId('stakeholder-email'), 'stakeholder-email');
    const departmentBox = await measure(card.getByTestId('stakeholder-department'), 'stakeholder-department');
    const cardOverflow = await card.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));

    expect(cardOverflow.scrollWidth).toBeLessThanOrEqual(cardOverflow.clientWidth);
    expect(emailBox.right).toBeLessThanOrEqual(cardBox.right);
    expect(departmentBox.right).toBeLessThanOrEqual(cardBox.right);
    // app-base.scss klipper horisontell overflow på body, så texten scrollas inte
    // fram — den försvinner utanför skärmkanten. Därför mäts synlighet mot viewporten
    // i stället för mot documentElement.scrollWidth, som aldrig kan växa.
    expect(emailBox.right).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
    expect(cardBox.right).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
  });

  test('Reporter card keeps its two columns side by side on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    const card = await openReporterCard(page);

    const departmentBox = await measure(card.getByTestId('stakeholder-department'), 'stakeholder-department');
    const emailBox = await measure(card.getByTestId('stakeholder-email'), 'stakeholder-email');
    const cardOverflow = await card.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));

    // E-postkolumnen ska ligga till höger om avdelningskolumnen, inte under den.
    expect(emailBox.x).toBeGreaterThanOrEqual(departmentBox.right);
    expect(cardOverflow.scrollWidth).toBeLessThanOrEqual(cardOverflow.clientWidth);
  });
});
