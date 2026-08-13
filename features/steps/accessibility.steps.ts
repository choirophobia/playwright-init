import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import AxeBuilder from '@axe-core/playwright';
import { test } from './fixtures';
import { expectNoSeriousAccessibilityViolations } from '../../utils/axe';

const { Then } = createBdd(test);

Then('the page should have no critical or serious accessibility violations', async ({ page }) => {
  await expectNoSeriousAccessibilityViolations(page);
});

Then('the page should have no critical or serious accessibility violations, aside from the known sort-dropdown gap', async ({ page }) => {
  await expectNoSeriousAccessibilityViolations(page, { ignoreRuleIds: ['select-name'] });
});

Then('the sort dropdown should have a known accessibility gap: {string}', async ({ page, inventory }, ruleId: string) => {
  const results = await new AxeBuilder({ page }).include('[data-test="product-sort-container"]').analyze();
  const violation = results.violations.find((v) => v.id === ruleId);

  await expect(inventory.sortDropdown).toBeVisible();
  expect(violation?.impact).toBe('critical');
});
