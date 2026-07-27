// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('Cancel checkout returns user to prior page without completing order', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Start from a fresh browser state, log in, add an item, open the cart, and click 'Checkout'
    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();
    await cart.checkout();

    // expect: User is on the 'Checkout: Your Information' step
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Your Information');

    // 2. Click 'Cancel' on the Checkout: Your Information step
    await checkout.cancel();

    // expect: User is returned to the Cart page with the item still present and badge unchanged
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cart.items).toHaveCount(1);
    await expect(cart.itemName(cart.items)).toHaveText('Sauce Labs Backpack');
    await expect(cart.header.cartBadge).toHaveText('1');

    // 3. Checkout again, fill in valid shipping info, continue to Overview, then cancel there
    await cart.checkout();
    await checkout.fillInfo('Fikri', 'Ahmadi', '12345');
    await checkout.continueToOverview();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Overview');
    await checkout.cancel();

    // expect: User is returned to the Products/inventory page; order not completed, cart not cleared
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.header.title).toHaveText('Products');
    await expect(inventory.header.cartBadge).toHaveText('1');
  });
});
