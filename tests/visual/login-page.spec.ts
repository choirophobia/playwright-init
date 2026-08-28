import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Visual Regression', () => {
  // The login page tests itself, so it must start unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page matches its visual baseline', async ({ page }, testInfo) => {
    // Percy renders snapshots itself across configured browsers/widths — see README:
    // Visual Regression Testing. One local capture is enough.
    test.skip(testInfo.project.name !== 'chromium', 'Visual snapshots only need to be captured once');

    const login = new LoginPage(page);
    await login.goto();
    await expect(login.heading).toBeVisible();

    await percySnapshot(page, 'Login page');
  });
});
