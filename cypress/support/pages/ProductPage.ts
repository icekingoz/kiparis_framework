import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  productTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.name');
  }
}
