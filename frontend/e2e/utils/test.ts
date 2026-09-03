import { test as base } from '@playwright/test';

import { getMe } from '../fixtures/getMe';
import { jsonRoute } from './routes';

// The same value as CookieConsentUtils.defaultCookieConsentName in @sk-web-gui/react.
export const COOKIE_CONSENT_NAME = 'SKCookieConsent';
export const DEFAULT_COOKIE_VALUE = 'necessary%2Cstats';

const DEFAULT_BASE_URL = 'http://localhost:3000';

interface AppFixtures {
  /**
   * Builds an absolute URL under the configured base path.
   *
   * page.goto('/some/page') resolves against baseURL with URL semantics, where an absolute path
   * replaces the whole path. The base path in baseURL is then lost and the app answers 404 as
   * soon as NEXT_PUBLIC_BASE_PATH is set. Always go through this helper rather than passing a
   * path straight to goto().
   */
  appUrl: (path: string) => string;
}

// Sets cookie consent and mocks a logged-in user for every test. The fixture callback is named
// `run` rather than Playwright's conventional `use` so it does not trip
// react-hooks/rules-of-hooks, which reads `use(...)` as React's use hook.
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
