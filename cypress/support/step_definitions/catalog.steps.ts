import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';

const home = new HomePage();
const productPage = new ProductPage();

When('I filter products by {string}', (category: string) => {
  home.filterByCategory(category);
});

Then('I should see the product {string}', (name: string) => {
  home.categoryProductTitles().should('contain.text', name);
});

Then('I should not see the product {string}', (name: string) => {
  home.categoryProductTitles().should('exist').and('not.contain.text', name);
});

When('I open the product {string}', (name: string) => {
  home.openProduct(name);
});

Then('the product detail page shows {string}', (name: string) => {
  productPage.productTitle().should('contain.text', name);
});

When('I go to the next page of products', () => {
  home.goToNextPage();
});
