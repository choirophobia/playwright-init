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
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [AI-Assisted Workflow](#ai-assisted-workflow)

## Tech Stack

| Tool | Purpose |
|---|---|
| [`@playwright/test`](https://playwright.dev/) | Test runner, assertions, browser automation |
| TypeScript | Static typing for tests and page objects |
| [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/) | Generates native Playwright tests from Gherkin `.feature` files |
| Chromium / Firefox / WebKit | Cross-browser test projects |
| GitHub Actions | CI — runs the suite on push, PR, and a daily schedule |
| Discord Webhook | CI pass/fail notifications |

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
│   └── seed.spec.ts        # Blank seed test used by the AI test generator
├── features/                # Gherkin BDD scenarios (playwright-bdd)
│   ├── login.feature       # Same login coverage as tests/login/, in BDD form
│   ├── cart.feature        # Same cart coverage as tests/cart/, tagged @auth
│   └── steps/
│       ├── login.steps.ts  # Login step definitions, reusing pages/ page objects
│       └── cart.steps.ts   # Cart step definitions, reusing pages/ page objects
├── specs/                  # Human-readable test plans (Markdown)
│   └── basic-operations.md
├── playwright.config.ts    # Base URL, browsers, reporter, trace, BDD settings
├── .github/workflows/      # CI pipeline
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

# Run only the BDD/Gherkin scenarios (unauthenticated, e.g. login)
npx playwright test --project=bdd-chromium

# Run only the @auth-tagged BDD/Gherkin scenarios (e.g. cart)
npx playwright test --project=bdd-chromium-auth

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
- **Browsers:** Chromium, Firefox, WebKit (Chromium runs headless by default)
- **Reporter:** HTML (`playwright-report/`)
- **Tracing:** captured on first retry
- **CI behavior:** `test.only` is forbidden, tests retry twice, and run with a single worker
- **Projects:** a `setup` project runs `tests/auth.setup.ts` once, and the `chromium`/`firefox`/`webkit`/`bdd-*-auth` projects each depend on it and reuse its saved session (see below)

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

Alongside the plain `tests/*.spec.ts` suite, this project also runs a parallel BDD/Gherkin suite via [`playwright-bdd`](https://vitalets.github.io/playwright-bdd/), currently covering the same login scenarios as `tests/login/` and the same cart scenarios as `tests/cart/`. It's a growing suite — more `.feature` files can be added the same way as coverage expands.

### Why playwright-bdd instead of plain Cucumber.js

Playwright already has a first-class test runner with parallelism, tracing, retries, an HTML reporter, and (in this repo) the `storageState`-based auth setup described above. Running Cucumber via its own standalone runner (`@cucumber/cucumber` / `cucumber-js`) would mean a second, separate test runner with none of that — you'd have to hand-roll browser launch/teardown and manually reload the storage state file yourself.

`playwright-bdd` instead **compiles Gherkin `.feature` files into real Playwright test files** ahead of time. Those generated tests then run through `npx playwright test` like any other spec, so every existing project (tracing, HTML reporter, cross-browser projects, and — for scenarios that need it — the `setup`/`storageState` auth flow) keeps working unchanged.

### How it's wired up

1. **`features/login.feature`** — the same three login scenarios as `tests/login/*.spec.ts`, written as Gherkin `Given/When/Then` steps, sharing a `Background` for the common "start on the login page" step. Untagged, since it must run unauthenticated.
2. **`features/cart.feature`** — the same four cart scenarios as `tests/cart/*.spec.ts` (add a single item, add multiple items, remove the only item, view/remove from the Cart page), sharing a `Background` for the common "start on the Products page" step. Tagged `@auth` at the `Feature` level, since every scenario needs a logged-in session.
3. **`features/steps/login.steps.ts`** / **`features/steps/cart.steps.ts`** — step definitions using `createBdd()` from `playwright-bdd`, one file per feature. Each step gets Playwright's `page` fixture directly and reuses the same `LoginPage`/`InventoryPage`/`CartPage` page objects as the rest of the suite — no separate automation layer. A step's wording must stay unique across all step files (they're combined into one pool), so shared phrasing like `Then I should land on the Products page` is defined once, in `login.steps.ts`, and reused from `cart.feature`.
4. **`playwright.config.ts`** — two `defineBddConfig()` calls compile the same `features/**/*.feature` glob into two separate output directories, split by the `@auth` tag:
   - `defineBddConfig({ tags: 'not @auth', ... })` → `.features-gen/`, for untagged scenarios (login). Backs the `bdd-chromium`/`bdd-firefox`/`bdd-webkit` projects, which — like `tests/login/*.spec.ts` — have **no** `dependencies: ['setup']` and **no** `storageState`.
   - `defineBddConfig({ tags: '@auth', outputDir: '.features-gen-auth', ... })` → `.features-gen-auth/`, for `@auth`-tagged scenarios (cart). Backs the `bdd-chromium-auth`/`bdd-firefox-auth`/`bdd-webkit-auth` projects, which **do** declare `dependencies: ['setup']` and `storageState: authFile`, exactly like the plain `chromium`/`firefox`/`webkit` projects.

   Both output directories are gitignored build artifacts, regenerated on every run — same idea as `playwright/.auth/`.
5. **`package.json`** — `npm run bddgen` runs the `bddgen` CLI to (re)generate the Playwright test files from the `.feature`/step files; `npm test` and `npm run test:ui` run it automatically before `playwright test`.

### Steps to add a new feature file

1. Write the scenario in a new `features/<name>.feature` file using `Given/When/Then`. If every scenario in the file needs a logged-in session, tag the `Feature:` line with `@auth`; otherwise leave it untagged.
2. Add matching step definitions in `features/steps/<name>.steps.ts` (or reuse existing steps where the wording matches exactly — duplicate step text across files will fail generation).
3. Run `npm run bddgen` to regenerate `.features-gen/`/`.features-gen-auth/`, then run just that scenario while iterating:
   - Untagged: `npx playwright test --project=bdd-chromium`
   - `@auth`-tagged: `npx playwright test --project=bdd-chromium-auth`

## Test Coverage

Scenarios are defined in [`specs/basic-operations.md`](specs/basic-operations.md) and implemented as specs under `tests/`, using the `standard_user` account. Locked-out, problem, and other special demo accounts are out of scope.

| Area | Spec Files | Covers |
|---|---|---|
| **Login** | `tests/login/` (3) | Valid login, invalid credentials, empty-field validation |
| **Inventory** | `tests/inventory/` (6) | Browsing products, sorting the catalog, detail-page/grid cart-state sync, cart state surviving re-sorts, a Reset App State UI-desync gap, and an unguarded invalid product id |
| **Cart** | `tests/cart/` (4) | Adding single/multiple items, removing items, viewing cart |
| **Checkout** | `tests/checkout/` (5) | Completing orders (single/multiple items), required-field validation, cancelling checkout, whitespace-only field validation gap |
| **Logout** | `tests/logout/` (2) | Logging out, logging out with items still in cart |
| **Login (BDD)** | `features/login.feature` (3 scenarios) | Same login coverage as `tests/login/`, expressed as Gherkin — see [BDD Tests](#bdd-tests-cucumber) |
| **Cart (BDD)** | `features/cart.feature` (4 scenarios) | Same cart coverage as `tests/cart/`, expressed as Gherkin and tagged `@auth` — see [BDD Tests](#bdd-tests-cucumber) |

## Continuous Integration

GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on:

- Push and pull requests to `main`/`master`
- A daily schedule (06:00 WIB / 23:00 UTC)
- Manual dispatch

Each run installs dependencies and browsers, generates the BDD test files (`npx bddgen`), executes the full suite, uploads the HTML report as a build artifact (30-day retention), and posts a pass/fail notification to Discord via webhook.

## AI-Assisted Workflow

This suite is built using the Playwright MCP **planner → generator → healer** loop:

1. **Planner** explores the app and writes a test plan to `specs/*.md`.
2. **Generator** turns each plan step into a spec file under `tests/`, seeded from `tests/seed.spec.ts`.
3. **Healer** debugs and repairs failing specs when the app or selectors change.

The MCP server is configured in `.mcp.json` and driven through the `.claude/agents/` definitions (`playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`).
