// pages/LoginPage.ts
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorDismissButton: Locator;
  readonly acceptedUsernamesHeading: Locator;
  readonly credentialsList: Locator;
  readonly passwordNote: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Swag Labs');
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorDismissButton = page.locator('[data-test="error-button"]');
    this.acceptedUsernamesHeading = page.getByRole('heading', { name: 'Accepted usernames are:' });
    this.credentialsList = page.locator('[data-test="login-credentials"]');
    this.passwordNote = page.locator('[data-test="login-password"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async dismissError() {
    await this.errorDismissButton.click();
  }
}
