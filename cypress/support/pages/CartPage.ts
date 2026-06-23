import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  open(): void {
    this.openCart();
    cy.url().should('include', '/cart.html');
  }

  rows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('#tbodyid tr');
  }

  total(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('#totalp');
  }

  placeOrder(): void {
    cy.get('button[data-target="#orderModal"]').click();
  }
}
