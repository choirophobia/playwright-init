// pages/InventoryPage.ts
import { expect, type Locator, type Page } from '@playwright/test';


export class InventoryPage {
  constructor(private page: Page) {}
  addToCartLinkButton = this.page.locator('.shopping_cart_link');
  cartBadge = this.page.locator('.shopping_cart_badge');
  addToCart(index: number) {
    return this.page.getByRole('button', { name: 'Add to cart' }).nth(index - 1);
  }

  removeFromCart(index: number) {
    return this.page.getByRole('button', { name: 'Remove' }).nth(index - 1);
  }

  async clickAddToCart(index: number) {
    await this.addToCart(index).click();
  }

  async clickRemoveFromCart(index: number) {
    await this.removeFromCart(index).click();
  }

  async clickAddToCartLinkButton() {
    await this.addToCartLinkButton.click();
  }

  async assertCartBadgeCount(count: number) {
    await expect(this.cartBadge).toHaveText(String(count));
  }
}