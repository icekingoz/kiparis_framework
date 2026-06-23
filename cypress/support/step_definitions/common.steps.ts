import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';
import { HomePage } from '../pages/HomePage';

const home = new HomePage();

Given('I am on the Demoblaze store', () => {
  home.visitStore();
});

Then('I should see products listed', () => {
  home.productCards().should('have.length.greaterThan', 0);
});
