import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { ContactModal } from '../pages/ContactModal';

const contactModal = new ContactModal();

When('I send a contact message', () => {
  cy.on('window:alert', cy.stub().as('alert'));
  contactModal.sendMessage('jane@example.com', 'Jane Doe', 'Hello, I have a question.');
});

Then('I should see the contact confirmation', () => {
  cy.get('@alert').should('have.been.calledWith', 'Thanks for the message!!');
});
