import { BasePage } from './BasePage';

export class ContactModal extends BasePage {
  sendMessage(email: string, name: string, message: string): void {
    this.openContact();
    cy.get('#exampleModal').should('be.visible');
    cy.get('#recipient-email').type(email);
    cy.get('#recipient-name').type(name);
    cy.get('#message-text').type(message);
    cy.get('#exampleModal .btn-primary').click();
  }
}
