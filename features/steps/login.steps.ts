import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { Given, When, Then } = createBdd(test);

Given('I am on the login page', async ({ login }) => {
  await login.goto();
  await expect(login.heading).toBeVisible();
});

When('I log in with username {string} and password {string}', async ({ login }, username: string, password: string) => {
  await login.login(username, password);
});

Then('I should land on the Products page', async ({ page, inventory }) => {
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(inventory.header.title).toHaveText('Products');
});

Then('I should see {int} products listed', async ({ inventory }, count: number) => {
  await expect(inventory.productNames).toHaveCount(count);
});

Then('no error message should be displayed', async ({ login }) => {
  await expect(login.errorMessage).toBeHidden();
});

Then('I should stay on the login page', async ({ page }) => {
  await expect(page).toHaveURL('https://www.saucedemo.com/');
});

Then('I should see the error message {string}', async ({ login }, message: string) => {
  await expect(login.errorMessage).toBeVisible();
  await expect(login.errorMessage).toContainText(message);
});
