@auth
Feature: Account login

  @smoke
  Scenario: A registered customer logs in successfully
    Given I am on the Demoblaze store
    When I log in with valid credentials
    Then I should be logged in

  Scenario: A logged-in customer can log out
    Given I am on the Demoblaze store
    When I log in with valid credentials
    And I log out
    Then I should be logged out

  Scenario Outline: Login is rejected for a wrong password
    Given I am on the Demoblaze store
    When I log in as the registered user with password "<password>"
    Then I should see the login error "Wrong password."

    Examples:
      | password         |
      | definitely-wrong |
      | not-my-password  |
      | 00000000         |

  Scenario: Login is rejected for an unknown user
    Given I am on the Demoblaze store
    When I attempt to log in as a user that does not exist
    Then I should see the login error "User does not exist."
