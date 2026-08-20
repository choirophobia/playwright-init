// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Shopping Cart', () => {
  test('Add a single item to the cart and verify the cart badge', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and go to the Products page
    await page.goto('/inventory.html');

    // expect: User lands on the Products page with no cart badge visible (empty cart)
    await expect(inventory.header.title).toHaveText('Products');
    await expect(inventory.header.cartBadge).toBeHidden();

    // 2. Click the 'Add to cart' button on 'Sauce Labs Backpack'
    await inventory.addToCart('sauce-labs-backpack');

    // expect: The cart icon badge in the header now displays '1'
    await expect(inventory.header.cartBadge).toHaveText('1');

    // expect: The button on the Sauce Labs Backpack tile changes from 'Add to cart' to 'Remove'
    await expect(inventory.removeButton('sauce-labs-backpack')).toBeVisible();
  });
});
