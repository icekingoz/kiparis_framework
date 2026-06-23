import { BasePage } from './BasePage';

export class SignupModal extends BasePage {
  signup(username: string, password: string): void {
    this.openSignup();
    cy.get('#signInModal').should('be.visible');
    cy.get('#sign-username').clear();
    cy.get('#sign-username').type(username);
    cy.get('#sign-password').clear();
    cy.get('#sign-password').type(password);
    cy.get('#signInModal .btn-primary').click();
  }
}
