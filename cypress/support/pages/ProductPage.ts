import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  productTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.name');
  }

  addToCart(): void {
    cy.get('a.btn-success').click(); // fires native alert "Product added"
  }
}
