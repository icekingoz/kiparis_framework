import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private static readonly CARD = '.card';

  visitStore(): void {
    this.visit('/');
    this.productCards().should('have.length.greaterThan', 0);
  }

  productCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(HomePage.CARD);
  }
}
