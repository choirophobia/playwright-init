import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.beforeEach(async ({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/');
  await login.login('standard_user', 'secret_sauce');
});

test('login scenario', async ({ page }) => {
  await expect(page).toHaveURL(/inventory/);
});


test('login, add to cart 2 items, checkout', async({ page }) => {
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


test('login, manage cart items, checkout, and reach thank you page', async ({ page }) => {
  const inventory = new InventoryPage(page);
  await inventory.clickAddToCart(1);
  await inventory.clickAddToCart(2);

  const cart = new CartPage(page);
  await inventory.clickAddToCartLinkButton();
  await cart.assertItemCount(2);

  await cart.clickContinueShoppingButton();
  await inventory.clickAddToCart(3);
  await inventory.assertCartBadgeCount(3);

  await inventory.clickRemoveFromCart(3);
  await inventory.assertCartBadgeCount(2);

  await inventory.clickAddToCartLinkButton();
  await cart.assertItemCount(2);
  await cart.clickCheckoutButton();

  const checkout = new CheckoutPage(page);
  await checkout.fillCheckoutInfo('John', 'Doe', '12345');
  await checkout.clickContinueButton();
  await checkout.clickFinishButton();

  await expect(page).toHaveURL(/checkout-complete/);
  await checkout.assertCompleteHeader();
});



