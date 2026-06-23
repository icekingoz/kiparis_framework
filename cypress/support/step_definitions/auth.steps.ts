import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { HomePage } from '../pages/HomePage';
import { LoginModal } from '../pages/LoginModal';
import { SignupModal } from '../pages/SignupModal';
import { createUniqueUser } from '../factories/userFactory';

const home = new HomePage();
const loginModal = new LoginModal();
const signupModal = new SignupModal();

When('I log in with valid credentials', () => {
  const user = Cypress.env('DEMOBLAZE_USER');
  loginModal.login(user, Cypress.env('DEMOBLAZE_PASS'));
  home.confirmLoggedIn(user);
});

Then('I should be logged in', () => {
  home.welcomeLabel().should('contain.text', Cypress.env('DEMOBLAZE_USER'));
});

When('I log out', () => {
  home.logout();
});

Then('I should be logged out', () => {
  home.expectLoggedOut();
});

When('I log in as the registered user with password {string}', (password: string) => {
  cy.on('window:alert', cy.stub().as('alert'));
  loginModal.login(Cypress.env('DEMOBLAZE_USER'), password);
});

When('I attempt to log in as a user that does not exist', () => {
  cy.on('window:alert', cy.stub().as('alert'));
  const ghost = `ghost_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  loginModal.login(ghost, 'whatever');
});

Then('I should see the login error {string}', (message: string) => {
  cy.get('@alert').should('have.been.calledWith', message);
});

When('I sign up as a new unique user', () => {
  cy.on('window:alert', cy.stub().as('alert'));
  const user = createUniqueUser();
  signupModal.signup(user.username, user.password);
});

Then('I should see the signup confirmation', () => {
  cy.get('@alert').should('have.been.calledWith', 'Sign up successful.');
});

Given('I am logged in via the login command', () => {
  home.visitStore();
  cy.loginViaUI(Cypress.env('DEMOBLAZE_USER'), Cypress.env('DEMOBLAZE_PASS'));
});
