import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Visual Regression', () => {
  test('Cart page matches its visual baseline', async ({ page }, testInfo) => {
    // Visual baselines are only maintained for chromium — see README: Visual Regression Testing.
    test.skip(testInfo.project.name !== 'chromium', 'Visual baselines are chromium-only');

    const inventory = new InventoryPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();

    await expect(page).toHaveScreenshot('cart-page.png', { fullPage: true });
  });
});
