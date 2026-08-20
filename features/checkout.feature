@auth
Feature: Checkout
  As a Swag Labs customer
  I want to complete the checkout flow
  So that I can purchase the items in my cart

  Background:
    Given I am on the Products page

  Scenario: Complete an order successfully with a single item
    When I add "sauce-labs-backpack" to the cart
    Then the cart badge should show "1"
    When I open the cart
    And I click Checkout
    Then I should be on the "Checkout: Your Information" step
    When I fill in checkout info with first name "Fikri", last name "Ahmadi", and postal code "12345"
    And I continue to the overview step
    Then I should be on the "Checkout: Overview" step
    And the checkout overview should list 1 item
    And the checkout overview should show item "Sauce Labs Backpack" with quantity "1" and price "$29.99"
    And the payment info should show "SauceCard #31337"
    And the shipping info should show "Free Pony Express Delivery!"
    And the item total should show "Item total: $29.99"
    And the tax should show "Tax: $2.40"
    And the order total should show "Total: $32.39"
    When I finish the order
    Then I should be on the "Checkout: Complete!" step
    And the order confirmation text should be visible
    And the cart badge should not be displayed
    When I click Back Home
    Then I should land on the Products page
    And the cart badge should not be displayed

  Scenario: Complete an order with multiple items in the cart
    When I add "sauce-labs-backpack" to the cart
    And I add "sauce-labs-bike-light" to the cart
    And I add "sauce-labs-bolt-t-shirt" to the cart
    Then the cart badge should show "3"
    When I open the cart
    And I click Checkout
    And I fill in checkout info with first name "Fikri", last name "Ahmadi", and postal code "12345"
    And I continue to the overview step
    Then I should be on the "Checkout: Overview" step
    And the checkout overview should list 3 items
    And the checkout overview should show item "Sauce Labs Backpack" with quantity "1" and price "$29.99"
    And the checkout overview should show item "Sauce Labs Bike Light" with quantity "1" and price "$9.99"
    And the checkout overview should show item "Sauce Labs Bolt T-Shirt" with quantity "1" and price "$15.99"
    And the item total should show "Item total: $55.97"
    And the tax should show "Tax: $4.48"
    And the order total should show "Total: $60.45"
    When I finish the order
    Then I should be on the "Checkout: Complete!" step
    And the cart badge should not be displayed

  Scenario Outline: Checkout information step rejects a missing required field
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    And I fill in checkout info with first name "<firstName>", last name "<lastName>", and postal code "<postalCode>"
    And I continue to the overview step
    Then the checkout error message should say "<error>"
    And I should be on the "Checkout: Your Information" step

    Examples: <error>
      | firstName | lastName | postalCode | error                           |
      |           | Ahmadi   | 12345      | Error: First Name is required   |
      | Fikri     |          | 12345      | Error: Last Name is required    |
      | Fikri     | Ahmadi   |            | Error: Postal Code is required  |

  Scenario: Checkout information step highlights an empty required field
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    And I continue to the overview step
    Then the first name field should be marked as invalid

  Scenario: Checkout information step accepts whitespace-only field values (validation gap)
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    Then I should be on the "Checkout: Your Information" step
    When I fill in checkout info with first name "   ", last name "   ", and postal code "   "
    And I continue to the overview step
    Then no checkout error message should be displayed
    And I should be on the "Checkout: Overview" step
    And the checkout overview should list 1 item
    And the checkout overview should show item "Sauce Labs Backpack" with quantity "1" and price "$29.99"
    And the item total should show "Item total: $29.99"
    And the tax should show "Tax: $2.40"
    And the order total should show "Total: $32.39"

  Scenario: Cancel checkout returns user to prior page without completing order
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    Then I should be on the "Checkout: Your Information" step
    When I cancel checkout
    Then I should land on the Cart page
    And the cart should contain 1 item
    And the cart should show item "Sauce Labs Backpack" with quantity "1" and price "$29.99"
    And the cart badge should show "1"
    When I click Checkout
    And I fill in checkout info with first name "Fikri", last name "Ahmadi", and postal code "12345"
    And I continue to the overview step
    Then I should be on the "Checkout: Overview" step
    When I cancel checkout
    Then I should land on the Products page
    And the cart badge should show "1"
