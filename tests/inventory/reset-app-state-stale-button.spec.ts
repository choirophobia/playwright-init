// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.describe('Inventory Browsing', () => {
  test('Reset App State clears the cart but leaves a stale Remove button on the grid (UI desync gap)', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    // 1. Start from a fresh browser state, navigate, and log in
    await login.goto();
    await login.login('standard_user', 'secret_sauce');

    // 2. Add 'Sauce Labs Bike Light' to the cart
    await inventory.addToCart('sauce-labs-bike-light');

    // expect: The cart badge shows '1' and the tile shows 'Remove'
    await expect(inventory.header.cartBadge).toHaveText('1');
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();

    // 3. Open the hamburger menu and click 'Reset App State'
    await inventory.header.openMenu();
    await inventory.header.resetAppStateLink.click();
    await inventory.header.closeMenuButton.click();

    // expect: The cart badge is cleared immediately
    await expect(inventory.header.cartBadge).toBeHidden();

    // expect (validation gap): On this same, still-open grid, the Bike Light tile remains stuck showing 'Remove' even though the cart was just reset
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();

    // 4. Navigate to the Cart page (a fresh page load) to confirm the cart is genuinely empty
    await inventory.header.openCart();
    await expect(cart.items).toHaveCount(0);

    // 5. Navigate back to the Products page (another fresh page load)
    await cart.continueShopping();

    // expect: After a fresh load the tile correctly reflects the empty cart and shows 'Add to cart' again
    await expect(inventory.addToCartButton('sauce-labs-bike-light')).toBeVisible();
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeHidden();
  });
});
