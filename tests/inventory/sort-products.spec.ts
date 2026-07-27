// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Inventory Browsing', () => {
  test('Sort products by name and price', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Start from a fresh browser state, navigate, and log in
    await login.goto();
    await login.login('standard_user', 'secret_sauce');

    // expect: User lands on the Products page
    await expect(page).toHaveURL(/inventory\.html/);

    // 2. Open the sort dropdown (defaults to 'Name (A to Z)') and select 'Name (Z to A)'
    await expect(inventory.sortDropdown).toContainText('Name (A to Z)');
    await inventory.sortBy('Name (Z to A)');

    // expect: Product list re-orders so 'Test.allTheThings() T-Shirt (Red)' is first, 'Sauce Labs Backpack' is last
    await expect(inventory.productNames.first()).toHaveText('Test.allTheThings() T-Shirt (Red)');
    await expect(inventory.productNames.last()).toHaveText('Sauce Labs Backpack');

    // 3. Select 'Price (low to high)'
    await inventory.sortBy('Price (low to high)');

    // expect: 'Sauce Labs Onesie' ($7.99) first, 'Sauce Labs Fleece Jacket' ($49.99) last
    await expect(inventory.productNames.first()).toHaveText('Sauce Labs Onesie');
    await expect(inventory.productPrices.first()).toHaveText('$7.99');
    await expect(inventory.productNames.last()).toHaveText('Sauce Labs Fleece Jacket');
    await expect(inventory.productPrices.last()).toHaveText('$49.99');

    // 4. Select 'Price (high to low)'
    await inventory.sortBy('Price (high to low)');

    // expect: 'Sauce Labs Fleece Jacket' ($49.99) first, 'Sauce Labs Onesie' ($7.99) last
    await expect(inventory.productNames.first()).toHaveText('Sauce Labs Fleece Jacket');
    await expect(inventory.productPrices.first()).toHaveText('$49.99');
    await expect(inventory.productNames.last()).toHaveText('Sauce Labs Onesie');
    await expect(inventory.productPrices.last()).toHaveText('$7.99');
  });
});
