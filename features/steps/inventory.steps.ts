import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { When, Then } = createBdd(test);

Then('each product should show an image, name, description, price, and an Add to cart button', async ({ inventory }) => {
  // Soft assertions: check every product even if one is missing a field, instead of
  // stopping at the first failure and leaving the other 5 products unverified.
  const count = await inventory.items.count();
  for (let i = 0; i < count; i++) {
    const item = inventory.items.nth(i);
    await expect.soft(inventory.itemImage(item)).toBeVisible();
    await expect.soft(inventory.itemName(item)).toBeVisible();
    await expect.soft(inventory.itemDesc(item)).toBeVisible();
    await expect.soft(inventory.itemPrice(item)).toHaveText(/^\$\d+\.\d{2}$/);
    await expect.soft(inventory.itemAddToCartButton(item)).toBeVisible();
  }
});

Then('the sort dropdown should default to {string}', async ({ inventory }, label: string) => {
  await expect(inventory.sortDropdown).toContainText(label);
});

When('I open the product {string}', async ({ inventory }, name: string) => {
  await inventory.openProduct(name);
});

Then('I should land on the product detail page for {string}', async ({ inventory }, name: string) => {
  await expect(inventory.detailName).toHaveText(name);
  await expect(inventory.detailDesc).toBeVisible();
  await expect(inventory.backToProductsButton).toBeVisible();
});

Then('the product detail page should show a valid price', async ({ inventory }) => {
  await expect(inventory.detailPrice).toHaveText(/^\$\d+\.\d{2}$/);
});

Then('the product detail page price should show {string}', async ({ inventory }, price: string) => {
  await expect(inventory.detailPrice).toHaveText(price);
});

Then('the product detail page should show the {string} button', async ({ inventory }, label: string) => {
  if (label === 'Remove') {
    await expect(inventory.detailRemoveButton).toBeVisible();
    await expect(inventory.detailAddToCartButton).toBeHidden();
  } else {
    await expect(inventory.detailAddToCartButton).toBeVisible();
    await expect(inventory.detailRemoveButton).toBeHidden();
  }
});

When('I click {string} on the product detail page', async ({ inventory }, label: string) => {
  if (label === 'Remove') {
    await inventory.detailRemoveButton.click();
  } else {
    await inventory.detailAddToCartButton.click();
  }
});

When('I go back to products', async ({ inventory }) => {
  await inventory.backToProductsButton.click();
});

Then('the products should be listed in the default order', async ({ inventory }) => {
  await expect(inventory.productNames).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
    'Sauce Labs Bolt T-Shirt',
    'Sauce Labs Fleece Jacket',
    'Sauce Labs Onesie',
    'Test.allTheThings() T-Shirt (Red)',
  ]);
});

When('I sort products by {string}', async ({ inventory }, option: string) => {
  await inventory.sortBy(option);
});

Then('the first product should be {string}', async ({ inventory }, name: string) => {
  await expect(inventory.productNames.first()).toHaveText(name);
});

Then('the last product should be {string}', async ({ inventory }, name: string) => {
  await expect(inventory.productNames.last()).toHaveText(name);
});

Then('the first product should be {string} priced {string}', async ({ inventory }, name: string, price: string) => {
  await expect(inventory.productNames.first()).toHaveText(name);
  await expect(inventory.productPrices.first()).toHaveText(price);
});

Then('the last product should be {string} priced {string}', async ({ inventory }, name: string, price: string) => {
  await expect(inventory.productNames.last()).toHaveText(name);
  await expect(inventory.productPrices.last()).toHaveText(price);
});

Then('only {int} product should show the {string} button', async ({ page, inventory }, count: number, label: string) => {
  await expect(inventory.items.filter({ has: page.getByRole('button', { name: label }) })).toHaveCount(count);
});

When('I reset the app state', async ({ inventory }) => {
  await inventory.header.openMenu();
  await inventory.header.resetAppStateLink.click();
  await inventory.header.closeMenuButton.click();
});

When('I navigate directly to the product detail page for id {int}', async ({ page }, id: number) => {
  await page.goto(`/inventory-item.html?id=${id}`);
});
