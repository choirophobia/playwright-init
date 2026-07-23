// pages/CheckoutPage.ts
import { expect, type Locator, type Page } from '@playwright/test';


export class CheckoutPage {
  constructor(private page: Page) {}
  checkoutButton = this.page.locator('#checkout');
  firstNameField = this.page.locator('#first-name');
  lastNameField = this.page.locator('#last-name');
  postalCodeField = this.page.locator('#postal-code');
  continueButton = this.page.locator('#continue');
  finishButton = this.page.locator('#finish');
  completeHeader = this.page.locator('.complete-header');


  async clickCheckoutButton() {
    await this.checkoutButton.click();
  }

  async fillCheckoutInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);
    await this.postalCodeField.fill(postalCode);
  }

  async clickContinueButton() {
    await this.continueButton.click();
  }

  async clickFinishButton() {
    await this.finishButton.click();
  }

  async assertCompleteHeader() {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }


}