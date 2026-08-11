import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

const { Given, When, Then } = createBdd();

Given('I am on the login page', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await expect(login.heading).toBeVisible();
});

When('I log in with username {string} and password {string}', async ({ page }, username: string, password: string) => {
  const login = new LoginPage(page);
  await login.login(username, password);
});

When('I click the login button without entering any credentials', async ({ page }) => {
  const login = new LoginPage(page);
  await login.loginButton.click();
});

When('I enter {string} as the username and click the login button', async ({ page }, username: string) => {
  const login = new LoginPage(page);
  await login.usernameInput.fill(username);
  await login.loginButton.click();
});

Then('I should land on the Products page', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(inventory.header.title).toHaveText('Products');
});

Then('I should see {int} products listed', async ({ page }, count: number) => {
  const inventory = new InventoryPage(page);
  await expect(inventory.productNames).toHaveCount(count);
});

Then('no error message should be displayed', async ({ page }) => {
  const login = new LoginPage(page);
  await expect(login.errorMessage).toBeHidden();
});

Then('I should stay on the login page', async ({ page }) => {
  await expect(page).toHaveURL('https://www.saucedemo.com/');
});

Then('I should see the error message {string}', async ({ page }, message: string) => {
  const login = new LoginPage(page);
  await expect(login.errorMessage).toBeVisible();
  await expect(login.errorMessage).toContainText(message);
});
