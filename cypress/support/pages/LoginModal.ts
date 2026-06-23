import { BasePage } from './BasePage';

export class LoginModal extends BasePage {
  login(username: string, password: string): void {
    this.openLogin();
    cy.get('#logInModal').should('be.visible');
    cy.get('#loginusername').clear();
    cy.get('#loginusername').type(username);
    cy.get('#loginpassword').clear();
    cy.get('#loginpassword').type(password);
    cy.get('#logInModal .btn-primary').click();
  }
}
