@cart
Feature: Shopping cart

  @smoke
  Scenario: A customer adds a product to the cart
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    And I add the product to my cart
    And I view my cart
    Then my cart should contain "Samsung galaxy s6"
    And my cart total should match the price of "Samsung galaxy s6"
