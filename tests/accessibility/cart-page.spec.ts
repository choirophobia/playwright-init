import { test } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { expectNoSeriousAccessibilityViolations } from '../../utils/axe';

test.describe('Accessibility', () => {
  test('Cart page has no critical or serious accessibility violations', async ({ page }) => {
    const inventory = new InventoryPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();

    await expectNoSeriousAccessibilityViolations(page);
  });
});
