// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.describe('Shopping Cart', () => {
  test('Remove the only item from the cart results in an empty cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts), add an item, then open the cart page
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();

    // expect: Cart page shows 1 item
    await expect(cart.items).toHaveCount(1);
    await expect(cart.itemName(cart.items)).toHaveText('Sauce Labs Backpack');

    // 2. Click 'Remove' on the remaining cart item
    await cart.removeItem('sauce-labs-backpack');

    // expect: The cart item list becomes empty
    await expect(cart.items).toHaveCount(0);

    // expect: The cart badge disappears from the header (no count shown)
    await expect(cart.header.cartBadge).toBeHidden();

    // expect: The Checkout button remains visible but cart is empty
    await expect(cart.checkoutButton).toBeVisible();
  });
});
