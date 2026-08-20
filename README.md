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
| `expect(page).toHaveScreenshot()` | Visual regression testing — built into `@playwright/test`, no extra dependency |
| Chromium / Firefox / WebKit | Cross-browser test projects |
| GitHub Actions | CI — runs the suite on push, PR, and a daily schedule |
| Discord Webhook | CI pass/fail notifications |
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
│   ├── visual/              # Screenshot comparisons of each core page — see Visual Regression Testing
│   │   └── *.spec.ts-snapshots/  # Committed baseline PNGs, one folder per spec file
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
├── .github/
│   ├── workflows/          # CI pipeline
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

Every other test in this suite checks *behavior*: click this button, does the cart badge say "1"? Those checks can all pass while the page still looks broken — a button 20 pixels out of place, a color that silently changed, text overlapping an image. Nothing about "does the button work when clicked" catches "does the button look right." Visual regression testing closes that gap: it takes a screenshot of the page, compares it pixel-by-pixel against a saved "reference photo" from before, and fails the test if they don't match closely enough.

### How it's wired up

`tests/visual/*.spec.ts` — one file per core page (login, products, cart, checkout information, checkout overview), same 5 pages the accessibility suite covers. Each one navigates to the page the same way its functional test does, then calls:

```ts
await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
```

`toHaveScreenshot()` is built into `@playwright/test` — no new dependency. The first time it runs for a given name, it saves that screenshot as the "baseline" (the reference photo) into a `*-snapshots/` folder next to the spec file, and that baseline gets **committed to the repo** like any other file. Every run after that takes a fresh screenshot and compares it against the committed baseline.

**Scope decision:** these tests only run on the `chromium` project (each spec checks `testInfo.project.name` and skips itself otherwise — you'll see them listed as "skipped," not failed, on `firefox`/`webkit`). And there's no BDD (`features/`) version of this suite — screenshot comparison isn't really a "step" a human would read as a sentence the way `Given/When/Then` is, so mirroring it in Gherkin wouldn't add anything, just duplicate the same picture-taking in a different file.

### The gotcha: a screenshot is tied to the computer that took it

This is the part that trips people up, so it's worth explaining plainly: the exact same web page renders as a *slightly different image* depending on the operating system running the browser — different font hinting, different anti-aliasing on curved edges, even though every pixel of actual content is identical. It's not a bug, it's just how each OS draws text and shapes.

That means a baseline screenshot taken on a Mac and a screenshot taken on Linux will **never pixel-match**, even for a page that hasn't changed at all. Playwright knows this and bakes the OS name into the baseline's filename automatically — for example `login-page-chromium-darwin.png` (`darwin` = macOS) versus `login-page-chromium-linux.png`. This project's CI runs on `ubuntu-latest` (Linux).

**The baselines currently committed in this repo were generated on macOS**, because that's the machine available to generate them, and it's important to say that plainly rather than bury it. Practically, that means:

- Locally, on a Mac, these tests pass against the macOS baseline already committed.
- On CI (Linux), the first run will report "no baseline found" for each of these 5 tests and fail — not because anything is actually broken, but because the Linux-named baseline file doesn't exist yet.

**How to fix that (a one-time step):** generate the real baselines on Linux — either inside CI itself, or in a Linux/Docker environment with working network access — by running:

```bash
npx playwright test tests/visual --project=chromium --update-snapshots
```

then commit the resulting `*-linux.png` files alongside the existing `*-darwin.png` ones (Playwright keeps both side by side; whichever platform runs the test picks its own file automatically, so there's no need to delete the Mac ones — they're what makes the tests pass for anyone else on the team developing on macOS).

### Updating baselines when the app legitimately changes

If a real design change makes the old screenshot outdated (not a bug — an intentional change), regenerate and review the new baseline before committing it:

```bash
npx playwright test tests/visual --project=chromium --update-snapshots
```

Then look at the diff of the new PNG (`npx playwright show-report` shows a side-by-side before/after for any run that failed a comparison) to confirm the change is the one you expected, and commit it like any other file.

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
| **Login** | `tests/login/` (3) | Valid login, invalid credentials, empty-field validation |
| **Inventory** | `tests/inventory/` (6) | Browsing products, sorting the catalog, detail-page/grid cart-state sync, cart state surviving re-sorts, a Reset App State UI-desync gap, and an unguarded invalid product id |
| **Cart** | `tests/cart/` (4) | Adding single/multiple items, removing items, viewing cart |
| **Checkout** | `tests/checkout/` (5) | Completing orders (single/multiple items), required-field validation, cancelling checkout, whitespace-only field validation gap |
| **Logout** | `tests/logout/` (2) | Logging out, logging out with items still in cart |
| **Accessibility** | `tests/accessibility/` (6) | axe-core scans of login, products, cart, and both checkout steps for `critical`/`serious` WCAG violations; documents one known gap (products page sort dropdown missing an accessible name) — see [Accessibility Testing](#accessibility-testing) |
| **Visual Regression** | `tests/visual/` (5, `chromium` only) | Screenshot comparisons of login, products, cart, and both checkout steps against a committed baseline; no BDD equivalent — see [Visual Regression Testing](#visual-regression-testing) |
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

Each run installs dependencies and browsers, generates the BDD test files (`npx bddgen`), executes the full suite, uploads the HTML report as a build artifact (30-day retention), and posts a pass/fail notification to Discord via webhook.

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
