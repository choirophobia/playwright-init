// pages/InventoryPage.ts
import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';

export class InventoryPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly items: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly sortDropdown: Locator;
  readonly detailName: Locator;
  readonly detailDesc: Locator;
  readonly detailPrice: Locator;
  readonly detailAddToCartButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.items = page.locator('[data-test="inventory-item"]');
    this.productNames = page.locator('[data-test="inventory-item-name"]');
    this.productPrices = page.locator('[data-test="inventory-item-price"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.detailName = page.locator('.inventory_details_name');
    this.detailDesc = page.locator('.inventory_details_desc');
    this.detailPrice = page.locator('.inventory_details_price');
    this.detailAddToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.backToProductsButton = page.locator('[data-test="back-to-products"]');
  }

  addToCartButton(slug: string): Locator {
    return this.page.locator(`[data-test="add-to-cart-${slug}"]`);
  }

  removeButton(slug: string): Locator {
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  async addToCart(slug: string) {
    await this.addToCartButton(slug).click();
  }

  async removeFromCart(slug: string) {
    await this.removeButton(slug).click();
  }

  itemImage(item: Locator): Locator {
    return item.locator('img.inventory_item_img');
  }

  itemName(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-name"]');
  }

  itemDesc(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-desc"]');
  }

  itemPrice(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-price"]');
  }

  itemAddToCartButton(item: Locator): Locator {
    return item.getByRole('button', { name: 'Add to cart' });
  }

  async openProduct(name: string) {
    await this.productNames.filter({ hasText: name }).click();
  }

  async sortBy(option: string) {
    await this.sortDropdown.selectOption([option]);
  }
}
