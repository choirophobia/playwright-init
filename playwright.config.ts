import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/** Path where the logged-in storage state (cookies/localStorage) is cached by tests/auth.setup.ts */
const authFile = 'playwright/.auth/standard_user.json';

/**
 * playwright-bdd: generates real Playwright test files from Gherkin .feature files.
 * Run `npx bddgen` (or `npm test`, which runs it first) to (re)generate them before `playwright test` runs.
 * See https://vitalets.github.io/playwright-bdd/
 *
 * Two configs split scenarios by the `@auth` tag on the Feature line: unauthenticated
 * scenarios (e.g. login) run without storage state, while `@auth`-tagged scenarios
 * (e.g. cart) run against the `bdd-*-auth` projects below, which depend on `setup`
 * and load the saved session, same as the plain `chromium`/`firefox`/`webkit` projects.
 */
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'features/steps/**/*.ts',
  tags: 'not @auth',
});

const bddAuthTestDir = defineBddConfig({
  outputDir: '.features-gen-auth',
  features: 'features/**/*.feature',
  steps: 'features/steps/**/*.ts',
  tags: '@auth',
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /*
   * Reporter to use. See https://playwright.dev/docs/test-reporters
   * On CI, adds Playwright's built-in `github` reporter alongside the HTML report: it
   * turns test failures into inline annotations on the PR diff in GitHub's UI, using
   * the `::error::` workflow command — no extra dependency, no extra CI step, since
   * Playwright ships it and .github/workflows/playwright.yml already sets CI=true.
   * See README: Continuous Integration.
   */
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://www.saucedemo.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      /* Logs in once and saves storage state to `authFile`, ahead of every other project */
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: authFile },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: authFile },
      dependencies: ['setup'],
    },

    /*
     * BDD projects: run Gherkin scenarios from features/*.feature (generated into
     * bddTestDir by playwright-bdd). No `dependencies`/`storageState` here on purpose —
     * the login feature tests the login form itself, so it must start unauthenticated,
     * same as tests/login/*.spec.ts.
     */
    {
      name: 'bdd-chromium',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'bdd-firefox',
      testDir: bddTestDir,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'bdd-webkit',
      testDir: bddTestDir,
      use: { ...devices['Desktop Safari'] },
    },

    /*
     * BDD projects for `@auth`-tagged scenarios (e.g. features/cart.feature): depend on
     * `setup` and reuse the saved session, same as the plain chromium/firefox/webkit projects.
     */
    {
      name: 'bdd-chromium-auth',
      testDir: bddAuthTestDir,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },

    {
      name: 'bdd-firefox-auth',
      testDir: bddAuthTestDir,
      use: { ...devices['Desktop Firefox'], storageState: authFile },
      dependencies: ['setup'],
    },

    {
      name: 'bdd-webkit-auth',
      testDir: bddAuthTestDir,
      use: { ...devices['Desktop Safari'], storageState: authFile },
      dependencies: ['setup'],
    },

    /*
     * Mobile viewport projects: run the plain tests/*.spec.ts suite (not the BDD
     * suite — same scenarios, so duplicating them across 5 browser profiles wouldn't
     * add coverage, just runtime) at real device viewport/UA, same auth setup as the
     * desktop projects. See README: Mobile & Responsive Testing.
     */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'], storageState: authFile },
      dependencies: ['setup'],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
