// features/steps/fixtures.ts
import { test as base } from 'playwright-bdd';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

type PageFixtures = {
  login: LoginPage;
  inventory: InventoryPage;
  cart: CartPage;
  checkout: CheckoutPage;
};

/**
 * Extends playwright-bdd's `test` with one fixture per Page Object, so step
 * definitions can destructure `{ inventory }`/`{ cart }`/etc. directly instead
 * of writing `new InventoryPage(page)` in every step. Pass this `test` into
 * `createBdd(test)` in each steps file to pick up the fixtures.
 */
export const test = base.extend<PageFixtures>({
  login: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventory: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});
