import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { PlaceOrderModal } from '../pages/PlaceOrderModal';

const productPage = new ProductPage();
const cartPage = new CartPage();
const placeOrderModal = new PlaceOrderModal();

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

When('I place an order with valid payment details', () => {
  cartPage.placeOrder();
  placeOrderModal.fillAndPurchase({
    name: 'Jane Doe',
    country: 'USA',
    city: 'Seattle',
    card: '4111111111111111',
    month: '12',
    year: '2027',
  });
});

Then('I should see an order confirmation', () => {
  placeOrderModal
    .confirmation()
    .should('be.visible')
    .and('contain.text', 'Thank you for your purchase!');
});
