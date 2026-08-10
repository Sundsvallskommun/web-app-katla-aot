import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || '3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'on-failure' }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
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
    // Kräver att appen är byggd (yarn build). Lokalt återanvänds en redan startad
    // dev-server (yarn dev) i stället.
    command: 'yarn start',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
