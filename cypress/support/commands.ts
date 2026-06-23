/// <reference types="cypress" />
import { LoginModal } from './pages/LoginModal';

// Reusable UI login shortcut. Delegates to the LoginModal page object so all
// selectors stay centralized there.
Cypress.Commands.add('loginViaUI', (username: string, password: string) => {
  const loginModal = new LoginModal();
  loginModal.login(username, password);
  loginModal.confirmLoggedIn(username);
});

export {};
