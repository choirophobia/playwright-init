# Swag Labs (SauceDemo) Playwright Test Suite

End-to-end test automation for [Swag Labs](https://www.saucedemo.com), a demo e-commerce app, built with [Playwright](https://playwright.dev/) + TypeScript. Tests are generated and maintained with the help of the Playwright MCP planner/generator/healer workflow (see [AI-Assisted Workflow](#ai-assisted-workflow) below).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Architecture](#architecture)
- [Authentication (Storage State)](#authentication-storage-state)
- [BDD Tests (Cucumber)](#bdd-tests-cucumber)
- [Accessibility Testing](#accessibility-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Mobile & Responsive Testing](#mobile--responsive-testing)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [AI-Assisted Workflow](#ai-assisted-workflow)

## Tech Stack

| Tool | Purpose |
|---|---|
| [`@playwright/test`](https://playwright.dev/) | Test runner, assertions, browser automation |
| TypeScript | Static typing for tests and page objects |
| [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/) | Generates native Playwright tests from Gherkin `.feature` files |
| [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) | Automated WCAG accessibility scans (axe-core rule engine) |
| [Percy](https://percy.io) (`@percy/cli` + `@percy/playwright`) | Visual regression testing — cloud-rendered snapshots, no committed baseline PNGs |
| [ESLint](https://eslint.org/) + [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright) + [`typescript-eslint`](https://typescript-eslint.io/) | Static analysis — catches Playwright-specific mistakes (missing `await`, empty tests) plus general TS/JS issues |
| Chromium / Firefox / WebKit | Cross-browser test projects |
| GitHub Actions | CI — runs the suite on push, PR, and a daily schedule |
| Discord Webhook | CI notifications — per-browser-project pass/fail breakdown, built from Playwright's `json` reporter |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | Weekly automated PRs for npm and GitHub Actions dependency updates |

## Project Structure

```
.
├── pages/                  # Page Object Model (POM) classes
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── HeaderComponent.ts
├── tests/                  # Spec files, grouped by feature
│   ├── auth.setup.ts       # Logs in once, saves session to playwright/.auth/
│   ├── login/              # Unauthenticated — tests the login form itself
│   ├── inventory/          # Authenticated via saved storage state
│   ├── cart/               # Authenticated via saved storage state
│   ├── checkout/           # Authenticated via saved storage state
│   ├── logout/             # Authenticated via saved storage state
│   ├── accessibility/      # axe-core scans of each core page — see Accessibility Testing
│   ├── visual/              # Percy snapshot captures of each core page — see Visual Regression Testing
│   └── seed.spec.ts        # Blank seed test used by the AI test generator
├── features/                 # Gherkin BDD scenarios (playwright-bdd)
│   ├── login.feature        # Same login coverage as tests/login/, untagged (unauthenticated)
│   ├── cart.feature         # Same cart coverage as tests/cart/, tagged @auth
│   ├── checkout.feature     # Same checkout coverage as tests/checkout/, tagged @auth
│   ├── logout.feature       # Same logout coverage as tests/logout/, tagged @auth
│   ├── inventory.feature    # Same inventory coverage as tests/inventory/, tagged @auth
│   ├── accessibility.feature # Same accessibility coverage as tests/accessibility/, tagged per-scenario
│   └── steps/
│       ├── fixtures.ts           # Custom `test` injecting page objects as fixtures — see below
│       ├── login.steps.ts        # Login step definitions
│       ├── cart.steps.ts         # Cart step definitions
│       ├── checkout.steps.ts     # Checkout step definitions
│       ├── logout.steps.ts       # Logout step definitions
│       ├── inventory.steps.ts    # Inventory step definitions
│       └── accessibility.steps.ts # Accessibility step definitions
├── utils/
│   └── axe.ts               # Shared axe-core scan + assertion helper — see Accessibility Testing
├── specs/                  # Human-readable test plans (Markdown)
│   └── basic-operations.md
├── playwright.config.ts    # Base URL, browsers, reporter, trace, BDD settings
├── eslint.config.js        # ESLint + eslint-plugin-playwright + typescript-eslint rules
├── .percy.yml              # Percy snapshot widths — see Visual Regression Testing
├── scripts/
│   └── discord-notify.mjs  # Per-browser-project pass/fail Discord notification — see Continuous Integration
├── .github/
│   ├── workflows/
│   │   └── playwright.yml  # Main CI pipeline
│   └── dependabot.yml      # Weekly npm + GitHub Actions dependency update PRs
└── .mcp.json               # Playwright MCP server config
```

## Getting Started

**Prerequisites:** Node.js (LTS)

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

## Running Tests

```bash
# Type-check the whole project (no test run, no browsers needed)
npm run typecheck

# Run the full suite headless (all browsers, incl. BDD scenarios)
npm test

# Run in interactive UI mode (recommended for local development)
npm run test:ui

# Run a single file or folder
npx playwright test tests/cart

# Run against a single browser project
npx playwright test --project=chromium

# Run only the mobile viewport projects (Pixel 5 / iPhone 12 emulation)
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"

# Run only the BDD/Gherkin scenarios (unauthenticated, e.g. login)
npx playwright test --project=bdd-chromium

# Run only the @auth-tagged BDD/Gherkin scenarios (e.g. cart)
npx playwright test --project=bdd-chromium-auth

# Run only the visual regression suite (chromium only)
npx playwright test tests/visual --project=chromium

# Regenerate visual regression baselines (review the diff before committing)
npx playwright test tests/visual --project=chromium --update-snapshots

# Regenerate Playwright tests from .feature files without running them
npm run bddgen

# Debug a specific test
npx playwright test tests/login/valid-login.spec.ts --debug

# View the last HTML report
npx playwright show-report
```

> `npm test` and `npm run test:ui` run `bddgen` first automatically. If you edit a `.feature` file or a step definition and use `npx playwright test` directly, run `npm run bddgen` beforehand or your changes won't be picked up.

## Architecture

### Page Object Model

Every page/component in the app has a corresponding class in `pages/` exposing typed `Locator`s and action methods, so specs read as business steps rather than raw selectors:

```ts
const login = new LoginPage(page);
await login.goto();
await login.login('standard_user', 'secret_sauce');
```

- **`LoginPage`** — login form, error banner, accepted-credentials panel
- **`InventoryPage`** — product list, add/remove-to-cart, sorting
- **`CartPage`** — cart contents, item removal, checkout entry point
- **`CheckoutPage`** — shipping info form, order overview, confirmation
- **`HeaderComponent`** — shared header (title, cart badge) composed into other page objects

### Shared Setup

Instead of repeating `login.goto()` + `login.login(...)` at the top of every spec, tests reuse a single **saved login session** (Playwright's `storageState` mechanism). See [Authentication (Storage State)](#authentication-storage-state) below for how this works and why. The `login/` specs are the one exception — they intentionally start unauthenticated because they're testing the login form itself.

### Configuration

Key settings in `playwright.config.ts`:

- **Base URL:** `https://www.saucedemo.com`
- **Browsers:** Chromium, Firefox, WebKit (Chromium runs headless by default), plus `Mobile Chrome` (Pixel 5) and `Mobile Safari` (iPhone 12) — see [Mobile & Responsive Testing](#mobile--responsive-testing)
- **Reporter:** HTML (`playwright-report/`)
- **Tracing:** captured on first retry
- **Failure artifacts:** a screenshot (`screenshot: 'only-on-failure'`) and a video recording (`video: 'retain-on-failure'`) are captured for a failing test and attached to the HTML report, scoped to the `chromium` project only — video recording adds per-test overhead across the whole run (every test is recorded, then discarded unless it fails), so enabling it on all 11 projects would meaningfully slow down CI for coverage this suite already gets from one browser
- **CI behavior:** `test.only` is forbidden, tests retry twice, and run with a single worker
- **Projects:** a `setup` project runs `tests/auth.setup.ts` once, and the `chromium`/`firefox`/`webkit`/`bdd-*-auth` projects each depend on it and reuse its saved session (see below)

### Soft Assertions

Most assertions in this suite use plain `expect()`, which throws immediately on failure — the right default, since most checks depend on the one before it (there's no point asserting the checkout total if the page never navigated to checkout at all). But `tests/inventory/browse-products.spec.ts` (and its BDD equivalent, the `each product should show an image, name, description, price, and an Add to cart button` step in `features/steps/inventory.steps.ts`) loops over all 6 products checking 5 independent fields each. With plain `expect()`, if product #1's image was broken, the test stops right there — products #2 through #6 never get checked at all in that run, and the failure message only ever tells you about product #1.

```ts
// Plain expect(): stops at the first failure, other 5 products go unchecked
for (const item of items) {
  await expect(itemImage(item)).toBeVisible();       // if this throws...
  await expect(itemName(item)).toBeVisible();        // ...none of this runs,
  // ...                                              // for this item or any after it
}

// expect.soft(): records the failure and keeps going
for (const item of items) {
  await expect.soft(itemImage(item)).toBeVisible();  // failure recorded, loop continues
  await expect.soft(itemName(item)).toBeVisible();
  // ...
}
// test.info().errors now lists every soft failure across all 6 products;
// Playwright still marks the test as failed overall once it finishes
```

Both loops in this suite use `expect.soft()` for exactly this reason: these 30 checks (6 products × 5 fields) are genuinely independent of each other, so there's no reason a broken image on product #1 should hide a broken price on product #4. The test still fails overall if *any* soft assertion fails — soft assertions don't make failures invisible, they just stop the first one from hiding the rest.

**When not to reach for it:** anywhere a later assertion only makes sense if an earlier one passed (navigated to the right page, an element that should exist before you check its contents). Soft-asserting those just produces a wall of confusing downstream errors that are really one root cause — save it for loops over independent, same-shape checks like this one.

## Authentication (Storage State)

Nearly every spec in this suite needs a logged-in session before it can test anything interesting. Logging in through the UI on every single test works, but it's slow (an extra page load + form submit per test) and it means your "add to cart" test is silently also an implicit login test — if the login page ever changes, unrelated tests start failing for the wrong reason.

Playwright's [`storageState`](https://playwright.dev/docs/auth) feature solves this: log in **once**, save the resulting cookies/localStorage to a JSON file, and have every other test start its browser context pre-loaded with that state — no UI login step required.

### How it works here

1. **`tests/auth.setup.ts`** is a special "setup" test. It logs into SauceDemo with `standard_user` / `secret_sauce`, confirms it landed on `/inventory.html`, then calls `page.context().storageState({ path: authFile })` to dump the session (SauceDemo stores the logged-in state in a `session-username` cookie) to `playwright/.auth/standard_user.json`.

2. **`playwright.config.ts`** defines a `setup` project that runs only that file, and the real browser projects (`chromium`, `firefox`, `webkit`) each:
   - declare `dependencies: ['setup']`, so Playwright always runs the login step first and waits for it to finish, and
   - set `use: { storageState: authFile }`, so every test in that project starts with the saved session already loaded.

   ```ts
   const authFile = 'playwright/.auth/standard_user.json';

   projects: [
     { name: 'setup', testMatch: /auth\.setup\.ts/ },
     {
       name: 'chromium',
       use: { ...devices['Desktop Chrome'], storageState: authFile },
       dependencies: ['setup'],
     },
     // ...firefox, webkit follow the same pattern
   ],
   ```

3. **Authenticated specs** (inventory, cart, checkout, logout) skip the login form entirely and just navigate straight to the app:

   ```ts
   test('Add a single item to the cart and verify the cart badge', async ({ page }) => {
     const inventory = new InventoryPage(page);

     // Already authenticated — see tests/auth.setup.ts
     await page.goto('/inventory.html');

     await inventory.addToCart('sauce-labs-backpack');
     // ...
   });
   ```

4. **Login specs** (`tests/login/*.spec.ts`) are the deliberate exception. Because they test the login form itself, they opt out of the shared session with `test.use()` at the top of the file, giving that file's tests a genuinely empty browser context:

   ```ts
   test.describe('Login', () => {
     // Must start unauthenticated — these tests exercise the login form itself
     test.use({ storageState: { cookies: [], origins: [] } });

     test('Valid login with standard_user succeeds...', async ({ page }) => {
       // starts logged out, as if storageState was never configured
     });
   });
   ```

### Steps to reproduce this pattern in your own suite

1. Write a setup test that performs login and calls `page.context().storageState({ path: <file> })` at the end.
2. Add `<file>`'s directory to `.gitignore` (already done here: `/playwright/.auth/`) — it contains live session data and shouldn't be committed.
3. In `playwright.config.ts`, add a `setup` project matching that file (`testMatch: /auth\.setup\.ts/`).
4. On every browser project that needs to be logged in, add `dependencies: ['setup']` and `use: { storageState: <file> }`.
5. Delete the manual `login.goto()` / `login.login(...)` calls from the specs that no longer need them; replace with a direct `page.goto('/your-authenticated-page')`.
6. For any spec that must stay unauthenticated (login/signup flows, guest checkout, etc.), override it locally with `test.use({ storageState: { cookies: [], origins: [] } })`.

### Trade-off to know

Because `dependencies: ['setup']` is a **project-level** dependency, the login step runs once before *any* test in that project runs — including the unauthenticated `login/` specs, which don't actually need it. That's a minor, one-time cost (a few hundred ms), not a per-test cost. The bigger trade-off is coverage-shape: since most specs no longer exercise the login form, a login-page regression that doesn't break the underlying session cookie won't be caught by them — that's exactly what the dedicated `login/` specs exist to catch.

## BDD Tests (Cucumber)

Alongside the plain `tests/*.spec.ts` suite, this project also runs a parallel BDD/Gherkin suite via [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/), covering the same scenarios as `tests/login/`, `tests/cart/`, `tests/checkout/`, `tests/logout/`, and `tests/inventory/`. It's a growing suite — more `.feature` files can be added the same way as coverage expands.

### What is BDD?

BDD (Behavior-Driven Development) is a way of writing tests as plain-language scenarios — `Given/When/Then` steps in [Gherkin](https://cucumber.io/docs/gherkin/), the syntax [Cucumber](https://cucumber.io/) popularized — instead of raw test code. A `.feature` file like `features/cart.feature` reads as a spec anyone can follow (`When I add "sauce-labs-backpack" to the cart / Then the cart badge should show "1"`), while a `.steps.ts` file maps each line to the actual Playwright code that runs it.

**Why use it:** it gives non-engineers (PMs, QA, stakeholders) a version of the test suite they can read and review without knowing TypeScript, and it forces scenarios to be described in terms of user-visible behavior rather than implementation details — which tends to produce more resilient tests. The step-reuse system also means a vocabulary of steps (`Given I am on the Products page`, `Then the cart badge should show {string}`) builds up over time, so new scenarios are often just new combinations of existing steps.

**When to reach for it:** it's worth the extra layer (a `.feature` file plus a `.steps.ts` file plus keeping step wording unique — see [Custom Fixtures for Page Objects](#custom-fixtures-for-page-objects) and the notes on duplicate steps below) when a team actually has non-engineers reading or writing scenarios, or when a shared step vocabulary will get reused a lot. For a solo project or a small team that's comfortable reading TypeScript directly, plain `tests/*.spec.ts` files — like the ones this suite already has — are simpler to write and debug, with no translation layer between the Gherkin text and the code that runs it. This repo runs both side by side deliberately, as a comparison.

### Why playwright-bdd instead of plain Cucumber.js

Playwright already has a first-class test runner with parallelism, tracing, retries, an HTML reporter, and (in this repo) the `storageState`-based auth setup described above. Running Cucumber via its own standalone runner (`@cucumber/cucumber` / `cucumber-js`) would mean a second, separate test runner with none of that — you'd have to hand-roll browser launch/teardown and manually reload the storage state file yourself.

`playwright-bdd` instead **compiles Gherkin `.feature` files into real Playwright test files** ahead of time. Those generated tests then run through `npx playwright test` like any other spec, so every existing project (tracing, HTML reporter, cross-browser projects, and — for scenarios that need it — the `setup`/`storageState` auth flow) keeps working unchanged.

### How it's wired up

1. **`features/login.feature`** — the same three login scenarios as `tests/login/*.spec.ts`, written as Gherkin `Given/When/Then` steps, sharing a `Background` for the common "start on the login page" step. Untagged, since it must run unauthenticated.
2. **`features/cart.feature`**, **`features/checkout.feature`**, **`features/logout.feature`**, **`features/inventory.feature`** — the same scenarios as their `tests/*` counterparts, each sharing a `Background` of `Given I am on the Products page`. All tagged `@auth` at the `Feature` level, since every scenario needs a logged-in session.
3. **`features/steps/*.steps.ts`** — one step-definition file per feature, using `createBdd(test)` from `playwright-bdd`, where `test` is the fixture-extended test from `features/steps/fixtures.ts` (see [Custom Fixtures for Page Objects](#custom-fixtures-for-page-objects) below). Each step destructures the page object it needs (`{ inventory }`, `{ cart }`, `{ checkout }`, `{ login }`) directly from its arguments — no separate automation layer. A step's wording must stay unique across all step files (they're combined into one pool), so shared phrasing is defined once and reused across features — e.g. `Given I am on the Products page` lives in `cart.steps.ts` and is reused by `checkout.feature`, `logout.feature`, and `inventory.feature`; `Then I should land on the Products page` and `When I log in with username {string} and password {string}` live in `login.steps.ts` and are reused by `logout.feature`.
4. **`playwright.config.ts`** — two `defineBddConfig()` calls compile the same `features/**/*.feature` glob into two separate output directories, split by the `@auth` tag:
   - `defineBddConfig({ tags: 'not @auth', ... })` → `.features-gen/`, for untagged scenarios (login). Backs the `bdd-chromium`/`bdd-firefox`/`bdd-webkit` projects, which — like `tests/login/*.spec.ts` — have **no** `dependencies: ['setup']` and **no** `storageState`.
   - `defineBddConfig({ tags: '@auth', outputDir: '.features-gen-auth', ... })` → `.features-gen-auth/`, for `@auth`-tagged scenarios (cart, checkout, logout, inventory). Backs the `bdd-chromium-auth`/`bdd-firefox-auth`/`bdd-webkit-auth` projects, which **do** declare `dependencies: ['setup']` and `storageState: authFile`, exactly like the plain `chromium`/`firefox`/`webkit` projects.

   Both output directories are gitignored build artifacts, regenerated on every run — same idea as `playwright/.auth/`.
5. **`package.json`** — `npm run bddgen` runs the `bddgen` CLI to (re)generate the Playwright test files from the `.feature`/step files; `npm test` and `npm run test:ui` run it automatically before `playwright test`.

### Custom Fixtures for Page Objects

Every step needs a page object — `InventoryPage`, `CartPage`, `CheckoutPage`, or `LoginPage` — to actually interact with the app. `createBdd()` accepts an optional custom Playwright `test` instance, and if that `test` has been `.extend()`-ed with fixtures, every step gets those fixtures injected as part of its arguments, exactly like Playwright's built-in `page`/`context`/`browser` fixtures. This suite uses that to hand step definitions a ready-made page object instead of constructing one by hand in every step.

**Without fixtures** — every step that needs a page object has to build one itself from `page`:

```ts
// createBdd() with no argument uses playwright-bdd's default `test`
const { When, Then } = createBdd();

When('I add {string} to the cart', async ({ page }, slug: string) => {
  const inventory = new InventoryPage(page);   // ← repeated in every step that touches inventory
  await inventory.addToCart(slug);
});

Then('the cart badge should show {string}', async ({ page }, count: string) => {
  const inventory = new InventoryPage(page);   // ← same object, rebuilt again
  await expect(inventory.header.cartBadge).toHaveText(count);
});
```

**With fixtures** — `features/steps/fixtures.ts` extends `test` with one fixture per page object, and every step file passes that `test` into `createBdd()`:

```ts
// features/steps/fixtures.ts
import { test as base } from 'playwright-bdd';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
// ...LoginPage, CheckoutPage follow the same pattern

type PageFixtures = {
  inventory: InventoryPage;
  cart: CartPage;
  // ...login, checkout
};

export const test = base.extend<PageFixtures>({
  inventory: async ({ page }, use) => { await use(new InventoryPage(page)); },
  cart: async ({ page }, use) => { await use(new CartPage(page)); },
  // ...login, checkout follow the same pattern
});
```

```ts
// features/steps/cart.steps.ts
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { When, Then } = createBdd(test);   // ← pass the extended test in

When('I add {string} to the cart', async ({ inventory }, slug: string) => {
  await inventory.addToCart(slug);        // ← already built, just use it
});

Then('the cart badge should show {string}', async ({ inventory }, count: string) => {
  await expect(inventory.header.cartBadge).toHaveText(count);
});
```

| | Without fixtures | With fixtures |
|---|---|---|
| Getting a page object | `const inventory = new InventoryPage(page);` in every step body | `{ inventory }` destructured from the step's arguments |
| `createBdd()` call | `createBdd()` — no argument, default test | `createBdd(test)` — the extended test from `fixtures.ts` |
| Object construction | Happens once per *step*, even if the same step calls it repeatedly across a scenario | Happens once per *test* (Playwright caches the fixture for the test's duration) |
| Adding a 5th page object | Copy-paste `new XPage(page)` into every step that needs it | Add one fixture entry to `fixtures.ts`; every step file gets it |

The trade-off: fixtures add one extra file and one extra concept (a fixture vs. a plain object) to learn, and `fixtures.ts` must live inside the `steps` glob in `playwright.config.ts` (`features/steps/**/*.ts`) so `bddgen` can detect the exported `test` — placing it elsewhere requires the `importTestFrom` option instead. For a suite with a handful of page objects reused across many steps, the savings in boilerplate are worth that one-time setup cost.

### Scenario Outlines

A `Scenario Outline` is a Gherkin template scenario paired with an `Examples:` table. `bddgen` expands it at generation time into one independent, concrete test **per row** — it substitutes each row's values into the `<placeholder>` tokens in the outline's steps before matching them against step definitions, so no special step-definition code is needed. This is different from writing a loop inside one step: an outline with 3 rows produces **3 separate tests**, each with its own pass/fail, browser context, and entry in the HTML report — not one test that iterates 3 cases internally.

**Why use it:** the alternative is copy-pasting the same `When`/`Then` step block once per case with different literal strings, which is what this suite's required-field and menu-link scenarios used to do. An outline collapses that into one step block plus one table row per case, and keeps each case isolated — if one row's assertion starts failing, the report tells you exactly which one, instead of hiding it inside a longer scenario where an earlier step's failure masks whether later steps still work.

**When *not* to use it:** only when the *same steps* genuinely repeat with *different data*. It's the wrong tool for a scenario where each step depends on state built up by the previous step (e.g. `tests/checkout/complete-order-single-item.spec.ts`'s BDD counterpart walks through add → checkout → fill info → finish → back home as one connected flow — there's no "different data, same steps" repetition to factor out). Forcing a sequential, stateful flow into an outline just to use the feature produces an awkward table with columns that don't cleanly vary per row.

This suite converted three scenarios that fit the pattern, and deliberately left the rest alone:

| Feature | Before | After |
|---|---|---|
| `login.feature` | One scenario walking through "submit blank → check error → fill username → submit → check error" as two dependent steps | `Scenario Outline` with 2 rows (`username`, `password`, `error`), reusing the existing `When I log in with username {string} and password {string}` step — filling a field with `""` is equivalent to leaving it blank |
| `checkout.feature` | One scenario filling First Name → checking error → filling Last Name → checking error → filling Postal Code → checking error, in sequence | `Scenario Outline` with 3 rows (`firstName`, `lastName`, `postalCode`, `error`), reusing `I fill in checkout info with first name {string}, last name {string}, and postal code {string}`. The one assertion that didn't fit the table (the invalid-field CSS highlight) was kept as its own small `Scenario` so no coverage was lost |
| `logout.feature` | One scenario asserting all 5 side-menu links are visible, then continuing into the actual logout flow in the same scenario | `Scenario Outline` with 5 rows (one per `label`) for the link-visibility check, split from a separate `Scenario` for the logout flow itself |

Each outline's `Examples:` block is also named with a placeholder — e.g. `Examples: <error>` in `checkout.feature` — which `bddgen` picks up as a per-row title template. Without it, generated tests are titled generically (`Example #1`, `Example #2`, …); with it, the HTML report shows the actual row data (`Error: First Name is required`, `Error: Last Name is required`, …), which is much easier to scan when a specific row fails.

### Steps to add a new feature file

1. Write the scenario in a new `features/<name>.feature` file using `Given/When/Then`. If every scenario in the file needs a logged-in session, tag the `Feature:` line with `@auth`; if the file mixes unauthenticated and authenticated scenarios (like `accessibility.feature`), leave the `Feature:` line untagged and put `@auth` above just the scenarios that need it — the tag filter resolves per-scenario either way.
2. Add matching step definitions in `features/steps/<name>.steps.ts` (or reuse existing steps where the wording matches exactly — duplicate step text across files will fail generation). Start the file with `import { createBdd } from 'playwright-bdd'; import { test } from './fixtures'; const { Given, When, Then } = createBdd(test);` and destructure the page object you need (`{ inventory }`, `{ cart }`, etc.) from each step's arguments. If the scenario needs a page object that doesn't have a fixture yet, add one to `features/steps/fixtures.ts` first (see [Custom Fixtures for Page Objects](#custom-fixtures-for-page-objects)).
3. Run `npm run bddgen` to regenerate `.features-gen/`/`.features-gen-auth/`, then run just that scenario while iterating:
   - Untagged: `npx playwright test --project=bdd-chromium`
   - `@auth`-tagged: `npx playwright test --project=bdd-chromium-auth`

## Accessibility Testing

### Why bother with this

Every other suite of tests in this repo checks that the app *functions* — you can log in, add items, check out. None of them check whether the app is actually *usable* by someone navigating with a screen reader, voice control, or keyboard only. That's a different, and commonly skipped, category of bug: a button with no accessible name, a page with no heading, a form field with no label — all invisible if you're testing by looking at the screen and clicking with a mouse, all real barriers for someone who isn't. Automated accessibility testing catches the mechanically-detectable subset of these — roughly 30-50% of WCAG success criteria, per axe-core's own numbers; the rest (does this alt text actually make sense, is this focus order logical) still needs a human — but that subset is cheap to run on every commit once it's wired up, which is exactly the kind of check that's valuable precisely because nobody remembers to do it by hand.

### How it's wired up

1. **`utils/axe.ts`** — `expectNoSeriousAccessibilityViolations(page, options?)` runs an [`axe-core`](https://github.com/dequelabs/axe-core) scan via `AxeBuilder` and asserts on the results. axe-core buckets every violation it finds into an impact level: `critical`, `serious`, `moderate`, or `minor`. This helper only fails the test on `critical`/`serious` — the two levels axe itself considers most likely to actually block a user — and lists each one (rule id, impact, help text, node count, docs link) in the failure message if it does fail.
2. **`tests/accessibility/*.spec.ts`** — one plain Playwright spec per core page (login, products, cart, checkout information, checkout overview), each navigating to that page the same way its functional-test counterpart does, then calling the helper.
3. **`features/accessibility.feature`** + **`features/steps/accessibility.steps.ts`** — the same coverage expressed as Gherkin, reusing existing navigation steps (`Given I am on the Products page`, `When I add {string} to the cart`, etc.) and adding one new `Then` step for the assertion itself.

### The `moderate`/`minor` threshold — and the "known gap" pattern

Scanning the real, unmodified `saucedemo.com` surfaces genuine violations — this isn't a synthetic demo. Every page in this suite has 3 sitewide `moderate` findings (missing `<main>` landmark, missing `<h1>`, content not contained in a landmark region) that are intentionally **not** asserted on: blocking the whole suite on structural findings that are the same on every single page would just make the suite red forever without pointing at anything actionable, which trains people to ignore it. `critical`/`serious` is the threshold most real CI accessibility gates use for exactly this reason — it keeps the bar meaningful.

The products/inventory page has one `critical` finding beyond that baseline: its sort `<select>` has no accessible name (no `<label>`, `aria-label`, or `aria-labelledby` — a screen reader announces it as just "combo box", with no indication of what it controls). Rather than quietly excluding that from the assertion and losing track of it, this suite follows the same pattern already used elsewhere for known, real app gaps (see `tests/inventory/reset-app-state-stale-button.spec.ts` and `invalid-product-id.spec.ts` for the UI-desync and unguarded-route equivalents):

- `products-page.spec.ts` / `accessibility.feature`'s first Products scenario asserts no `critical`/`serious` violations **except** `select-name` (via `{ ignoreRuleIds: ['select-name'] }`), so a *new* critical/serious issue on that page still fails the build.
- A second, explicitly-named test — `"Products page sort dropdown is missing an accessible name (known accessibility gap)"` — asserts that specific violation is still present. If a future SauceDemo change fixes it, this test starts failing, which is a signal to remove the exclusion above, not a bug in the test.

This means the suite stays 100% green while still telling the truth about what it found, which is arguably the more interesting result to show in an interview than a suite that's silently scoped to avoid ever going red.

### Adding a new page to the accessibility suite

1. Plain spec: add `tests/accessibility/<page-name>.spec.ts`, navigate to the page the same way its functional spec does, then `await expectNoSeriousAccessibilityViolations(page)`.
2. BDD: add a scenario to `features/accessibility.feature` (tag it `@auth` if the page needs a session) reusing existing navigation steps, ending with `Then the page should have no critical or serious accessibility violations`.
3. If it fails on a real, pre-existing violation you don't want to fix right now, don't just add it to an ignore list silently — follow the pattern above: exclude that specific rule ID with a comment referencing a second test that documents the gap explicitly.

## Visual Regression Testing

### What this is, in plain words

Every other test in this suite checks *behavior*: click this button, does the cart badge say "1"? Those checks can all pass while the page still looks broken — a button 20 pixels out of place, a color that silently changed, text overlapping an image. Nothing about "does the button work when clicked" catches "does the button look right." Visual regression testing closes that gap: it takes a snapshot of the page, compares it against a saved "reference photo" from before, and flags a diff if they don't match closely enough.

### How it's wired up: Percy

`tests/visual/*.spec.ts` — one file per core page (login, products, cart, checkout information, checkout overview), same 5 pages the accessibility suite covers. Each one navigates to the page the same way its functional test does, then calls:

```ts
await percySnapshot(page, 'Login page');
```

`percySnapshot()` comes from [`@percy/playwright`](https://www.browserstack.com/docs/percy/integrate/playwright), paired with the [`@percy/cli`](https://www.browserstack.com/docs/percy/cli/overview) `percy` binary. Rather than diffing a screenshot taken by the local browser, it captures the page's DOM + computed styles and uploads that to Percy's cloud service, which renders it centrally (via its own rendering fleet) and does the pixel diff there against the previous build. The result — pass/fail plus a visual diff — shows up on the Percy dashboard and as a status check on the PR.

**Why this replaced local `toHaveScreenshot()` baselines:** rendering happens on Percy's infrastructure, not the machine running the test, so there's exactly one baseline per snapshot instead of one per OS (see the old gotcha below) — no more separate macOS/Linux baseline files, no committed PNGs, no manual regeneration workflow.

**How to run it:**

```bash
# npm test already wraps this — percy exec starts a local relay server that
# percySnapshot() posts to, then uploads the finished build to Percy's API
npm test

# Or scoped to just the visual suite
npx percy exec -- npx playwright test tests/visual --project=chromium
```

Needs a `PERCY_TOKEN` environment variable (from a project on [percy.io](https://percy.io)) to actually upload anything — see [Percy setup](#percy-setup) below. Without one, `percy exec` logs `Skipping visual tests: Missing Percy token` and still runs the wrapped Playwright command normally, so the rest of the suite isn't blocked by a missing token (this is also what happens automatically on Dependabot-triggered CI runs, which don't get repository secrets).

**Scope decision:** these tests only run on the `chromium` project (each spec checks `testInfo.project.name` and skips itself otherwise — you'll see them listed as "skipped," not failed, on `firefox`/`webkit`). Percy renders its own configured widths/browsers server-side from that one capture, so running the same capture again on other local browser projects wouldn't add coverage. And there's no BDD (`features/`) version of this suite — a snapshot call isn't really a "step" a human would read as a sentence the way `Given/When/Then` is, so mirroring it in Gherkin wouldn't add anything, just duplicate the same capture in a different file.

### Percy setup

1. Create a project at [percy.io](https://percy.io) (or via BrowserStack, which now owns Percy) and copy its project token.
2. Add it as a repo secret named `PERCY_TOKEN` (Settings → Secrets and variables → Actions) so `.github/workflows/playwright.yml` can pass it through.
3. For local runs, export it in your shell: `export PERCY_TOKEN=percy_xxxxx`.
4. `.percy.yml` pins the snapshot width to `[1280]`, matching the desktop-only scope the old local baselines covered. Add more widths there to get responsive visual coverage for free — Percy renders every width from the same `percySnapshot()` call, no extra test code needed.

### Reviewing and approving diffs

Percy doesn't fail a build just because pixels changed — a build that introduces visual diffs shows as "unreviewed" until a human looks at the side-by-side comparison on the Percy dashboard and either approves it (the change was intentional — e.g. a real design update) or flags it as a regression. That review step is the direct replacement for this project's old `git diff`-the-PNG workflow: same judgment call, now made in Percy's UI instead of by re-running `--update-snapshots` and eyeballing a downloaded file.

### The gotcha this replaced

Worth remembering why this migration happened: the exact same web page renders as a *slightly different image* depending on the operating system running the browser — different font hinting, different anti-aliasing on curved edges, even though every pixel of actual content is identical. With local `toHaveScreenshot()` baselines, that meant a screenshot taken on a Mac and one taken on Linux would **never pixel-match**, even for a page that hadn't changed at all — Playwright had to bake the OS into the baseline filename (`login-page-chromium-darwin.png` vs. `-linux.png`) and this repo needed a whole manual `workflow_dispatch` workflow just to generate Linux-side baselines to commit. Percy sidesteps this entirely by rendering every snapshot on its own infrastructure, so there's only ever one baseline per snapshot, independent of whoever's machine triggered the capture.

## Mobile & Responsive Testing

### Why bother with this

Every test in this suite, before this change, ran at a desktop viewport. That leaves an entire dimension of the app completely unverified: does the hamburger menu still work with a touch tap instead of a mouse click? Does the product grid reflow sensibly on a 393px-wide screen instead of overflowing or clipping? Real users hit this app from real phones, and a regression here (a button that becomes unreachable, text that overflows its container) is invisible to a suite that only ever runs at 1280×720 on desktop Chrome. Testing at real device viewports is one of the highest-value, lowest-effort additions you can make to an E2E suite — Playwright ships the device profiles already, most of the time it's a config change, not new test code.

### How it's wired up

`playwright.config.ts` adds two projects using Playwright's built-in device descriptors:

```ts
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
```

`devices['Pixel 5']` / `devices['iPhone 12']` bundle the real viewport size, device scale factor, user agent string, and touch/mobile emulation flags for that device — the same profiles Playwright ships for its own examples. Both projects `dependencies: ['setup']` and `storageState: authFile` exactly like the desktop `chromium`/`firefox`/`webkit` projects (see [Authentication](#authentication-storage-state)), so they run the same `tests/*.spec.ts` suite, just at a different viewport/UA.

**Scope decision:** these two projects run the plain `tests/*.spec.ts` suite, not the BDD suite in `features/`. Both suites already cover the same scenarios (that's the whole point of the BDD suite mirroring the plain one — see [BDD Tests](#bdd-tests-cucumber)), so running both across 5 browser profiles each would double runtime for zero new coverage. If a mobile-specific *scenario* ever comes up (something that only makes sense to test at a mobile viewport, not just "the same test again on a smaller screen"), that's a better reason to add BDD mobile coverage than routine duplication.

### What this run actually found

Worth being honest about: this pass didn't turn up a responsive-layout bug. All 55 tests in `tests/` pass unchanged at both the Pixel 5 and iPhone 12 profiles — SauceDemo's layout holds up fine at those viewports, and Playwright's touch emulation drives the hamburger menu, sort dropdown, and cart/checkout flow the same way a mouse click does. That's a legitimate, useful result, not a wasted one: the suite now has continuous evidence that mobile behavior matches desktop behavior, and if a future change to the app (or this suite's own locators) breaks that, these two projects are what catches it. Not finding a bug on the first run is a different outcome than not looking.

## Test Coverage

Scenarios are defined in [`specs/basic-operations.md`](specs/basic-operations.md) and implemented as specs under `tests/`, using the `standard_user` account. Locked-out, problem, and other special demo accounts are out of scope. The counts below are per-file/scenario; `tests/*.spec.ts` actually runs across 5 browser projects (`chromium`, `firefox`, `webkit`, `Mobile Chrome`, `Mobile Safari` — see [Mobile & Responsive Testing](#mobile--responsive-testing)), and the BDD suite across 6 (`bdd-{chromium,firefox,webkit}` and their `-auth` counterparts).

| Area | Spec Files | Covers |
|---|---|---|
| **Login** | `tests/login/` (4) | Valid login, invalid credentials, empty-field validation, unauthenticated direct-URL access to protected routes |
| **Inventory** | `tests/inventory/` (6) | Browsing products, sorting the catalog, detail-page/grid cart-state sync, cart state surviving re-sorts, a Reset App State UI-desync gap, and an unguarded invalid product id |
| **Cart** | `tests/cart/` (4) | Adding single/multiple items, removing items, viewing cart |
| **Checkout** | `tests/checkout/` (5) | Completing orders (single/multiple items), required-field validation, cancelling checkout, whitespace-only field validation gap |
| **Logout** | `tests/logout/` (2) | Logging out, logging out with items still in cart |
| **Accessibility** | `tests/accessibility/` (6) | axe-core scans of login, products, cart, and both checkout steps for `critical`/`serious` WCAG violations; documents one known gap (products page sort dropdown missing an accessible name) — see [Accessibility Testing](#accessibility-testing) |
| **Visual Regression** | `tests/visual/` (5, `chromium` only) | Percy snapshot captures of login, products, cart, and both checkout steps, diffed on Percy's cloud infrastructure; no BDD equivalent — see [Visual Regression Testing](#visual-regression-testing) |
| **Login (BDD)** | `features/login.feature` (3 scenario definitions → 4 generated tests) | Same login coverage as `tests/login/`, expressed as Gherkin; the blank-required-field case is a Scenario Outline — see [BDD Tests](#bdd-tests-cucumber) |
| **Cart (BDD)** | `features/cart.feature` (4 scenarios) | Same cart coverage as `tests/cart/`, expressed as Gherkin and tagged `@auth` — see [BDD Tests](#bdd-tests-cucumber) |
| **Checkout (BDD)** | `features/checkout.feature` (6 scenario definitions → 8 generated tests) | Same checkout coverage as `tests/checkout/`, expressed as Gherkin and tagged `@auth`; required-field validation is a Scenario Outline — see [BDD Tests](#bdd-tests-cucumber) |
| **Logout (BDD)** | `features/logout.feature` (3 scenario definitions → 7 generated tests) | Same logout coverage as `tests/logout/`, expressed as Gherkin and tagged `@auth`; the side-menu-links check is a Scenario Outline — see [BDD Tests](#bdd-tests-cucumber) |
| **Inventory (BDD)** | `features/inventory.feature` (6 scenarios) | Same inventory coverage as `tests/inventory/`, expressed as Gherkin and tagged `@auth` — see [BDD Tests](#bdd-tests-cucumber) |
| **Accessibility (BDD)** | `features/accessibility.feature` (6 scenarios) | Same accessibility coverage as `tests/accessibility/`, expressed as Gherkin with `@auth` tagged per-scenario (the login scenario stays untagged) — see [Accessibility Testing](#accessibility-testing) |

## Continuous Integration

GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on:

- Push and pull requests to `main`/`master`
- A daily schedule (06:00 WIB / 23:00 UTC)
- Manual dispatch

Each run installs dependencies and browsers, generates the BDD test files (`npx bddgen`), executes the full suite, uploads the HTML report as a build artifact (30-day retention), and posts a per-browser pass/fail breakdown to Discord via webhook.

### Linting (ESLint + `eslint-plugin-playwright`)

In plain words: a linter reads the code without running it and flags patterns that are almost always mistakes. This is different from `tsc` (which only checks that types line up) and different from actually running the tests (which only tells you what breaks *this run*, on *this data*). `eslint-plugin-playwright` specifically knows what a correct Playwright test looks like, so it catches a category of bug neither of those other checks would: a missing `await` on an `expect()` (which silently does nothing instead of failing), a `test.skip()` left in by accident, a test that never actually asserts anything. `npm run lint` (`eslint .`) runs it, and CI runs it as its own step, right after installing dependencies, so a real lint error fails the build fast — same fail-fast placement as [type-checking](#continuous-integration).

**A real decision this required, documented rather than hidden:** getting this working meant downgrading the project's `typescript` version from `^7.0.2` to `^5.9.0`. Here's why: `typescript-eslint` (the package that lets ESLint understand `.ts` syntax at all) has a hard-coded runtime check that refuses to run against TypeScript 7 — not a version-range warning, an explicit thrown error (`typescript-eslint does not support TS 7.0`), because TS7 is a genuinely different compiler implementation under the hood and support for it [hasn't shipped yet](https://github.com/typescript-eslint/typescript-eslint/issues/10940). I tried the standard escape hatches first — `npm install --legacy-peer-deps`, and npm's `overrides` field to pin TypeScript to 5.x *only* inside `typescript-eslint`'s own dependency tree while leaving the rest of the project on 7.x — neither actually worked; npm kept collapsing everything back to a single shared `typescript` install, and the hard-coded guard fired regardless. Downgrading the whole project was the only option that actually unblocks linting today.

**What that trades away:** TypeScript 7 removed the old `"moduleResolution": "Node"` setting entirely, which is what originally broke `tsc --noEmit` as a CI gate (see the type-checking section above) — TypeScript 5.9 still supports it, so that specific problem doesn't exist on this version. If `typescript-eslint` ships TS7 support later, upgrading back is a one-line version bump with no config changes needed.

**Two rules needed project-specific configuration, not blanket suppression** — worth explaining *why*, since silencing a lint rule without a reason is exactly the kind of thing that should raise an eyebrow in review:

- `playwright/no-standalone-expect` normally catches an `expect()` call that isn't inside a `test()` block (usually a real mistake — an assertion that never actually runs as part of a test). But every `expect()` in `features/steps/*.steps.ts` lives inside a `Given`/`When`/`Then` callback from `playwright-bdd`, which — once `bddgen` compiles the `.feature` files — *is* the real test body. The rule doesn't know that pattern, so it flagged all ~65 of them as errors. Turned off for `features/steps/**`, with a comment explaining why, rather than silently ignored.
- `playwright/expect-expect` normally catches a test with no assertions at all (a test that always "passes" because it never actually checks anything). The 5 accessibility tests in `tests/accessibility/*.spec.ts` looked like that to the rule, because their assertion happens inside the shared `expectNoSeriousAccessibilityViolations()` helper (`utils/axe.ts`), not written out inline. Rather than turn the rule off, `eslint.config.js` tells it about the helper (`assertFunctionNames: ['expectNoSeriousAccessibilityViolations']`) — so it still catches a genuinely assertion-less test anywhere else in the suite.
- `playwright/no-skipped-test` flagged the 5 `tests/visual/*.spec.ts` files for their `test.skip(...)` calls — but that's the deliberate, documented mechanism scoping visual regression to `chromium` only (see [Visual Regression Testing](#visual-regression-testing)), not a forgotten skip. Turned off just for `tests/visual/**`.

### Speeding up CI (dependency & browser caching)

In plain words: every time this workflow used to run, it started from a completely empty computer — no npm packages, no browsers installed, nothing. So every run re-downloaded the same `node_modules` and re-downloaded the same ~500MB of Chromium/Firefox/WebKit browser binaries, even though yesterday's run downloaded the *exact same files*. That happens on every push, every PR, and every day at the scheduled run — a lot of repeated downloading of things that hadn't changed. Caching just means: save those files somewhere after downloading them once, and next time, check "do I already have this?" before downloading again.

This workflow now caches two separate things, because they're genuinely different in size and how often they change:

1. **npm packages** — one line, `cache: 'npm'` on the existing `actions/setup-node` step. GitHub Actions handles the rest: it saves `node_modules` keyed on `package-lock.json`, and restores it on the next run if the lockfile hasn't changed.

2. **Playwright's browser binaries** — these live outside `node_modules` (Playwright downloads them separately, to `~/.cache/ms-playwright`), so `setup-node`'s npm cache doesn't cover them. A separate `actions/cache` step handles this one, keyed the same way (on `package-lock.json`, since that's what pins the `@playwright/test` version, which is what determines which browser builds are needed):

   ```yaml
   - name: Cache Playwright browsers
     id: playwright-cache
     uses: actions/cache@v4
     with:
       path: ~/.cache/ms-playwright
       key: playwright-browsers-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
   - name: Install Playwright browsers
     if: steps.playwright-cache.outputs.cache-hit != 'true'
     run: npx playwright install --with-deps
   - name: Install Playwright OS dependencies (browsers cache hit)
     if: steps.playwright-cache.outputs.cache-hit == 'true'
     run: npx playwright install-deps
   ```

   On a cache **miss** (first run, or `@playwright/test` was just bumped — e.g. by the Dependabot PRs described below), it does the full `install --with-deps`, which downloads the browsers *and* the OS-level libraries they need to run on a fresh Ubuntu runner, and that download gets saved for next time. On a cache **hit**, the browser binaries are already sitting on disk, so it skips straight past that download — but it still runs `install-deps` (fast — just the OS package installs, no ~500MB browser download) because the runner itself is a brand-new virtual machine every single time, regardless of what got cached.

**Why key on `package-lock.json` instead of something simpler:** it keeps the cache honest. If the cache key never changed, an old cached browser build could silently stick around after `@playwright/test` gets upgraded (say, via one of the Dependabot PRs), and tests would run against a browser version that no longer matches what's declared in `package.json`. Tying the key to the lockfile means a version bump automatically invalidates the old cache and forces a fresh, matching download — the cache can only ever serve exactly the version this repo currently expects, nothing older.

### PR annotations (`github` reporter)

`playwright.config.ts` sets `reporter: process.env.CI ? [['html'], ['github']] : 'html'` — locally you still get just the HTML report, but on CI, Playwright's built-in `github` reporter runs alongside it. It's part of `@playwright/test` itself (no extra dependency, no extra workflow step), and it turns each test failure into a [workflow command](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions) (`::error file=...,line=...::`) that GitHub Actions renders as an inline annotation directly on the changed lines of a PR diff, plus a run summary annotation with the pass/fail counts.

This sits between the two reporting options discussed for this project: a bare HTML artifact (you have to open it to know anything went wrong) and a full external dashboard like Allure (real value, but a Java runtime, an extra CI step, and persistent storage to get it — see the trade-off note this project settled on). The `github` reporter is the free middle ground — zero setup cost, and failures show up exactly where a reviewer is already looking, without needing to click into the Discord notification or download the HTML artifact first.

### Per-browser Discord notifications

The original Discord message just said "passed" or "failed" for the whole run — useful for a yes/no glance, but it couldn't answer "did every browser actually pass, or did one of them fail while the others covered for it?" without opening the HTML report. Since this suite runs across 11 browser projects (5 for the plain suite — `chromium`, `firefox`, `webkit`, `Mobile Chrome`, `Mobile Safari` — plus 6 for the BDD suite), that's a real gap: a single failing project buried among ten passing ones is exactly the kind of thing a glance at a chat notification should be able to tell you.

**How it's wired up:**

1. `playwright.config.ts` adds a third reporter on CI, alongside `html` and `github`: `['json', { outputFile: 'playwright-report/results.json' }]`. Playwright's JSON reporter writes every test's result, including which project (`projectName`) it ran under — that's the raw data the per-browser breakdown is built from.
2. `scripts/discord-notify.mjs` reads that file, tallies passed/failed/flaky/skipped per project, and posts a Discord embed with two fields — one for the desktop/mobile browsers, one for the BDD browsers — each showing every project on its own line with a ✅/❌/⚪ icon. The workflow's "Notify Discord" step is now just `run: node scripts/discord-notify.mjs`, replacing the inline `jq`/`curl` script that only ever knew the overall job status.
3. A project that didn't run at all (e.g. if you scope a manual `workflow_dispatch` run to a subset of tests) shows up as ⚪ "no tests ran" rather than being silently omitted — the list of projects the script checks is fixed, not derived from what happened to run, so a project going missing from the message would be as visible as one failing.

Example of what actually posts to Discord for a fully green run:

```
✅ Playwright Tests passed
Branch: `main`
Run: https://github.com/.../actions/runs/...

Desktop & Mobile Browsers
✅ chromium: 37 passed (37)
✅ firefox: 32 passed, 5 skipped (37)
✅ webkit: 32 passed, 5 skipped (37)
✅ Mobile Chrome: 32 passed, 5 skipped (37)
✅ Mobile Safari: 32 passed, 5 skipped (37)

BDD (Cucumber) Browsers
✅ bdd-chromium: 5 passed (5)
✅ bdd-firefox: 5 passed (5)
✅ bdd-webkit: 5 passed (5)
✅ bdd-chromium-auth: 30 passed (30)
✅ bdd-firefox-auth: 30 passed (30)
✅ bdd-webkit-auth: 30 passed (30)
```

(The 5 skips on `firefox`/`webkit`/`Mobile Chrome`/`Mobile Safari` are the visual regression tests — expected, since those baselines are chromium-only. See [Visual Regression Testing](#visual-regression-testing).)

**Also fixes a real bug found along the way:** the old inline script would `curl` an empty `DISCORD_WEBHOOK` and fail the whole job on any Dependabot-triggered run — GitHub withholds repository secrets from those runs by default, so `DISCORD_WEBHOOK` is always empty there, regardless of whether the actual tests passed. `scripts/discord-notify.mjs` checks for that and exits `0` with a log line instead of erroring, so a Dependabot PR's CI status now genuinely reflects whether the tests passed, not whether a notification happened to succeed.

**To test the formatting without sending a real Discord message:**

```bash
CI=true npx playwright test  # generates playwright-report/results.json
JOB_STATUS=success BRANCH=main RUN_URL=https://example.com node scripts/discord-notify.mjs --dry-run
```

`--dry-run` prints the exact JSON payload that would be POSTed, without a webhook or network call.

### Keeping dependencies up to date (Dependabot)

This is a different kind of "test" than everything else in this README — it's not about whether the app works, it's about whether the *tools testing the app* stay current. Left alone, `package.json` slowly drifts out of date: a security fix ships for `@playwright/test` and nobody notices, or a GitHub Action gets deprecated and nobody's watching for it. Nobody enjoys doing that check by hand, which is exactly why it tends not to happen — so instead of relying on remembering, `.github/dependabot.yml` tells GitHub to check for us.

**What it actually does:** once a week, [Dependabot](https://docs.github.com/en/code-security/dependabot) (built into GitHub, free, nothing to install) checks two places for newer versions:

1. **npm packages** — `@playwright/test`, `playwright-bdd`, `@axe-core/playwright`, `typescript`, everything in `package.json`.
2. **GitHub Actions versions** — the pinned versions in `.github/workflows/playwright.yml` (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`).

If it finds something newer, it opens a normal pull request bumping the version — which then runs through the exact same CI checks (the full Playwright suite, same as any other PR) that a human-opened PR would. Nothing merges automatically; a human still reviews and clicks merge. It just means the "is there an update available?" question gets asked every week automatically, instead of "whenever someone happens to think of it" (which in practice is closer to "never").

## AI-Assisted Workflow

This suite is built using the Playwright MCP **planner → generator → healer** loop:

1. **Planner** explores the app and writes a test plan to `specs/*.md`.
2. **Generator** turns each plan step into a spec file under `tests/`, seeded from `tests/seed.spec.ts`.
3. **Healer** debugs and repairs failing specs when the app or selectors change.

The MCP server is configured in `.mcp.json` and driven through the `.claude/agents/` definitions (`playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`).
