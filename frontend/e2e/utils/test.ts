import { test as base } from '@playwright/test';

import { getMe } from '../fixtures/getMe';
import { jsonRoute } from './routes';

// Samma värde som CookieConsentUtils.defaultCookieConsentName i @sk-web-gui/react
export const COOKIE_CONSENT_NAME = 'SKCookieConsent';
export const DEFAULT_COOKIE_VALUE = 'necessary%2Cstats';

// Motsvarar Cypress globala beforeEach: cookie-samtycke satt och inloggad användare mockad.
// Fixture-callbacken heter `run` (inte Playwright-konventionens `use`) för att inte
// trigga react-hooks/rules-of-hooks, som tolkar `use(...)` som Reacts use-hook.
export const test = base.extend({
  page: async ({ page, context, baseURL }, run) => {
    await context.addCookies([
      { name: COOKIE_CONSENT_NAME, value: DEFAULT_COOKIE_VALUE, url: baseURL ?? 'http://localhost:3000' },
    ]);
    await page.route('**/api/me', jsonRoute(getMe));
    await run(page);
  },
});

export { expect } from '@playwright/test';
