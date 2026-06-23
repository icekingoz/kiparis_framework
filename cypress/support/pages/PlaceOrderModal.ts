import { BasePage } from './BasePage';

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

export class PlaceOrderModal extends BasePage {
  fillAndPurchase(order: OrderDetails): void {
    cy.get('#orderModal').should('be.visible');
    cy.get('#name').type(order.name);
    cy.get('#country').type(order.country);
    cy.get('#city').type(order.city);
    cy.get('#card').type(order.card);
    cy.get('#month').type(order.month);
    cy.get('#year').type(order.year);
    cy.get('#orderModal .btn-primary').click();
  }

  confirmation(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.sweet-alert');
  }
}
