@auth
Feature: Shopping Cart
  As a Swag Labs customer
  I want to add and remove items from my cart
  So that I can buy the products I want

  Background:
    Given I am on the Products page

  Scenario: Add a single item to the cart and verify the cart badge
    Then the cart badge should not be displayed
    When I add "sauce-labs-backpack" to the cart
    Then the cart badge should show "1"
    And the "sauce-labs-backpack" item should show the "Remove" button

  Scenario: Add multiple items to the cart and verify the cart badge count
    When I add "sauce-labs-backpack" to the cart
    Then the cart badge should show "1"
    When I add "sauce-labs-bike-light" to the cart
    Then the cart badge should show "2"
    When I add "sauce-labs-bolt-t-shirt" to the cart
    Then the cart badge should show "3"
    When I remove "sauce-labs-bike-light" from the cart on the Products page
    Then the cart badge should show "2"
    And the "sauce-labs-bike-light" item should show the "Add to cart" button

  Scenario: Removing the only item from the cart results in an empty cart
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    Then the cart should contain 1 item
    When I remove "sauce-labs-backpack" from the cart page
    Then the cart should contain 0 items
    And the cart badge should not be displayed
    And the Checkout button should be visible

  Scenario: View cart contents and remove an item from the Cart page
    When I add "sauce-labs-backpack" to the cart
    And I add "sauce-labs-bike-light" to the cart
    Then the cart badge should show "2"
    When I open the cart
    Then I should land on the Cart page
    And the cart should contain 2 items
    And the cart should show item "Sauce Labs Backpack" with quantity "1" and price "$29.99"
    And the cart should show item "Sauce Labs Bike Light" with quantity "1" and price "$9.99"
    When I remove "sauce-labs-bike-light" from the cart page
    Then the cart should contain 1 item
    And the cart badge should show "1"
    When I click Continue Shopping
    Then I should land on the Products page
    And the cart badge should show "1"
