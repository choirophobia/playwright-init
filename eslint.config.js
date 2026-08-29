// eslint.config.js
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.features-gen/**',
      '.features-gen-auth/**',
      'playwright-report/**',
      'test-results/**',
      // Blank scaffold for the AI test generator (see README: AI-Assisted Workflow),
      // not real test code — its unused imports/params are the point, not a mistake.
      'tests/seed.spec.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
  },
  {
    files: ['tests/**/*.ts', 'features/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // playwright-bdd's Given/When/Then callbacks (features/steps/**) ARE the real
      // test bodies once bddgen compiles them into Playwright tests — this rule has
      // no concept of that pattern and flags every expect() inside a step as
      // "standalone." False positive for this project's BDD architecture.
      'playwright/no-standalone-expect': 'off',
      // These assertions happen inside shared helpers (e.g. utils/axe.ts's
      // expectNoSeriousAccessibilityViolations, @percy/playwright's percySnapshot)
      // rather than inline in the test body — tell the rule about them instead of
      // turning the check off entirely.
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectNoSeriousAccessibilityViolations', 'percySnapshot'] }],
    },
  },
  {
    files: ['tests/visual/**/*.ts'],
    rules: {
      // Deliberate, documented pattern (README: Visual Regression Testing) — these
      // tests intentionally skip themselves on every project except chromium, since
      // Percy only needs one local capture per page to render its own cross-browser/
      // width snapshots.
      'playwright/no-skipped-test': 'off',
    },
  },
);
