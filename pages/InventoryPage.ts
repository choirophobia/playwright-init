// pages/InventoryPage.ts
import { expect, type Locator, type Page } from '@playwright/test';


export class InventoryPage {
  constructor(private page: Page) {}
  addToCartLinkButton = this.page.locator('.shopping_cart_link');
  addToCart(index: number) {
    return this.page.getByRole('button', { name: 'Add to cart' }).nth(index - 1);
  }

  async clickAddToCart(index: number) {
    await this.addToCart(index).click();
  }

  async clickAddToCartLinkButton() {
    await this.addToCartLinkButton.click();
  }
}