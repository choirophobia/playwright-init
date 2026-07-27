// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('Complete an order successfully with a single item (happy path)', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Start from a fresh browser state, log in, and add an item to the cart
    await login.goto();
    await login.login('standard_user', 'secret_sauce');
    await inventory.addToCart('sauce-labs-backpack');

    // expect: Cart badge shows '1'
    await expect(inventory.header.cartBadge).toHaveText('1');

    // 2. Open the cart page via the cart icon, then click 'Checkout'
    await inventory.header.openCart();
    await cart.checkout();

    // expect: User is navigated to /checkout-step-one.html with heading 'Checkout: Your Information'
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Your Information');
    await expect(checkout.firstNameField).toBeVisible();
    await expect(checkout.lastNameField).toBeVisible();
    await expect(checkout.postalCodeField).toBeVisible();
    await expect(checkout.cancelButton).toBeVisible();
    await expect(checkout.continueButton).toBeVisible();

    // 3. Fill in shipping info and click 'Continue'
    await checkout.fillInfo('Fikri', 'Ahmadi', '12345');
    await checkout.continueToOverview();

    // expect: User is navigated to /checkout-step-two.html with heading 'Checkout: Overview'
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Overview');

    // expect: The order summary lists the Sauce Labs Backpack with quantity 1 and price $29.99
    await expect(checkout.items).toHaveCount(1);
    await expect(checkout.itemQuantity(checkout.items)).toHaveText('1');
    await expect(checkout.itemName(checkout.items)).toHaveText('Sauce Labs Backpack');
    await expect(checkout.itemPrice(checkout.items)).toHaveText('$29.99');

    // expect: Payment/Shipping info and price totals are displayed
    await expect(checkout.paymentInfoValue).toHaveText('SauceCard #31337');
    await expect(checkout.shippingInfoValue).toHaveText('Free Pony Express Delivery!');
    await expect(checkout.subtotalLabel).toHaveText('Item total: $29.99');
    await expect(checkout.taxLabel).toHaveText('Tax: $2.40');
    await expect(checkout.totalLabel).toHaveText('Total: $32.39');

    // expect: 'Cancel' and 'Finish' buttons are visible
    await expect(checkout.cancelButton).toBeVisible();
    await expect(checkout.finishButton).toBeVisible();

    // 4. Click 'Finish'
    await checkout.finish();

    // expect: User is navigated to /checkout-complete.html with heading 'Checkout: Complete!'
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(checkout.header.title).toHaveText('Checkout: Complete!');
    await expect(checkout.ponyExpressImage).toBeVisible();
    await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkout.completeText).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    );
    await expect(checkout.backHomeButton).toBeVisible();

    // expect: The cart badge is no longer shown in the header (cart has been emptied)
    await expect(checkout.header.cartBadge).toBeHidden();

    // 5. Click 'Back Home'
    await checkout.backHomeButton.click();

    // expect: User is returned to the Products/inventory page, cart still empty
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.header.title).toHaveText('Products');
    await expect(inventory.header.cartBadge).toBeHidden();
  });
});
