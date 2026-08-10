// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('Complete an order with multiple items in the cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and add three items to the cart
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.addToCart('sauce-labs-bike-light');
    await inventory.addToCart('sauce-labs-bolt-t-shirt');

    // expect: Cart badge shows '3'
    await expect(inventory.header.cartBadge).toHaveText('3');

    // 2. Open the cart, click 'Checkout', fill in valid shipping info, and click 'Continue'
    await inventory.header.openCart();
    await cart.checkout();
    await checkout.fillInfo('Fikri', 'Ahmadi', '12345');
    await checkout.continueToOverview();

    // expect: Checkout Overview page lists all 3 items with correct quantities and prices
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Overview');
    await expect(checkout.items).toHaveCount(3);

    const backpackItem = checkout.itemRow('Sauce Labs Backpack');
    await expect(checkout.itemQuantity(backpackItem)).toHaveText('1');
    await expect(checkout.itemPrice(backpackItem)).toHaveText('$29.99');

    const bikeLightItem = checkout.itemRow('Sauce Labs Bike Light');
    await expect(checkout.itemQuantity(bikeLightItem)).toHaveText('1');
    await expect(checkout.itemPrice(bikeLightItem)).toHaveText('$9.99');

    const boltTShirtItem = checkout.itemRow('Sauce Labs Bolt T-Shirt');
    await expect(checkout.itemQuantity(boltTShirtItem)).toHaveText('1');
    await expect(checkout.itemPrice(boltTShirtItem)).toHaveText('$15.99');

    // expect: Item total equals the sum of all 3 item prices; Tax and Total are calculated
    await expect(checkout.subtotalLabel).toHaveText('Item total: $55.97');
    await expect(checkout.taxLabel).toHaveText('Tax: $4.48');
    await expect(checkout.totalLabel).toHaveText('Total: $60.45');

    // 3. Click 'Finish'
    await checkout.finish();

    // expect: Order completes successfully; cart badge is cleared
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkout.header.cartBadge).toBeHidden();
  });
});
