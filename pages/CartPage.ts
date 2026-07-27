// pages/CartPage.ts
import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';

export class CartPage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly items: Locator;
  readonly quantityLabel: Locator;
  readonly descLabel: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.items = page.locator('[data-test="inventory-item"]');
    this.quantityLabel = page.locator('[data-test="cart-quantity-label"]');
    this.descLabel = page.locator('[data-test="cart-desc-label"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  itemRow(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  itemQuantity(row: Locator): Locator {
    return row.locator('[data-test="item-quantity"]');
  }

  itemName(row: Locator): Locator {
    return row.locator('[data-test="inventory-item-name"]');
  }

  itemDesc(row: Locator): Locator {
    return row.locator('[data-test="inventory-item-desc"]');
  }

  itemPrice(row: Locator): Locator {
    return row.locator('[data-test="inventory-item-price"]');
  }

  removeButton(slug: string): Locator {
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  async removeItem(slug: string) {
    await this.removeButton(slug).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
