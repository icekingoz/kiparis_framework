import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

const productPage = new ProductPage();
const cartPage = new CartPage();

When('I add the product to my cart', () => {
  cy.on('window:alert', cy.stub().as('alert'));
  productPage.addToCart();
  cy.get('@alert').should('have.been.calledWith', 'Product added');
});

When('I view my cart', () => {
  cartPage.open();
});

Then('my cart should contain {string}', (name: string) => {
  cartPage.rows().should('contain.text', name);
});

Then('my cart total should match the price of {string}', (name: string) => {
  cy.fixture('products').then((products: Record<string, { price: string }>) => {
    cartPage.total().should('contain.text', products[name].price);
  });
});
