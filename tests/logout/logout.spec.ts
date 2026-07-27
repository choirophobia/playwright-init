// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Logout', () => {
  test('Logout from the Products page returns user to the login screen', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Start from a fresh browser state, navigate, and log in
    await login.goto();
    await login.login('standard_user', 'secret_sauce');

    // expect: User lands on the Products page
    await expect(inventory.header.title).toBeVisible();
    await expect(inventory.header.title).toHaveText('Products');

    // 2. Click the hamburger 'Open Menu' button
    await inventory.header.openMenu();

    // expect: A side menu slides in showing All Items, About, Logout, Reset App State, Close Menu
    await expect(inventory.header.allItemsLink).toBeVisible();
    await expect(inventory.header.aboutLink).toBeVisible();
    await expect(inventory.header.logoutLink).toBeVisible();
    await expect(inventory.header.resetAppStateLink).toBeVisible();
    await expect(inventory.header.closeMenuButton).toBeVisible();

    // 3. Click the 'Logout' link
    await inventory.header.logoutLink.click();

    // expect: User is redirected to the login page with empty fields
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(login.usernameInput).toHaveValue('');
    await expect(login.passwordInput).toHaveValue('');

    // expect: Navigating directly back to /inventory.html redirects to the login page (unauthenticated)
    await page.goto('/inventory.html');
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(login.errorMessage).toBeVisible();
    await expect(login.errorMessage).toContainText(
      "You can only access '/inventory.html' when you are logged in."
    );
  });
});
