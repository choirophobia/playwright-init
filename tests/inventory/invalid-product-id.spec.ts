// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Inventory Browsing', () => {
  test('Navigating to a non-existent product id shows an unguarded "ITEM NOT FOUND" detail page', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Start from a fresh browser state, navigate, and log in
    await login.goto();
    await login.login('standard_user', 'secret_sauce');

    // 2. Navigate directly to a product detail URL with an id that does not correspond to any real product
    await page.goto('/inventory-item.html?id=999');

    // expect: The app does not redirect or error, it renders a broken placeholder detail page instead of guarding against the invalid id
    await expect(page).toHaveURL(/inventory-item\.html\?id=999/);
    await expect(inventory.detailName).toHaveText('ITEM NOT FOUND');
    await expect(inventory.detailDesc).toBeVisible();
    await expect(inventory.detailPrice).toHaveText('$√-1');

    // expect: The 'Add to cart' and 'Back to products' controls are still rendered despite the missing product
    await expect(inventory.detailAddToCartButton).toBeVisible();
    await expect(inventory.backToProductsButton).toBeVisible();

    // 3. Click 'Back to products'
    await inventory.backToProductsButton.click();

    // expect: User safely returns to the real Products/inventory page
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.items).toHaveCount(6);
  });
});
