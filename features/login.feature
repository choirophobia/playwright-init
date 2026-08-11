Feature: Login
  As a Swag Labs customer
  I want to log in with my credentials
  So that I can access the product catalog

  Background:
    Given I am on the login page

  Scenario: Valid login with standard_user succeeds and lands on the Products page
    When I log in with username "standard_user" and password "secret_sauce"
    Then I should land on the Products page
    And I should see 6 products listed
    And no error message should be displayed

  Scenario: Invalid credentials show an error message and user stays on the login page
    When I log in with username "invalid_user" and password "wrong_password"
    Then I should stay on the login page
    And I should see the error message "Epic sadface: Username and password do not match any user in this service"

  Scenario: Login fails when required fields are left blank
    When I click the login button without entering any credentials
    Then I should see the error message "Epic sadface: Username is required"
    When I enter "standard_user" as the username and click the login button
    Then I should see the error message "Epic sadface: Password is required"
