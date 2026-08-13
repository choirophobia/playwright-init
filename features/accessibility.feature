Feature: Accessibility
  As a Swag Labs customer using assistive technology
  I want every core page to meet baseline accessibility standards
  So that I can use the app regardless of ability

  Scenario: The login page has no critical or serious accessibility violations
    Given I am on the login page
    Then the page should have no critical or serious accessibility violations

  @auth
  Scenario: The Products page has no critical or serious accessibility violations, aside from the known sort-dropdown gap
    Given I am on the Products page
    Then the page should have no critical or serious accessibility violations, aside from the known sort-dropdown gap

  @auth
  Scenario: The Products page sort dropdown is missing an accessible name (known accessibility gap)
    Given I am on the Products page
    Then the sort dropdown should have a known accessibility gap: "select-name"

  @auth
  Scenario: The Cart page has no critical or serious accessibility violations
    Given I am on the Products page
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    Then the page should have no critical or serious accessibility violations

  @auth
  Scenario: The Checkout information step has no critical or serious accessibility violations
    Given I am on the Products page
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    Then the page should have no critical or serious accessibility violations

  @auth
  Scenario: The Checkout overview step has no critical or serious accessibility violations
    Given I am on the Products page
    When I add "sauce-labs-backpack" to the cart
    And I open the cart
    And I click Checkout
    And I fill in checkout info with first name "Fikri", last name "Ahmadi", and postal code "12345"
    And I continue to the overview step
    Then the page should have no critical or serious accessibility violations
