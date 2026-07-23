// pages/LoginPage.ts
import { expect, type Locator, type Page } from '@playwright/test';


export class LoginPage {
  constructor(private page: Page) {}
  usernameInput = this.page.locator('id=user-name');
  passwordInput = this.page.locator('id=password');
  loginButton = this.page.locator('id=login-button');
  errorMessage = this.page.locator('id=error');

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}