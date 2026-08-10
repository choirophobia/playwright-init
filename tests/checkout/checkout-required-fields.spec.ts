// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('Checkout information step validates required fields', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts), add an item, open the cart, and click 'Checkout'
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();
    await cart.checkout();

    // expect: User is on the 'Checkout: Your Information' step
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Your Information');

    // 2. Leave all fields blank and click 'Continue'
    await checkout.continueButton.click();

    // expect: Error message for First Name; user remains on this step; field outlined in red
    await expect(checkout.errorMessage).toHaveText('Error: First Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkout.firstNameField).toHaveClass(/error/);

    // 3. Enter only First Name and click 'Continue'
    await checkout.firstNameField.fill('Fikri');
    await checkout.continueButton.click();

    // expect: Error message for Last Name; user remains on this step
    await expect(checkout.errorMessage).toHaveText('Error: Last Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);

    // 4. Additionally enter Last Name, leave Postal Code blank, and click 'Continue'
    await checkout.lastNameField.fill('Ahmadi');
    await checkout.continueButton.click();

    // expect: Error message for Postal Code; user remains on this step
    await expect(checkout.errorMessage).toHaveText('Error: Postal Code is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);

    // 5. Fill in Postal Code and click 'Continue'
    await checkout.postalCodeField.fill('12345');
    await checkout.continueButton.click();

    // expect: User successfully advances to the 'Checkout: Overview' step
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Overview');
  });
});
