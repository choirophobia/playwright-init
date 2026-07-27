// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Shopping Cart', () => {
  test('Add multiple items to the cart and verify the cart badge count', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    // 1. Start from a fresh browser state, navigate, and log in
    await login.goto();
    await login.login('standard_user', 'secret_sauce');

    // expect: User lands on the Products page with no cart badge visible
    await expect(inventory.header.title).toHaveText('Products');
    await expect(inventory.header.cartBadge).toBeHidden();

    // 2. Add three items one at a time
    await inventory.addToCart('sauce-labs-backpack');
    await expect(inventory.header.cartBadge).toHaveText('1');
    await expect(inventory.removeButton('sauce-labs-backpack')).toBeVisible();

    await inventory.addToCart('sauce-labs-bike-light');
    await expect(inventory.header.cartBadge).toHaveText('2');
    await expect(inventory.removeButton('sauce-labs-bike-light')).toBeVisible();

    await inventory.addToCart('sauce-labs-bolt-t-shirt');
    await expect(inventory.header.cartBadge).toHaveText('3');
    await expect(inventory.removeButton('sauce-labs-bolt-t-shirt')).toBeVisible();

    // 3. Click 'Remove' on the 'Sauce Labs Bike Light' tile directly from the Products page
    await inventory.removeFromCart('sauce-labs-bike-light');

    // expect: The cart badge count decreases to '2'
    await expect(inventory.header.cartBadge).toHaveText('2');

    // expect: The button for Sauce Labs Bike Light reverts to 'Add to cart'
    await expect(inventory.addToCartButton('sauce-labs-bike-light')).toBeVisible();
  });
});
