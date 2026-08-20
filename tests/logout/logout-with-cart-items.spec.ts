// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Logout', () => {
  test('Logout is available and functions after adding items to the cart', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and add 2 items to the cart
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.addToCart('sauce-labs-bike-light');

    // expect: Cart badge shows '2'
    await expect(inventory.header.cartBadge).toHaveText('2');

    // 2. Open the hamburger menu and click 'Logout'
    await inventory.header.logout();

    // expect: User is logged out and redirected to the login page
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    await expect(login.loginButton).toBeVisible();

    // 3. Log back in
    await login.login('standard_user', 'secret_sauce');

    // expect: User lands on the Products page with the cart badge still showing '2'
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.header.title).toHaveText('Products');
    await expect(inventory.header.cartBadge).toHaveText('2');
  });
});
