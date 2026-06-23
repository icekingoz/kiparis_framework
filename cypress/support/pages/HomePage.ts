import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private static readonly CARD = '.card';
  private static readonly CATEGORY = '.list-group .list-group-item';

  visitStore(): void {
    this.visit('/');
    this.productCards().should('have.length.greaterThan', 0);
  }

  productCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(HomePage.CARD);
  }

  filterByCategory(category: string): void {
    cy.intercept('**/bycat').as('bycat');
    cy.contains(HomePage.CATEGORY, category).click();
    cy.wait('@bycat');
  }

  openProduct(name: string): void {
    cy.contains('.card-title a', name).click();
  }

  goToNextPage(): void {
    cy.get('#next2').click();
  }

  categoryProductTitles(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.card-title');
  }
}
