@auth
Feature: Account signup

  @smoke
  Scenario: A new visitor can create an account
    Given I am on the Demoblaze store
    When I sign up as a new unique user
    Then I should see the signup confirmation
