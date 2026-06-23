@auth
Feature: Reusable login command

  Scenario: The custom login command authenticates a customer
    Given I am logged in via the login command
    Then I should be logged in
