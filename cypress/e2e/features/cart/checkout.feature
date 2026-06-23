@cart
Feature: Checkout

  @smoke
  Scenario: A customer places an order
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    And I add the product to my cart
    And I view my cart
    And I place an order with valid payment details
    Then I should see an order confirmation
