import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';
// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

test('login scenario', async ({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/');
  await login.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory/);

});


test('login, add to cart 2 items, checkout', async({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/');
  await login.login('standard_user', 'secret_sauce');
  const inventory = new InventoryPage(page);
  await inventory.clickAddToCart(1);
  await inventory.clickAddToCart(2);
  await inventory.clickAddToCartLinkButton();
  const checkout = new CheckoutPage(page);
  await checkout.clickCheckoutButton();
  await checkout.fillCheckoutInfo('John', 'Doe', '12345');
  await checkout.clickContinueButton();
  await checkout.clickFinishButton();
  await expect(page).toHaveURL(/checkout-complete/);
});



