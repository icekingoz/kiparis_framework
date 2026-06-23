@catalog
Feature: Storefront

  @smoke
  Scenario: The product catalog is displayed on the home page
    Given I am on the Demoblaze store
    Then I should see products listed
