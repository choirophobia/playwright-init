import { test } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { expectNoSeriousAccessibilityViolations } from '../../utils/axe';

test.describe('Accessibility', () => {
  test('Checkout information step has no critical or serious accessibility violations', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.header.openCart();
    await cart.checkout();

    await expectNoSeriousAccessibilityViolations(page);
  });
});
