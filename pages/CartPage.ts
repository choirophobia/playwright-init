// pages/CartPage.ts
import { expect, type Locator, type Page } from '@playwright/test';


export class CartPage {
  constructor(private page: Page) {}
  cartItems = this.page.locator('.cart_item');
  continueShoppingButton = this.page.locator('#continue-shopping');
  checkoutButton = this.page.locator('#checkout');

  removeButton(index: number) {
    return this.cartItems.nth(index - 1).getByRole('button', { name: 'Remove' });
  }

  async clickContinueShoppingButton() {
    await this.continueShoppingButton.click();
  }

  async clickCheckoutButton() {
    await this.checkoutButton.click();
  }

  async removeItem(index: number) {
    await this.removeButton(index).click();
  }

  async assertItemCount(count: number) {
    await expect(this.cartItems).toHaveCount(count);
  }
}
