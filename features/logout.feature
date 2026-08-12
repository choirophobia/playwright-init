@auth
Feature: Logout
  As a Swag Labs customer
  I want to log out of my account
  So that my session ends safely and my cart state is preserved for next time

  Background:
    Given I am on the Products page

  Scenario: Logout from the Products page returns user to the login screen
    When I open the menu
    Then the menu should show "All Items"
    And the menu should show "About"
    And the menu should show "Logout"
    And the menu should show "Reset App State"
    And the menu should show "Close Menu"
    When I click Logout
    Then I should be redirected to the login page
    And the username and password fields should be empty
    When I navigate directly to "/inventory.html"
    Then I should be redirected to the login page
    And I should see the error message "You can only access '/inventory.html' when you are logged in."

  Scenario: Logout is available and functions after adding items to the cart
    When I add "sauce-labs-backpack" to the cart
    And I add "sauce-labs-bike-light" to the cart
    Then the cart badge should show "2"
    When I logout
    Then I should be redirected to the login page
    And the login button should be visible
    When I log in with username "standard_user" and password "secret_sauce"
    Then I should land on the Products page
    And the cart badge should show "2"
