# Basic Operations Test Plan

## Application Overview

Swag Labs (SauceDemo, https://www.saucedemo.com) is a demo e-commerce app used for testing purposes. Users log in with a username/password (all demo accounts share the password `secret_sauce`), browse a catalog of six "Sauce Labs" branded products on the Products/inventory page, add items to a persistent cart (shown as a badge count on the cart icon in the header), review/edit the cart, and complete a three-step checkout (shipping information entry, order overview/review, and order confirmation). A hamburger side-menu (top left) provides navigation including Logout, About, and Reset App State. This plan covers the core, everyday "happy path" shopper flows using the `standard_user` account: login (valid and invalid), browsing inventory, adding items to the cart, viewing/removing cart items, completing checkout, and logging out. Locked-out, problem, performance-glitch, and other special demo accounts are explicitly out of scope. Existing Playwright page objects (pages/LoginPage.ts, pages/InventoryPage.ts, pages/CartPage.ts, pages/CheckoutPage.ts) and the shared login beforeEach hook should be reused where applicable when automating these scenarios.

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Valid login with standard_user succeeds and lands on Products page

**File:** `tests/login/valid-login.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com
    - expect: Login page is displayed with 'Swag Labs' heading, a Username field, a Password field, and a Login button
    - expect: The page lists accepted usernames (including standard_user) and notes the shared password 'secret_sauce'
  2. Enter 'standard_user' into the Username field
  3. Enter 'secret_sauce' into the Password field
  4. Click the Login button
    - expect: User is redirected to /inventory.html
    - expect: The page header shows 'Products' as the active page title
    - expect: Six product items are visible in the inventory list (Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket, Sauce Labs Onesie, Test.allTheThings() T-Shirt (Red))
    - expect: No error message is displayed
    - expect: No shopping cart badge is shown (cart is empty)

#### 1.2. Invalid credentials show an error message and user stays on login page

**File:** `tests/login/invalid-login.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com
    - expect: Login page is displayed
  2. Enter 'invalid_user' into the Username field and 'wrong_password' into the Password field
  3. Click the Login button
    - expect: User remains on the login page (URL stays at https://www.saucedemo.com/)
    - expect: An error banner is displayed with the message: 'Epic sadface: Username and password do not match any user in this service'
    - expect: The error banner has a dismiss (X) button
    - expect: The Username and Password fields are outlined in red to indicate the error state
  4. Click the error banner's dismiss (X) button
    - expect: The error message is removed from the page

#### 1.3. Login fails when required fields are left blank

**File:** `tests/login/empty-fields-login.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com
    - expect: Login page is displayed
  2. Leave the Username and Password fields empty and click the Login button
    - expect: An error message is displayed stating the Username is required (e.g. 'Epic sadface: Username is required')
    - expect: User remains on the login page
  3. Enter 'standard_user' into the Username field only, leave Password blank, and click Login
    - expect: An error message is displayed stating the Password is required (e.g. 'Epic sadface: Password is required')
    - expect: User remains on the login page

### 2. Inventory Browsing

**Seed:** `tests/seed.spec.ts`

#### 2.1. Browse the product inventory and view product details

**File:** `tests/inventory/browse-products.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, and log in with standard_user / secret_sauce
    - expect: User lands on the Products page at /inventory.html
  2. Inspect the product grid
    - expect: Each of the 6 products displays an image, name, short description, price (formatted as $X.XX), and an 'Add to cart' button
    - expect: Default sort order is 'Name (A to Z)' as shown in the sort dropdown
  3. Click on a product name or image (e.g. 'Sauce Labs Backpack')
    - expect: User is navigated to that product's detail page showing the full product name, description, price, an 'Add to cart' button, and a 'Back to products' button
  4. Click 'Back to products'
    - expect: User returns to the Products/inventory page with the same product list

#### 2.2. Sort products by name and price

**File:** `tests/inventory/sort-products.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, and log in with standard_user / secret_sauce
    - expect: User lands on the Products page
  2. Open the product sort dropdown (defaults to 'Name (A to Z)') and select 'Name (Z to A)'
    - expect: Product list re-orders so 'Test.allTheThings() T-Shirt (Red)' appears first and 'Sauce Labs Backpack' appears last
  3. Select 'Price (low to high)' from the sort dropdown
    - expect: Product list re-orders with 'Sauce Labs Onesie' ($7.99) first and 'Sauce Labs Fleece Jacket' ($49.99) last
  4. Select 'Price (high to low)' from the sort dropdown
    - expect: Product list re-orders with 'Sauce Labs Fleece Jacket' ($49.99) first and 'Sauce Labs Onesie' ($7.99) last

### 3. Shopping Cart

**Seed:** `tests/seed.spec.ts`

#### 3.1. Add a single item to the cart and verify the cart badge

**File:** `tests/cart/add-single-item.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, and log in with standard_user / secret_sauce
    - expect: User lands on the Products page with no cart badge visible (empty cart)
  2. Click the 'Add to cart' button on 'Sauce Labs Backpack'
    - expect: The cart icon badge in the header now displays '1'
    - expect: The button on the Sauce Labs Backpack tile changes from 'Add to cart' to 'Remove'

#### 3.2. Add multiple items to the cart and verify the cart badge count

**File:** `tests/cart/add-multiple-items.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, and log in with standard_user / secret_sauce
    - expect: User lands on the Products page with no cart badge visible
  2. Click 'Add to cart' for 'Sauce Labs Backpack', then 'Sauce Labs Bike Light', then 'Sauce Labs Bolt T-Shirt'
    - expect: After each click the cart badge count increments accordingly, ending at '3'
    - expect: Each added product's button changes to 'Remove'
  3. Click 'Remove' on the 'Sauce Labs Bike Light' tile directly from the Products page
    - expect: The cart badge count decreases to '2'
    - expect: The button for Sauce Labs Bike Light reverts to 'Add to cart'

#### 3.3. View cart contents and remove an item from the Cart page

**File:** `tests/cart/view-and-remove-item.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, then add 'Sauce Labs Backpack' and 'Sauce Labs Bike Light' to the cart from the Products page
    - expect: Cart badge shows '2'
  2. Click the shopping cart icon in the header
    - expect: User is navigated to /cart.html showing the 'Your Cart' heading
    - expect: A table with QTY and Description columns lists both added items, each with quantity 1, name, description, price, and a 'Remove' button
    - expect: A 'Continue Shopping' button and a 'Checkout' button are visible
  3. Click 'Remove' on the 'Sauce Labs Bike Light' cart row
    - expect: The Sauce Labs Bike Light row is removed from the cart table
    - expect: Only 'Sauce Labs Backpack' remains listed
    - expect: The cart badge in the header updates to '1'
  4. Click 'Continue Shopping'
    - expect: User is returned to the Products/inventory page
    - expect: Cart badge still shows '1'

#### 3.4. Remove the only item from the cart results in an empty cart

**File:** `tests/cart/remove-last-item.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, add 'Sauce Labs Backpack' to the cart, then open the cart page
    - expect: Cart page shows 1 item
  2. Click 'Remove' on the remaining cart item
    - expect: The cart item list becomes empty
    - expect: The cart badge disappears from the header (no count shown)
    - expect: The Checkout button remains visible but cart is empty

### 4. Checkout

**Seed:** `tests/seed.spec.ts`

#### 4.1. Complete an order successfully with a single item (happy path)

**File:** `tests/checkout/complete-order-single-item.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, and add 'Sauce Labs Backpack' to the cart
    - expect: Cart badge shows '1'
  2. Open the cart page via the cart icon, then click 'Checkout'
    - expect: User is navigated to /checkout-step-one.html with heading 'Checkout: Your Information'
    - expect: First Name, Last Name, and Zip/Postal Code text fields are displayed along with 'Cancel' and 'Continue' buttons
  3. Enter First Name 'Fikri', Last Name 'Ahmadi', and Zip/Postal Code '12345', then click 'Continue'
    - expect: User is navigated to /checkout-step-two.html with heading 'Checkout: Overview'
    - expect: The order summary lists the Sauce Labs Backpack with quantity 1 and price $29.99
    - expect: Payment Information shows 'SauceCard #31337'
    - expect: Shipping Information shows 'Free Pony Express Delivery!'
    - expect: Price Total section shows Item total, Tax, and Total (Total = Item total + Tax)
    - expect: 'Cancel' and 'Finish' buttons are visible
  4. Click 'Finish'
    - expect: User is navigated to /checkout-complete.html with heading 'Checkout: Complete!'
    - expect: A pony express image and the heading 'Thank you for your order!' are displayed
    - expect: Confirmation text reads 'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    - expect: A 'Back Home' button is visible
    - expect: The cart badge is no longer shown in the header (cart has been emptied)
  5. Click 'Back Home'
    - expect: User is returned to the Products/inventory page
    - expect: No cart badge is displayed, confirming the cart was cleared after the completed order

#### 4.2. Complete an order with multiple items in the cart

**File:** `tests/checkout/complete-order-multiple-items.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, and add 'Sauce Labs Backpack', 'Sauce Labs Bike Light', and 'Sauce Labs Bolt T-Shirt' to the cart
    - expect: Cart badge shows '3'
  2. Open the cart page and click 'Checkout', then fill in valid First Name, Last Name, and Zip/Postal Code and click 'Continue'
    - expect: Checkout Overview page lists all 3 items with correct quantities and prices
    - expect: Item total equals the sum of all 3 item prices ($29.99 + $9.99 + $15.99 = $55.97)
    - expect: Tax and Total are calculated and displayed
  3. Click 'Finish'
    - expect: Order completes successfully showing 'Thank you for your order!' confirmation
    - expect: Cart badge is cleared

#### 4.3. Checkout information step validates required fields

**File:** `tests/checkout/checkout-required-fields.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, add an item to the cart, open the cart, and click 'Checkout'
    - expect: User is on the 'Checkout: Your Information' step
  2. Leave all fields (First Name, Last Name, Zip/Postal Code) blank and click 'Continue'
    - expect: An error message is displayed: 'Error: First Name is required'
    - expect: User remains on the checkout information step
    - expect: The First Name field is outlined in red
  3. Enter only First Name 'Fikri' and click 'Continue'
    - expect: An error message is displayed: 'Error: Last Name is required'
    - expect: User remains on the checkout information step
  4. Additionally enter Last Name 'Ahmadi', leave Zip/Postal Code blank, and click 'Continue'
    - expect: An error message is displayed: 'Error: Postal Code is required'
    - expect: User remains on the checkout information step
  5. Fill in Zip/Postal Code '12345' and click 'Continue'
    - expect: User successfully advances to the 'Checkout: Overview' step

#### 4.4. Cancel checkout returns user to prior page without completing order

**File:** `tests/checkout/cancel-checkout.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, add an item to the cart, open the cart, and click 'Checkout'
    - expect: User is on the 'Checkout: Your Information' step
  2. Click the 'Cancel' button on the Checkout: Your Information step
    - expect: User is returned to the Cart page (/cart.html)
    - expect: The previously added item is still present in the cart with the cart badge unchanged
  3. Click 'Checkout' again, fill in valid shipping information, click 'Continue' to reach the 'Checkout: Overview' step, then click 'Cancel' on that step
    - expect: User is returned to the Products/inventory page
    - expect: The cart badge still reflects the item(s) added earlier (order was not completed and cart was not cleared)

#### 4.5. Checkout information step accepts whitespace-only field values (validation gap)

**File:** `tests/checkout/checkout-whitespace-fields.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, add an item to the cart, open the cart, and click 'Checkout'
    - expect: User is on the 'Checkout: Your Information' step
  2. Enter three spaces (`'   '`) into First Name, Last Name, and Zip/Postal Code, then click 'Continue'
    - expect: No error message is displayed
    - expect: User advances to the 'Checkout: Overview' step (the required-field check only rejects an empty string, not whitespace-only input)
    - expect: The order summary and price totals render normally despite the blank-looking shipping info

### 5. Logout

**Seed:** `tests/seed.spec.ts`

#### 5.1. Logout from the Products page returns user to the login screen

**File:** `tests/logout/logout.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, and log in with standard_user / secret_sauce
    - expect: User lands on the Products page
  2. Click the hamburger 'Open Menu' button in the top-left corner
    - expect: A side menu slides in showing links: 'All Items', 'About', 'Logout', and 'Reset App State', plus a 'Close Menu' button
  3. Click the 'Logout' link
    - expect: User is redirected to the login page at https://www.saucedemo.com/
    - expect: The Username and Password fields are empty
    - expect: Attempting to navigate directly back to /inventory.html redirects the user back to the login page (session is no longer authenticated)

#### 5.2. Logout is available and functions after adding items to the cart

**File:** `tests/logout/logout-with-cart-items.spec.ts`

**Steps:**
  1. Start from a fresh browser state, navigate to https://www.saucedemo.com, log in with standard_user / secret_sauce, and add 2 items to the cart
    - expect: Cart badge shows '2'
  2. Open the hamburger menu and click 'Logout'
    - expect: User is logged out and redirected to the login page
  3. Log back in with standard_user / secret_sauce
    - expect: User lands on the Products page
    - expect: The cart badge still shows '2', confirming cart contents persist across a logout/login cycle for the same session
