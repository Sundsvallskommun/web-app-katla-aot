import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || '3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

if (process.env.NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE === 'false') {
  throw new Error(
    'Playwright requires NEXT_PUBLIC_OTHER_PARTIES_DISCLOSURE=true because the registration scenarios exercise other stakeholders.'
  );
}

if (process.env.NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO === 'true') {
  throw new Error(
    'Playwright requires NEXT_PUBLIC_REDUCED_STAKEHOLDER_INFO=false because the registration scenarios exercise stakeholder contact fields.'
  );
}

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'on-failure' }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    // Missing or covered controls should fail quickly instead of consuming the full test timeout.
    actionTimeout: 10_000,
    // Projektet använder data-cy-attribut som testselektorer
    testIdAttribute: 'data-cy',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Motsvarar Cypress viewport "macbook-16"
        viewport: { width: 1536, height: 960 },
      },
    },
  ],
  webServer: {
    // Produktionsbygget använder Nexts standalone-output, som inte kan startas med `next start`.
    // CI verifierar bygget separat; Playwright använder den befintliga dev-servern som testharness.
    command: 'yarn dev',
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
