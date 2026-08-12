import { expect, type Locator } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { HeaderComponent } from '../../pages/HeaderComponent';

const { When, Then } = createBdd();

function menuLocator(header: HeaderComponent, label: string): Locator {
  switch (label) {
    case 'All Items':
      return header.allItemsLink;
    case 'About':
      return header.aboutLink;
    case 'Logout':
      return header.logoutLink;
    case 'Reset App State':
      return header.resetAppStateLink;
    case 'Close Menu':
      return header.closeMenuButton;
    default:
      throw new Error(`Unknown menu item: ${label}`);
  }
}

When('I open the menu', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.header.openMenu();
});

Then('the menu should show {string}', async ({ page }, label: string) => {
  const inventory = new InventoryPage(page);
  await expect(menuLocator(inventory.header, label)).toBeVisible();
});

When('I click Logout', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.header.logoutLink.click();
});

When('I logout', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.header.logout();
});

When('I navigate directly to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should be redirected to the login page', async ({ page }) => {
  await expect(page).toHaveURL('https://www.saucedemo.com/');
});

Then('the username and password fields should be empty', async ({ page }) => {
  const login = new LoginPage(page);
  await expect(login.usernameInput).toHaveValue('');
  await expect(login.passwordInput).toHaveValue('');
});

Then('the login button should be visible', async ({ page }) => {
  const login = new LoginPage(page);
  await expect(login.loginButton).toBeVisible();
});
