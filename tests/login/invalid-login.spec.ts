// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login', () => {
  // These tests exercise the login form itself, so they must start unauthenticated
  // rather than reusing the storageState from tests/auth.setup.ts.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Invalid credentials show an error message and user stays on login page', async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Navigate to https://www.saucedemo.com
    await login.goto();

    // expect: Login page is displayed
    await expect(login.heading).toBeVisible();
    await expect(login.usernameInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.loginButton).toBeVisible();

    // 2-3. Enter invalid credentials and click Login
    await login.login('invalid_user', 'wrong_password');

    // expect: User remains on the login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    // expect: An error banner is displayed with the expected message
    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText(
      'Epic sadface: Username and password do not match any user in this service'
    );

    // expect: The error banner has a dismiss (X) button
    await expect(login.errorDismissButton).toBeVisible();

    // expect: The Username and Password fields are outlined in red to indicate the error state
    await expect(login.usernameInput).toHaveClass(/error/);
    await expect(login.passwordInput).toHaveClass(/error/);

    // 4. Click the error banner's dismiss (X) button
    await login.dismissError();

    // expect: The error message is removed from the page
    await expect(login.errorMessage).toBeHidden();
  });
});
