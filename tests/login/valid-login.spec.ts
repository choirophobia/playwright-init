// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Login', () => {
  // These tests exercise the login form itself, so they must start unauthenticated
  // rather than reusing the storageState from tests/auth.setup.ts.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Valid login with standard_user succeeds and lands on Products page', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Navigate to https://www.saucedemo.com
    await login.goto();

    // expect: Login page is displayed with 'Swag Labs' heading, a Username field, a Password field, and a Login button
    await expect(login.heading).toBeVisible();
    await expect(login.usernameInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.loginButton).toBeVisible();

    // expect: The page lists accepted usernames (including standard_user) and notes the shared password 'secret_sauce'
    await expect(login.acceptedUsernamesHeading).toBeVisible();
    await expect(login.credentialsList).toContainText('standard_user');
    await expect(login.passwordNote).toContainText('secret_sauce');

    // 2-4. Enter credentials and click the Login button
    await login.login('standard_user', 'secret_sauce');

    // expect: User is redirected to /inventory.html
    await expect(page).toHaveURL(/inventory\.html/);

    // expect: The page header shows 'Products' as the active page title
    await expect(inventory.header.title).toHaveText('Products');

    // expect: Six product items are visible in the inventory list
    await expect(inventory.productNames).toHaveCount(6);
    await expect(inventory.productNames).toHaveText([
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
      'Sauce Labs Bolt T-Shirt',
      'Sauce Labs Fleece Jacket',
      'Sauce Labs Onesie',
      'Test.allTheThings() T-Shirt (Red)',
    ]);

    // expect: No error message is displayed
    await expect(login.errorMessage).toBeHidden();

    // expect: No shopping cart badge is shown (cart is empty)
    await expect(inventory.header.cartBadge).toBeHidden();
  });
});
