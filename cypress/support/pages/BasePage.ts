/// <reference types="cypress" />

export abstract class BasePage {
  visit(path = '/'): void {
    cy.visit(path);
  }

  openLogin(): void {
    cy.get('#login2').click();
  }

  openSignup(): void {
    cy.get('#signin2').click();
  }

  openCart(): void {
    cy.get('#cartur').click();
  }

  openContact(): void {
    cy.contains('.nav-link', 'Contact').click();
  }

  logout(): void {
    cy.get('#logout2').click();
  }

  welcomeLabel(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('#nameofuser');
  }
}
