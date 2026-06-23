@catalog
Feature: Browse the product catalog

  @smoke
  Scenario: Filtering by a category shows matching products
    Given I am on the Demoblaze store
    When I filter products by "Phones"
    Then I should see the product "Samsung galaxy s6"

  Scenario: Switching categories changes the products shown
    Given I am on the Demoblaze store
    When I filter products by "Laptops"
    Then I should not see the product "Samsung galaxy s6"

  Scenario: Opening a product shows its detail page
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    Then the product detail page shows "Samsung galaxy s6"

  Scenario: Customers can page through the catalog
    Given I am on the Demoblaze store
    When I go to the next page of products
    Then I should see products listed
