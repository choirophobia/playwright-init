import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Visual Regression', () => {
  // The login page tests itself, so it must start unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page matches its visual baseline', async ({ page }, testInfo) => {
    // Visual baselines are only maintained for chromium — see README: Visual Regression Testing.
    test.skip(testInfo.project.name !== 'chromium', 'Visual baselines are chromium-only');

    const login = new LoginPage(page);
    await login.goto();
    await expect(login.heading).toBeVisible();

    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });
});
