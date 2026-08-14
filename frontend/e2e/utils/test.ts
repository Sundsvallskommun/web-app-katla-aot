import { test as base } from '@playwright/test';

import { getMe } from '../fixtures/getMe';
import { jsonRoute } from './routes';

// Samma värde som CookieConsentUtils.defaultCookieConsentName i @sk-web-gui/react
export const COOKIE_CONSENT_NAME = 'SKCookieConsent';
export const DEFAULT_COOKIE_VALUE = 'necessary%2Cstats';

const DEFAULT_BASE_URL = 'http://localhost:3000';

interface AppFixtures {
  /**
   * Bygger en absolut URL under den konfigurerade basstigen.
   *
   * page.goto('/nagon/sida') löses mot baseURL med URL-semantik, där en absolut
   * sökväg ersätter hela sökvägen. Basstigen i baseURL försvinner därmed och
   * appen svarar 404 så snart NEXT_PUBLIC_BASE_PATH är satt. Gå alltid via den
   * här hjälparen i stället för att skicka en sökväg direkt till goto().
   */
  appUrl: (path: string) => string;
}

// Motsvarar Cypress globala beforeEach: cookie-samtycke satt och inloggad användare mockad.
// Fixture-callbacken heter `run` (inte Playwright-konventionens `use`) för att inte
// trigga react-hooks/rules-of-hooks, som tolkar `use(...)` som Reacts use-hook.
export const test = base.extend<AppFixtures>({
  page: async ({ page, context, baseURL }, run) => {
    await context.addCookies([
      { name: COOKIE_CONSENT_NAME, value: DEFAULT_COOKIE_VALUE, url: baseURL ?? DEFAULT_BASE_URL },
    ]);
    await page.route('**/api/me', jsonRoute(getMe));
    await run(page);
  },
  appUrl: async ({ baseURL }, run) => {
    const root = (baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    await run((path) => `${root}${path}`);
  },
});

export { expect } from '@playwright/test';
