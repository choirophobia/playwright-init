import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from './fixtures';

const { When, Then } = createBdd(test);

const stepUrls: Record<string, RegExp> = {
  'Checkout: Your Information': /\/checkout-step-one\.html$/,
  'Checkout: Overview': /\/checkout-step-two\.html$/,
  'Checkout: Complete!': /\/checkout-complete\.html$/,
};

When('I click Checkout', async ({ cart }) => {
  await cart.checkout();
});

Then('I should be on the {string} step', async ({ page, checkout }, title: string) => {
  await expect(page).toHaveURL(stepUrls[title]);
  await expect(checkout.header.title).toHaveText(title);
});

When(
  'I fill in checkout info with first name {string}, last name {string}, and postal code {string}',
  async ({ checkout }, firstName: string, lastName: string, postalCode: string) => {
    await checkout.fillInfo(firstName, lastName, postalCode);
  },
);

When('I continue to the overview step', async ({ checkout }) => {
  await checkout.continueToOverview();
});

When('I cancel checkout', async ({ checkout }) => {
  await checkout.cancel();
});

When('I finish the order', async ({ checkout }) => {
  await checkout.finish();
});

When('I click Back Home', async ({ checkout }) => {
  await checkout.backHomeButton.click();
});

Then('the checkout overview should list {int} item(s)', async ({ checkout }, count: number) => {
  await expect(checkout.items).toHaveCount(count);
});

Then(
  'the checkout overview should show item {string} with quantity {string} and price {string}',
  async ({ checkout }, name: string, quantity: string, price: string) => {
    const row = checkout.itemRow(name);
    await expect(checkout.itemQuantity(row)).toHaveText(quantity);
    await expect(checkout.itemName(row)).toHaveText(name);
    await expect(checkout.itemPrice(row)).toHaveText(price);
  },
);

Then('the payment info should show {string}', async ({ checkout }, value: string) => {
  await expect(checkout.paymentInfoValue).toHaveText(value);
});

Then('the shipping info should show {string}', async ({ checkout }, value: string) => {
  await expect(checkout.shippingInfoValue).toHaveText(value);
});

Then('the item total should show {string}', async ({ checkout }, value: string) => {
  await expect(checkout.subtotalLabel).toHaveText(value);
});

Then('the tax should show {string}', async ({ checkout }, value: string) => {
  await expect(checkout.taxLabel).toHaveText(value);
});

Then('the order total should show {string}', async ({ checkout }, value: string) => {
  await expect(checkout.totalLabel).toHaveText(value);
});

Then('the order confirmation text should be visible', async ({ checkout }) => {
  await expect(checkout.ponyExpressImage).toBeVisible();
  await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
  await expect(checkout.completeText).toHaveText(
    'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  );
});

Then('the checkout error message should say {string}', async ({ checkout }, message: string) => {
  await expect(checkout.errorMessage).toHaveText(message);
});

Then('no checkout error message should be displayed', async ({ checkout }) => {
  await expect(checkout.errorMessage).toBeHidden();
});

Then('the first name field should be marked as invalid', async ({ checkout }) => {
  await expect(checkout.firstNameField).toHaveClass(/error/);
});
