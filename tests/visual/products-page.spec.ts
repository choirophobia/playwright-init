import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('Visual Regression', () => {
  test('Products page matches its visual baseline', async ({ page }, testInfo) => {
    // Percy renders snapshots itself across configured browsers/widths — see README:
    // Visual Regression Testing. One local capture is enough.
    test.skip(testInfo.project.name !== 'chromium', 'Visual snapshots only need to be captured once');

    const inventory = new InventoryPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await expect(inventory.header.title).toHaveText('Products');

    await percySnapshot(page, 'Products page');
  });
});
