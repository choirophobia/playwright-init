import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Visual Regression', () => {
  test('Checkout overview step matches its visual baseline', async ({ page }, testInfo) => {
    // Visual baselines are only maintained for chromium — see README: Visual Regression Testing.
    test.skip(testInfo.project.name !== 'chromium', 'Visual baselines are chromium-only');

    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();
    await cart.checkout();
    await checkout.fillInfo('Fikri', 'Ahmadi', '12345');
    await checkout.continueToOverview();

    await expect(page).toHaveScreenshot('checkout-overview-page.png', { fullPage: true });
  });
});
