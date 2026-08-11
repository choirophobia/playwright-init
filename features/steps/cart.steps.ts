import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

const { Given, When, Then } = createBdd();

Given('I am on the Products page', async ({ page }) => {
  const inventory = new InventoryPage(page);
  // Already authenticated — see tests/auth.setup.ts
  await page.goto('/inventory.html');
  await expect(inventory.header.title).toHaveText('Products');
});

When('I add {string} to the cart', async ({ page }, slug: string) => {
  const inventory = new InventoryPage(page);
  await inventory.addToCart(slug);
});

When('I remove {string} from the cart on the Products page', async ({ page }, slug: string) => {
  const inventory = new InventoryPage(page);
  await inventory.removeFromCart(slug);
});

When('I remove {string} from the cart page', async ({ page }, slug: string) => {
  const cart = new CartPage(page);
  await cart.removeItem(slug);
});

When('I open the cart', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.header.openCart();
});

When('I click Continue Shopping', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.continueShopping();
});

Then('the cart badge should not be displayed', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.header.cartBadge).toBeHidden();
});

Then('the cart badge should show {string}', async ({ page }, count: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.header.cartBadge).toHaveText(count);
});

Then('the {string} item should show the {string} button', async ({ page }, slug: string, label: string) => {
  const inventory = new InventoryPage(page);
  if (label === 'Remove') {
    await expect(inventory.removeButton(slug)).toBeVisible();
  } else {
    await expect(inventory.addToCartButton(slug)).toBeVisible();
  }
});

Then('the cart should contain {int} item(s)', async ({ page }, count: number) => {
  const cart = new CartPage(page);
  await expect(cart.items).toHaveCount(count);
});

Then('the Checkout button should be visible', async ({ page }) => {
  const cart = new CartPage(page);
  await expect(cart.checkoutButton).toBeVisible();
});

Then('I should land on the Cart page', async ({ page }) => {
  const cart = new CartPage(page);
  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cart.header.title).toHaveText('Your Cart');
});

Then(
  'the cart should show item {string} with quantity {string} and price {string}',
  async ({ page }, name: string, quantity: string, price: string) => {
    const cart = new CartPage(page);
    const row = cart.itemRow(name);
    await expect(cart.itemQuantity(row)).toHaveText(quantity);
    await expect(cart.itemName(row)).toHaveText(name);
    await expect(cart.itemPrice(row)).toHaveText(price);
  },
);
