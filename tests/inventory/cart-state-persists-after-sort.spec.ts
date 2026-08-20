// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Inventory Browsing', () => {
  test('Add-to-cart button state stays attached to the correct product after re-sorting', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and go to the Products page
    await page.goto('/inventory.html');

    // 2. Add 'Sauce Labs Bike Light' to the cart while the list is in the default 'Name (A to Z)' order
    await inventory.addToCart('sauce-labs-bike-light');

    // expect: The Bike Light tile shows 'Remove' and the cart badge shows '1'
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();
    await expect(inventory.header.cartBadge).toHaveText('1');

    // 3. Re-sort the list to 'Name (Z to A)', which re-renders the grid in a new order
    await inventory.sortBy('Name (Z to A)');

    // expect: The list is reordered (Bike Light is no longer first)
    await expect(inventory.productNames.first()).toHaveText('Test.allTheThings() T-Shirt (Red)');

    // expect: The 'Remove' state stays correctly attached to Sauce Labs Bike Light, not to whichever tile now occupies its old position
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();
    await expect(inventory.addToCartButton('sauce-labs-backpack')).toBeVisible();
    await expect(inventory.addToCartButton('sauce-labs-bolt-t-shirt')).toBeVisible();
    await expect(inventory.addToCartButton('sauce-labs-fleece-jacket')).toBeVisible();
    await expect(inventory.addToCartButton('sauce-labs-onesie')).toBeVisible();
    await expect(inventory.addToCartButton('test.allthethings()-t-shirt-(red)')).toBeVisible();
    await expect(inventory.header.cartBadge).toHaveText('1');

    // 4. Re-sort again to 'Price (low to high)'
    await inventory.sortBy('Price (low to high)');

    // expect: The Bike Light tile still shows 'Remove' regardless of its new position, and no other tile does
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();
    await expect(inventory.items.filter({ has: page.getByRole('button', { name: 'Remove' }) })).toHaveCount(1);
  });
});
