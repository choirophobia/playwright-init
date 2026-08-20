import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Must match the storageState path used by the authenticated projects in playwright.config.ts
const authFile = 'playwright/.auth/standard_user.json';

setup('authenticate as standard_user', async ({ page }) => {
  const login = new LoginPage(page);

  await login.goto();
  await login.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory\.html/);

  await page.context().storageState({ path: authFile });
});
