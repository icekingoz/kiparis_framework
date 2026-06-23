import { After, Before } from "@badeball/cypress-cucumber-preprocessor";

Before(() => {
  cy.log("Scenario start");
});

After(() => {
  cy.log("Scenario end");
});
