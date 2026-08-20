import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoSeriousAccessibilityViolations } from '../../utils/axe';

test.describe('Accessibility', () => {
  test('Products page has no critical or serious accessibility violations, aside from the known sort-dropdown gap', async ({ page }) => {
    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');

    await expectNoSeriousAccessibilityViolations(page, { ignoreRuleIds: ['select-name'] });
  });

  test('Products page sort dropdown is missing an accessible name (known accessibility gap)', async ({ page }) => {
    // Already authenticated — see tests/auth.setup.ts
    await page.goto('/inventory.html');

    const results = await new AxeBuilder({ page }).include('[data-test="product-sort-container"]').analyze();
    const selectNameViolation = results.violations.find((violation) => violation.id === 'select-name');

    // expect (known gap): the product sort <select> has no accessible name (no <label>,
    // aria-label, or aria-labelledby), so screen reader users can't tell what it does.
    expect(selectNameViolation?.impact).toBe('critical');
  });
});
