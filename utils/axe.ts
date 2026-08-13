// utils/axe.ts
import { type Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

/**
 * Impact levels axe-core itself considers most likely to block assistive-technology
 * users. "moderate"/"minor" violations are intentionally not asserted on — see
 * README: Accessibility Testing for why (SauceDemo has real, sitewide moderate
 * findings that aren't the target of this suite).
 */
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

type Options = {
  /** axe rule IDs to exclude from this assertion — for known gaps already tracked in their own "(known accessibility gap)" test. */
  ignoreRuleIds?: string[];
};

export async function expectNoSeriousAccessibilityViolations(page: Page, options: Options = {}) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => BLOCKING_IMPACTS.has(violation.impact ?? '') && !options.ignoreRuleIds?.includes(violation.id),
  );
  expect(blocking, describeViolations(blocking)).toEqual([]);
}

function describeViolations(violations: Result[]): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`)
    .join('\n');
}
