// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('Checkout information step accepts whitespace-only field values (validation gap)', async ({ page }) => {
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

    // 2. Enter whitespace-only values into all three fields and click 'Continue'
    await checkout.fillInfo('   ', '   ', '   ');
    await checkout.continueToOverview();

    // expect: No error message is displayed
    await expect(checkout.errorMessage).toBeHidden();

    // expect: User advances to the 'Checkout: Overview' step despite blank-looking input
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Overview');

    // expect: The order summary and price totals render normally
    await expect(checkout.items).toHaveCount(1);
    await expect(checkout.itemName(checkout.items)).toHaveText('Sauce Labs Backpack');
    await expect(checkout.subtotalLabel).toHaveText('Item total: $29.99');
    await expect(checkout.taxLabel).toHaveText('Tax: $2.40');
    await expect(checkout.totalLabel).toHaveText('Total: $32.39');
  });
});
