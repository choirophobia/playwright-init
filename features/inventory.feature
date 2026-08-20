@auth
Feature: Inventory Browsing
  As a Swag Labs customer
  I want to browse, sort, and inspect products
  So that I can decide what to buy

  Background:
    Given I am on the Products page

  Scenario: Browse the product inventory and view product details
    Then I should see 6 products listed
    And each product should show an image, name, description, price, and an Add to cart button
    And the sort dropdown should default to "Name (A to Z)"
    When I open the product "Sauce Labs Backpack"
    Then I should land on the product detail page for "Sauce Labs Backpack"
    And the product detail page should show a valid price
    And the product detail page should show the "Add to cart" button
    When I go back to products
    Then I should see 6 products listed
    And the products should be listed in the default order

  Scenario: Sort products by name and price
    When I sort products by "Name (Z to A)"
    Then the first product should be "Test.allTheThings() T-Shirt (Red)"
    And the last product should be "Sauce Labs Backpack"
    When I sort products by "Price (low to high)"
    Then the first product should be "Sauce Labs Onesie" priced "$7.99"
    And the last product should be "Sauce Labs Fleece Jacket" priced "$49.99"
    When I sort products by "Price (high to low)"
    Then the first product should be "Sauce Labs Fleece Jacket" priced "$49.99"
    And the last product should be "Sauce Labs Onesie" priced "$7.99"

  Scenario: Add-to-cart button state stays attached to the correct product after re-sorting
    When I add "sauce-labs-bike-light" to the cart
    Then the "sauce-labs-bike-light" item should show the "Remove" button
    And the cart badge should show "1"
    When I sort products by "Name (Z to A)"
    Then the first product should be "Test.allTheThings() T-Shirt (Red)"
    And the "sauce-labs-bike-light" item should show the "Remove" button
    And the "sauce-labs-backpack" item should show the "Add to cart" button
    And the "sauce-labs-bolt-t-shirt" item should show the "Add to cart" button
    And the "sauce-labs-fleece-jacket" item should show the "Add to cart" button
    And the "sauce-labs-onesie" item should show the "Add to cart" button
    And the "test.allthethings()-t-shirt-(red)" item should show the "Add to cart" button
    And the cart badge should show "1"
    When I sort products by "Price (low to high)"
    Then the "sauce-labs-bike-light" item should show the "Remove" button
    And only 1 product should show the "Remove" button

  Scenario: Product detail page reflects and toggles cart state added from the grid
    When I add "sauce-labs-backpack" to the cart
    Then the cart badge should show "1"
    When I open the product "Sauce Labs Backpack"
    Then I should land on the product detail page for "Sauce Labs Backpack"
    And the product detail page should show the "Remove" button
    And the cart badge should show "1"
    When I click "Remove" on the product detail page
    Then the product detail page should show the "Add to cart" button
    And the cart badge should not be displayed
    When I go back to products
    Then the "sauce-labs-backpack" item should show the "Add to cart" button

  Scenario: Reset App State clears the cart but leaves a stale Remove button on the grid (UI desync gap)
    When I add "sauce-labs-bike-light" to the cart
    Then the cart badge should show "1"
    And the "sauce-labs-bike-light" item should show the "Remove" button
    When I reset the app state
    Then the cart badge should not be displayed
    And the "sauce-labs-bike-light" item should show the "Remove" button
    When I open the cart
    Then the cart should contain 0 items
    When I click Continue Shopping
    Then the "sauce-labs-bike-light" item should show the "Add to cart" button

  Scenario: Navigating to a non-existent product id shows an unguarded "ITEM NOT FOUND" detail page
    When I navigate directly to the product detail page for id 999
    Then I should land on the product detail page for "ITEM NOT FOUND"
    And the product detail page price should show "$√-1"
    And the product detail page should show the "Add to cart" button
    When I go back to products
    Then I should see 6 products listed
