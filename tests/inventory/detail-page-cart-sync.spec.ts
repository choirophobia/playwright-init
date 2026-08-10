// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Inventory Browsing', () => {
  test('Product detail page reflects and toggles cart state added from the grid', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and go to the Products page
    await page.goto('/inventory.html');

    // 2. Add 'Sauce Labs Backpack' to the cart from the Products grid
    await inventory.addToCart('sauce-labs-backpack');

    // expect: The cart badge shows '1'
    await expect(inventory.header.cartBadge).toHaveText('1');

    // 3. Open the Sauce Labs Backpack product detail page
    await inventory.openProduct('Sauce Labs Backpack');

    // expect: The detail page shows a 'Remove' button instead of 'Add to cart', since the item is already in the cart
    await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
    await expect(inventory.detailRemoveButton).toBeVisible();
    await expect(inventory.detailAddToCartButton).toBeHidden();
    await expect(inventory.header.cartBadge).toHaveText('1');

    // 4. Click 'Remove' directly on the detail page
    await inventory.detailRemoveButton.click();

    // expect: The button reverts to 'Add to cart' and the cart badge disappears
    await expect(inventory.detailAddToCartButton).toBeVisible();
    await expect(inventory.detailRemoveButton).toBeHidden();
    await expect(inventory.header.cartBadge).toBeHidden();

    // 5. Return to the product grid
    await inventory.backToProductsButton.click();

    // expect: The Sauce Labs Backpack tile also shows 'Add to cart', confirming the detail-page removal synced back to the grid
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.addToCartButton('sauce-labs-backpack')).toBeVisible();
    await expect(inventory.removeButton('sauce-labs-backpack')).toBeHidden();
  });
});
