// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const protectedRoutes = [
  '/inventory.html',
  '/cart.html',
  '/checkout-step-one.html',
  '/checkout-step-two.html',
  '/checkout-complete.html',
];

test.describe('Login', () => {
  // These tests exercise unauthenticated access, so they must start unauthenticated
  // rather than reusing the storageState from tests/auth.setup.ts.
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of protectedRoutes) {
    test(`Direct URL access to ${route} without authentication redirects to login`, async ({ page }) => {
      const login = new LoginPage(page);

      // 1. Without logging in, navigate directly to the protected route
      await page.goto(route);

      // expect: User is redirected to the login page
      await expect(page).toHaveURL('https://www.saucedemo.com/');

      // expect: An error banner names the requested path
      await expect(login.errorMessage).toHaveText(
        `Epic sadface: You can only access '${route}' when you are logged in.`
      );

      // expect: No authenticated session was created
      await expect(login.usernameInput).toBeEmpty();
      await expect(login.passwordInput).toBeEmpty();
    });
  }
});
