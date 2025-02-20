@smoke
Feature: Smoke steps

  @smoke1
  Scenario: Predefined steps for Google
    Given I open url "https://google.com"
    Then I should see page title as "Google"
    Then element with selector "#APjFqb" should be present
    When I type "Behavior Driven Development" into element with selector "#APjFqb"
    When I click on element with selector "body > div.L3eUgb > div.o3j99.ikrT4e.om7nvf > form > div:nth-child(1) > div.A8SBwf.sbfc.emcav > div.UUbT9.EyBRub > div.aajZCb > div.lJ9FBc > center > input.gNO89b"
    Then I wait for element with selector "#gsr" to be present
    Then element with selector "#gsr" should contain text "Cucumber"

  @smoke3
  Scenario: Wikipedia
    Given I open url "https://www.wikipedia.org/"
    Then I should see page title as "Wikipedia"
    Then element with selector "#searchInput" should be present
    When I type "The Great Emu War" into element with selector "#searchInput"
    Then I click on element with selector "#search-form > fieldset > button"
    Then element with selector "#content" should contain text "The Great Emu War"
