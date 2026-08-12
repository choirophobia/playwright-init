import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

Given('I am on the Products page', async ({ page, inventory }) => {
  // Already authenticated — see tests/auth.setup.ts
  await page.goto('/inventory.html');
  await expect(inventory.header.title).toHaveText('Products');
});

When('I add {string} to the cart', async ({ inventory }, slug: string) => {
  await inventory.addToCart(slug);
});

When('I remove {string} from the cart on the Products page', async ({ inventory }, slug: string) => {
  await inventory.removeFromCart(slug);
});

When('I remove {string} from the cart page', async ({ cart }, slug: string) => {
  await cart.removeItem(slug);
});

When('I open the cart', async ({ inventory }) => {
  await inventory.header.openCart();
});

When('I click Continue Shopping', async ({ cart }) => {
  await cart.continueShopping();
});

Then('the cart badge should not be displayed', async ({ inventory }) => {
  await expect(inventory.header.cartBadge).toBeHidden();
});

Then('the cart badge should show {string}', async ({ inventory }, count: string) => {
  await expect(inventory.header.cartBadge).toHaveText(count);
});

Then('the {string} item should show the {string} button', async ({ inventory }, slug: string, label: string) => {
  if (label === 'Remove') {
    await expect(inventory.removeButton(slug)).toBeVisible();
  } else {
    await expect(inventory.addToCartButton(slug)).toBeVisible();
  }
});

Then('the cart should contain {int} item(s)', async ({ cart }, count: number) => {
  await expect(cart.items).toHaveCount(count);
});

Then('the Checkout button should be visible', async ({ cart }) => {
  await expect(cart.checkoutButton).toBeVisible();
});

Then('I should land on the Cart page', async ({ page, cart }) => {
  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cart.header.title).toHaveText('Your Cart');
});

Then(
  'the cart should show item {string} with quantity {string} and price {string}',
  async ({ cart }, name: string, quantity: string, price: string) => {
    const row = cart.itemRow(name);
    await expect(cart.itemQuantity(row)).toHaveText(quantity);
    await expect(cart.itemName(row)).toHaveText(name);
    await expect(cart.itemPrice(row)).toHaveText(price);
  },
);
