// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.describe('Shopping Cart', () => {
  test('View cart contents and remove an item from the Cart page', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and add two items to the cart
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.addToCart('sauce-labs-bike-light');

    // expect: Cart badge shows '2'
    await expect(inventory.header.cartBadge).toHaveText('2');

    // 2. Click the shopping cart icon in the header
    await inventory.header.openCart();

    // expect: User is navigated to /cart.html showing the 'Your Cart' heading
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cart.header.title).toHaveText('Your Cart');

    // expect: A table with QTY and Description columns lists both added items
    await expect(cart.quantityLabel).toBeVisible();
    await expect(cart.descLabel).toBeVisible();

    const backpackRow = cart.itemRow('Sauce Labs Backpack');
    await expect(cart.itemQuantity(backpackRow)).toHaveText('1');
    await expect(cart.itemName(backpackRow)).toHaveText('Sauce Labs Backpack');
    await expect(cart.itemDesc(backpackRow)).toBeVisible();
    await expect(cart.itemPrice(backpackRow)).toHaveText('$29.99');
    await expect(cart.removeButton('sauce-labs-backpack')).toBeVisible();

    const bikeLightRow = cart.itemRow('Sauce Labs Bike Light');
    await expect(cart.itemQuantity(bikeLightRow)).toHaveText('1');
    await expect(cart.itemName(bikeLightRow)).toHaveText('Sauce Labs Bike Light');
    await expect(cart.itemDesc(bikeLightRow)).toBeVisible();
    await expect(cart.itemPrice(bikeLightRow)).toHaveText('$9.99');
    await expect(cart.removeButton('sauce-labs-bike-light')).toBeVisible();

    // expect: A 'Continue Shopping' button and a 'Checkout' button are visible
    await expect(cart.continueShoppingButton).toBeVisible();
    await expect(cart.checkoutButton).toBeVisible();

    // 3. Click 'Remove' on the 'Sauce Labs Bike Light' cart row
    await cart.removeItem('sauce-labs-bike-light');

    // expect: The Sauce Labs Bike Light row is removed; only Backpack remains
    await expect(bikeLightRow).toBeHidden();
    await expect(cart.items).toHaveCount(1);
    await expect(backpackRow).toBeVisible();

    // expect: The cart badge in the header updates to '1'
    await expect(cart.header.cartBadge).toHaveText('1');

    // 4. Click 'Continue Shopping'
    await cart.continueShopping();

    // expect: User is returned to the Products/inventory page
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventory.header.title).toHaveText('Products');

    // expect: Cart badge still shows '1'
    await expect(inventory.header.cartBadge).toHaveText('1');
  });
});
