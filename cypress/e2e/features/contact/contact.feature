@contact
Feature: Contact form

  Scenario: A visitor sends a contact message
    Given I am on the Demoblaze store
    When I send a contact message
    Then I should see the contact confirmation
