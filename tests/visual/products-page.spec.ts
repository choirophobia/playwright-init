import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Visual Regression', () => {
  test('Products page matches its visual baseline', async ({ page }, testInfo) => {
    // Visual baselines are only maintained for chromium — see README: Visual Regression Testing.
    test.skip(testInfo.project.name !== 'chromium', 'Visual baselines are chromium-only');

    const inventory = new InventoryPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await expect(inventory.header.title).toHaveText('Products');

    await expect(page).toHaveScreenshot('products-page.png', { fullPage: true });
  });
});
