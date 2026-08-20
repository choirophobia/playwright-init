import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { expectNoSeriousAccessibilityViolations } from '../../utils/axe';

test.describe('Accessibility', () => {
  // The login page tests itself, so it must start unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page has no critical or serious accessibility violations', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expectNoSeriousAccessibilityViolations(page);
  });
});
