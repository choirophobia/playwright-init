// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Inventory Browsing', () => {
  test('Browse the product inventory and view product details', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // 1. Start already authenticated (see tests/auth.setup.ts) and go to the Products page
    await page.goto('/inventory.html');

    // expect: User lands on the Products page at /inventory.html
    await expect(page).toHaveURL(/inventory\.html/);

    // 2. Inspect the product grid
    await expect(inventory.items).toHaveCount(6);

    // expect: Each of the 6 products displays an image, name, short description, price, and an 'Add to cart' button
    const count = await inventory.items.count();
    for (let i = 0; i < count; i++) {
      const item = inventory.items.nth(i);
      await expect(inventory.itemImage(item)).toBeVisible();
      await expect(inventory.itemName(item)).toBeVisible();
      await expect(inventory.itemDesc(item)).toBeVisible();
      await expect(inventory.itemPrice(item)).toHaveText(/^\$\d+\.\d{2}$/);
      await expect(inventory.itemAddToCartButton(item)).toBeVisible();
    }

    // expect: Default sort order is 'Name (A to Z)' as shown in the sort dropdown
    await expect(inventory.sortDropdown).toHaveValue('az');
    await expect(inventory.sortDropdown).toContainText('Name (A to Z)');

    // 3. Click on a product name (e.g. 'Sauce Labs Backpack')
    await inventory.openProduct('Sauce Labs Backpack');

    // expect: User is navigated to that product's detail page
    await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
    await expect(inventory.detailName).toHaveText('Sauce Labs Backpack');
    await expect(inventory.detailDesc).toBeVisible();
    await expect(inventory.detailPrice).toHaveText(/^\$\d+\.\d{2}$/);
    await expect(inventory.detailAddToCartButton).toBeVisible();
    await expect(inventory.backToProductsButton).toBeVisible();

    // 4. Click 'Back to products'
    await inventory.backToProductsButton.click();

    // expect: User returns to the Products/inventory page with the same product list
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.items).toHaveCount(6);
    await expect(inventory.productNames).toHaveText([
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
      'Sauce Labs Bolt T-Shirt',
      'Sauce Labs Fleece Jacket',
      'Sauce Labs Onesie',
      'Test.allTheThings() T-Shirt (Red)',
    ]);
  });
});
