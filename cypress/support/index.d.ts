declare global {
  namespace Cypress {
    interface Chainable {
      /** Log in through the UI and assert the welcome label shows the username. */
      loginViaUI(username: string, password: string): Chainable<void>;
    }
  }
}

export {};
