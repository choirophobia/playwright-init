import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { InventoryPage } from '../../pages/InventoryPage';

const { When, Then } = createBdd();

Then('each product should show an image, name, description, price, and an Add to cart button', async ({ page }) => {
  const inventory = new InventoryPage(page);
  const count = await inventory.items.count();
  for (let i = 0; i < count; i++) {
    const item = inventory.items.nth(i);
    await expect(inventory.itemImage(item)).toBeVisible();
    await expect(inventory.itemName(item)).toBeVisible();
    await expect(inventory.itemDesc(item)).toBeVisible();
    await expect(inventory.itemPrice(item)).toHaveText(/^\$\d+\.\d{2}$/);
    await expect(inventory.itemAddToCartButton(item)).toBeVisible();
  }
});

Then('the sort dropdown should default to {string}', async ({ page }, label: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.sortDropdown).toContainText(label);
});

When('I open the product {string}', async ({ page }, name: string) => {
  const inventory = new InventoryPage(page);
  await inventory.openProduct(name);
});

Then('I should land on the product detail page for {string}', async ({ page }, name: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.detailName).toHaveText(name);
  await expect(inventory.detailDesc).toBeVisible();
  await expect(inventory.backToProductsButton).toBeVisible();
});

Then('the product detail page should show a valid price', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.detailPrice).toHaveText(/^\$\d+\.\d{2}$/);
});

Then('the product detail page price should show {string}', async ({ page }, price: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.detailPrice).toHaveText(price);
});

Then('the product detail page should show the {string} button', async ({ page }, label: string) => {
  const inventory = new InventoryPage(page);
  if (label === 'Remove') {
    await expect(inventory.detailRemoveButton).toBeVisible();
    await expect(inventory.detailAddToCartButton).toBeHidden();
  } else {
    await expect(inventory.detailAddToCartButton).toBeVisible();
    await expect(inventory.detailRemoveButton).toBeHidden();
  }
});

When('I click {string} on the product detail page', async ({ page }, label: string) => {
  const inventory = new InventoryPage(page);
  if (label === 'Remove') {
    await inventory.detailRemoveButton.click();
  } else {
    await inventory.detailAddToCartButton.click();
  }
});

When('I go back to products', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.backToProductsButton.click();
});

Then('the products should be listed in the default order', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
    'Sauce Labs Bolt T-Shirt',
    'Sauce Labs Fleece Jacket',
    'Sauce Labs Onesie',
    'Test.allTheThings() T-Shirt (Red)',
  ]);
});

When('I sort products by {string}', async ({ page }, option: string) => {
  const inventory = new InventoryPage(page);
  await inventory.sortBy(option);
});

Then('the first product should be {string}', async ({ page }, name: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames.first()).toHaveText(name);
});

Then('the last product should be {string}', async ({ page }, name: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames.last()).toHaveText(name);
});

Then('the first product should be {string} priced {string}', async ({ page }, name: string, price: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames.first()).toHaveText(name);
  await expect(inventory.productPrices.first()).toHaveText(price);
});

Then('the last product should be {string} priced {string}', async ({ page }, name: string, price: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames.last()).toHaveText(name);
  await expect(inventory.productPrices.last()).toHaveText(price);
});

Then('only {int} product should show the {string} button', async ({ page }, count: number, label: string) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.items.filter({ has: page.getByRole('button', { name: label }) })).toHaveCount(count);
});

When('I reset the app state', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.header.openMenu();
  await inventory.header.resetAppStateLink.click();
  await inventory.header.closeMenuButton.click();
});

When('I navigate directly to the product detail page for id {int}', async ({ page }, id: number) => {
  await page.goto(`/inventory-item.html?id=${id}`);
});
