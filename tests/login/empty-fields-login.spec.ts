// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login', () => {
  test('Login fails when required fields are left blank', async ({ page }) => {
    const login = new LoginPage(page);

    // 1. Navigate to https://www.saucedemo.com
    await login.goto();

    // expect: Login page is displayed
    await expect(login.heading).toBeVisible();
    await expect(login.usernameInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.loginButton).toBeVisible();

    // 2. Leave the Username and Password fields empty and click the Login button
    await login.loginButton.click();

    // expect: An error message is displayed stating the Username is required
    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText('Epic sadface: Username is required');

    // expect: User remains on the login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');

    // 3. Enter 'standard_user' into the Username field only, leave Password blank, and click Login
    await login.usernameInput.fill('standard_user');
    await login.loginButton.click();

    // expect: An error message is displayed stating the Password is required
    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText('Epic sadface: Password is required');

    // expect: User remains on the login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
