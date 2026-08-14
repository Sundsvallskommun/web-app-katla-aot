import { expect, test } from '../utils/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ appUrl, page }) => {
    await page.goto(appUrl('/login'));
  });

  test('should render correct html structure', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible();
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Välj hur du vill logga in');
    const loginButton = page.getByTestId('login-button');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    await expect(loginButton).toContainText('Logga in');
    await loginButton.click();
  });
});
