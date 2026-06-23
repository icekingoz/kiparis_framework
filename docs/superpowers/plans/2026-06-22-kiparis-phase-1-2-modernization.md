# Kiparis Phase 1+2 Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize Kiparis into a Senior/SDET-grade Cypress 15 + TypeScript framework with declarative BDD, a robust Page Object Model, and resilient (no-hard-wait) tests running against Demoblaze.

**Architecture:** Four isolated layers — declarative Gherkin features → thin TypeScript step definitions → page-object classes (the only place selectors live) → low-level custom commands. Tests target the live Demoblaze store (`https://www.demoblaze.com`), whose DOM was verified directly while writing this plan.

**Tech Stack:** Cypress `^15`, TypeScript (`strict`), `@badeball/cypress-cucumber-preprocessor`, `@bahmutov/cypress-esbuild-preprocessor`, ESLint 9 (flat config) + typescript-eslint + eslint-plugin-cypress, Prettier.

## Global Constraints

- **Cypress version floor:** `^15`. Node `>=20`.
- **TypeScript everywhere:** every file under `cypress/` is `.ts`. No `.js` source remains. `tsc --noEmit` must pass with `strict: true`.
- **No selectors outside page objects:** `.feature` files and `*.steps.ts` files contain zero CSS/XPath selectors. Selectors live only in `cypress/support/pages/*.ts`.
- **No hard waits:** never `cy.wait(<number>)`. Use `cy.intercept(...).as()` + `cy.wait('@alias')` or web-first assertions. Enforced by `npm run check:no-hard-waits`.
- **Declarative Gherkin only:** steps express behavior/intent, never mechanics.
- **No committed secrets:** credentials live only in `cypress.env.json` (gitignored). `cypress.env.example.json` is the committed template.
- **Commits:** the user reviews and approves each task before it is committed. If executing unattended, stage changes and pause for approval rather than committing autonomously. Commit messages end with the project's `Co-Authored-By` trailer.

## Verified Demoblaze reference (selectors confirmed live on 2026-06-22)

- **Navbar:** `#login2` (opens `#logInModal`), `#signin2` (opens `#signInModal`), `#logout2`, `#nameofuser` (shows `Welcome <user>` when logged in), `#cartur` (→ `cart.html`), Contact link = `.nav-link` containing text `Contact` (opens `#exampleModal`).
- **Categories:** `.list-group .list-group-item` with text `Phones` / `Laptops` / `Monitors` (the IDs are duplicated `#itemc`, so select by text). Clicking fires an AJAX call to `**/bycat`.
- **Product cards:** `.card`; title link `.card-title a` (text = product name); price `.card-block h5`. Home shows 9 per page.
- **Pagination:** `#next2` (Next), `#prev2` (Previous).
- **Login modal `#logInModal`:** `#loginusername`, `#loginpassword`, submit `#logInModal .btn-primary`. Success → `#nameofuser` shows the username. Failure → native `alert` `User does not exist.` or `Wrong password.`
- **Signup modal `#signInModal`:** `#sign-username`, `#sign-password`, submit `#signInModal .btn-primary`. Success → native `alert` `Sign up successful.`
- **Product page (`prod.html?idp_=N`):** title `.name`, price `.price-container`, add button `a.btn-success` → native `alert` `Product added.`
- **Cart page (`cart.html`):** rows `#tbodyid tr`, total `#totalp`, place-order button `button[data-target="#orderModal"]`.
- **Order modal `#orderModal`:** `#name`, `#country`, `#city`, `#card`, `#month`, `#year`, submit `#orderModal .btn-primary`. Success → SweetAlert `.sweet-alert` containing `Thank you for your purchase!`
- **Contact modal `#exampleModal`:** `#recipient-email`, `#recipient-name`, `#message-text`, submit `#exampleModal .btn-primary` → native `alert` `Thanks for the message!!`

## File structure (created/modified across the plan)

```
package.json                         (modify: deps, scripts, stepDefinitions glob)
tsconfig.json                        (modify: strict, types, include)
cypress.config.ts                    (modify: baseUrl)
eslint.config.mjs                    (create)
.prettierrc                          (create)
.gitignore                           (modify: add cypress.env.json, .playwright-mcp)
cypress.env.example.json             (create)
cypress.env.json                     (create locally — gitignored)
cypress/support/e2e.ts               (replace e2e.js)
cypress/support/commands.ts          (replace commands.js)
cypress/support/index.d.ts           (create — command typing)
cypress/support/pages/BasePage.ts        (create)
cypress/support/pages/HomePage.ts        (create T2, extend T5)
cypress/support/pages/LoginModal.ts      (create T3)
cypress/support/pages/SignupModal.ts     (create T4)
cypress/support/pages/ProductPage.ts     (create T5, extend T6)
cypress/support/pages/CartPage.ts        (create T6)
cypress/support/pages/PlaceOrderModal.ts (create T7)
cypress/support/pages/ContactModal.ts    (create T8)
cypress/support/factories/userFactory.ts (create T4)
cypress/support/step_definitions/hooks.ts        (replace Hooks.js)
cypress/support/step_definitions/common.steps.ts (create T2)
cypress/support/step_definitions/auth.steps.ts   (create T3, extend T4)
cypress/support/step_definitions/catalog.steps.ts(create T5)
cypress/support/step_definitions/cart.steps.ts   (create T6, extend T7)
cypress/support/step_definitions/contact.steps.ts(create T8)
cypress/e2e/features/catalog/home.feature            (create T2)
cypress/e2e/features/auth/login.feature              (create T3)
cypress/e2e/features/auth/signup.feature             (create T4)
cypress/e2e/features/catalog/browse-products.feature (create T5)
cypress/e2e/features/cart/add-to-cart.feature        (create T6)
cypress/e2e/features/cart/checkout.feature           (create T7)
cypress/e2e/features/contact/contact.feature         (create T8)
cypress/fixtures/products.json       (create T6 — no secrets)
README.md                            (modify T9)

DELETED in T1:
  cypress/e2e/predefined.feature, searchEngines.feature, shopping.feature, demoBlaze.feature
  cypress/support/step_definitions/Predefined_Steps.js, Demoblaze_Steps.js, Hooks.js
  cypress/support/page-object/demoblaze_PO.js
  cypress/fixtures/demoblaze.json
```

> **Spec deviation (intentional):** the spec listed `fixtures/users.json` for invalid-login data. That data now lives in the `login.feature` `Scenario Outline` Examples table (the idiomatic BDD home for it), so `users.json` is not created. Fixture usage is demonstrated via `products.json`; the factory pattern via `userFactory.ts`.

---

### Task 1: Project foundation — Cypress 15, TypeScript, lint/format, env, cleanup

Clears the legacy deck and stands up a healthy TypeScript toolchain. Deliverable: `type-check`, `lint`, `check:no-hard-waits` all pass and `cypress verify` succeeds. (No specs run yet — features arrive in Task 2.)

**Files:**
- Modify: `package.json`, `tsconfig.json`, `cypress.config.ts`, `.gitignore`
- Create: `eslint.config.mjs`, `.prettierrc`, `cypress.env.example.json`, `cypress.env.json` (local), `cypress/support/e2e.ts`, `cypress/support/commands.ts`, `cypress/support/index.d.ts`, `cypress/support/step_definitions/hooks.ts`
- Delete: all four legacy `.feature` files, `Predefined_Steps.js`, `Demoblaze_Steps.js`, `Hooks.js`, `page-object/demoblaze_PO.js`, `fixtures/demoblaze.json`, `cypress/support/e2e.js`, `cypress/support/commands.js`

**Interfaces:**
- Produces: a working `npm run type-check` / `lint` / `check:no-hard-waits` / `cy:run` / `cy:run:smoke` script set; `baseUrl = https://www.demoblaze.com`; `Cypress.env('DEMOBLAZE_USER' | 'DEMOBLAZE_PASS')`.

- [ ] **Step 1: Delete legacy files**

```bash
git rm cypress/e2e/predefined.feature cypress/e2e/searchEngines.feature \
       cypress/e2e/shopping.feature cypress/e2e/demoBlaze.feature \
       cypress/support/step_definitions/Predefined_Steps.js \
       cypress/support/step_definitions/Demoblaze_Steps.js \
       cypress/support/step_definitions/Hooks.js \
       cypress/support/page-object/demoblaze_PO.js \
       cypress/fixtures/demoblaze.json \
       cypress/support/e2e.js cypress/support/commands.js
```

- [ ] **Step 2: Rewrite `package.json`** (scripts + devDependencies + stepDefinitions glob)

```json
{
  "name": "kiparis_framework",
  "version": "15.0.0",
  "description": "Senior/SDET-grade Cypress + TypeScript BDD framework (Demoblaze)",
  "main": "index.js",
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:smoke": "cypress run --env tags=@smoke",
    "lint": "eslint .",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "check:no-hard-waits": "! grep -rnE 'cy\\.wait\\(\\s*[0-9]' cypress --include=*.ts",
    "report": "node cucumber-html-report.js"
  },
  "author": "Ozzy Inatullaev",
  "license": "ISC",
  "devDependencies": {
    "@badeball/cypress-cucumber-preprocessor": "^22.0.1",
    "@bahmutov/cypress-esbuild-preprocessor": "^2.2.4",
    "cucumber-html-reporter": "^7.0.0",
    "cypress": "^15.0.0",
    "cypress-cucumber-attach-screenshots-to-failed-steps": "^1.0.0",
    "eslint": "^9.13.0",
    "eslint-plugin-cypress": "^4.1.0",
    "prettier": "^3.3.3",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8.10.0"
  },
  "cypress-cucumber-preprocessor": {
    "stepDefinitions": "cypress/support/step_definitions/**/*.{js,ts}",
    "filterSpecs": true,
    "omitFiltered": true,
    "html": {
      "enabled": true,
      "output": "cypress/reports/cucumber/cucumber-html/cucumber-report.html"
    },
    "messages": {
      "enabled": true,
      "output": "cypress/reports/cucumber/cucumber-ndjson/cucumber-report.ndjson"
    },
    "json": {
      "enabled": true,
      "formatter": "cucumber-json-formatter",
      "output": "cypress/reports/cucumber/cucumber-json/cucumber-report.json"
    }
  }
}
```

- [ ] **Step 3: Rewrite `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "types": ["cypress", "node"],
    "paths": {
      "@badeball/cypress-cucumber-preprocessor/*": [
        "./node_modules/@badeball/cypress-cucumber-preprocessor/dist/subpath-entrypoints/*"
      ]
    }
  },
  "include": ["cypress/**/*.ts", "cypress.config.ts"]
}
```

- [ ] **Step 4: Add `baseUrl` to `cypress.config.ts`** (insert into the `e2e` block, keep existing `setupNodeEvents`)

```ts
  e2e: {
    baseUrl: "https://www.demoblaze.com",
    numTestsKeptInMemory: 10,
    specPattern: "**/*.feature",
    async setupNodeEvents(
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import cypress from "eslint-plugin-cypress/flat";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "cypress/reports",
      "cypress/videos",
      "cypress/screenshots",
      "cucumber-html-report.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  cypress.configs.recommended,
);
```

- [ ] **Step 6: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 7: Update `.gitignore`** (final contents)

```
node_modules
screenshots
videos
reports
cypress/screenshots
cypress/videos
cypress/reports
cypress.env.json
.playwright-mcp
```

- [ ] **Step 8: Create `cypress.env.example.json`**

```json
{
  "DEMOBLAZE_USER": "your_demoblaze_username",
  "DEMOBLAZE_PASS": "your_demoblaze_password"
}
```

- [ ] **Step 9: Create `cypress.env.json` locally** (gitignored; use a real account you create once on demoblaze.com)

```json
{
  "DEMOBLAZE_USER": "kiparis_demo_user",
  "DEMOBLAZE_PASS": "Passw0rd!"
}
```

- [ ] **Step 10: Create `cypress/support/e2e.ts`**

```ts
import "./commands";
import "cypress-cucumber-attach-screenshots-to-failed-steps";
```

- [ ] **Step 11: Create `cypress/support/commands.ts`** (placeholder; custom command added in Task 9)

```ts
/// <reference types="cypress" />
export {};
```

- [ ] **Step 12: Create `cypress/support/index.d.ts`** (placeholder; populated in Task 9)

```ts
export {};
```

- [ ] **Step 13: Create `cypress/support/step_definitions/hooks.ts`**

```ts
import { After, Before } from "@badeball/cypress-cucumber-preprocessor";

Before(() => {
  cy.log("Scenario start");
});

After(() => {
  cy.log("Scenario end");
});
```

- [ ] **Step 14: Install dependencies**

Run: `npm install`
Expected: completes; `npx cypress --version` reports Cypress 15.x.

- [ ] **Step 15: Verify toolchain**

Run: `npm run type-check && npm run lint && npm run check:no-hard-waits && npx cypress verify`
Expected: type-check prints nothing (exit 0); lint reports no errors; no-hard-waits prints nothing (exit 0); `cypress verify` prints "Verified Cypress!".

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "chore: migrate to Cypress 15 + TypeScript foundation, remove legacy live-site specs"
```

---

### Task 2: BasePage + HomePage + storefront smoke feature

First running spec. Establishes the POM base, navbar actions, and the home product listing.

**Files:**
- Create: `cypress/support/pages/BasePage.ts`, `cypress/support/pages/HomePage.ts`, `cypress/support/step_definitions/common.steps.ts`, `cypress/e2e/features/catalog/home.feature`

**Interfaces:**
- Produces:
  - `BasePage` (abstract): `visit(path?)`, `openLogin()`, `openSignup()`, `openCart()`, `openContact()`, `logout()`, `welcomeLabel(): Chainable`
  - `HomePage extends BasePage`: `visitStore(): void`, `productCards(): Chainable`
  - Step: `Given I am on the Demoblaze store`, `Then I should see products listed`

- [ ] **Step 1: Write the feature** `cypress/e2e/features/catalog/home.feature`

```gherkin
@catalog
Feature: Storefront

  @smoke
  Scenario: The product catalog is displayed on the home page
    Given I am on the Demoblaze store
    Then I should see products listed
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/catalog/home.feature"`
Expected: FAIL — "Step implementation missing for: I am on the Demoblaze store".

- [ ] **Step 3: Create `cypress/support/pages/BasePage.ts`**

```ts
/// <reference types="cypress" />

export abstract class BasePage {
  visit(path = "/"): void {
    cy.visit(path);
  }

  openLogin(): void {
    cy.get("#login2").click();
  }

  openSignup(): void {
    cy.get("#signin2").click();
  }

  openCart(): void {
    cy.get("#cartur").click();
  }

  openContact(): void {
    cy.contains(".nav-link", "Contact").click();
  }

  logout(): void {
    cy.get("#logout2").click();
  }

  welcomeLabel(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#nameofuser");
  }
}
```

- [ ] **Step 4: Create `cypress/support/pages/HomePage.ts`**

```ts
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  private static readonly CARD = ".card";

  visitStore(): void {
    this.visit("/");
    this.productCards().should("have.length.greaterThan", 0);
  }

  productCards(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(HomePage.CARD);
  }
}
```

- [ ] **Step 5: Create `cypress/support/step_definitions/common.steps.ts`**

```ts
import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { HomePage } from "../pages/HomePage";

const home = new HomePage();

Given("I am on the Demoblaze store", () => {
  home.visitStore();
});

Then("I should see products listed", () => {
  home.productCards().should("have.length.greaterThan", 0);
});
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/catalog/home.feature"`
Expected: PASS (1 passing).

- [ ] **Step 7: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add BasePage, HomePage, and storefront smoke feature"
```

---

### Task 3: Login (valid, logout, invalid via Scenario Outline)

**Files:**
- Create: `cypress/support/pages/LoginModal.ts`, `cypress/support/step_definitions/auth.steps.ts`, `cypress/e2e/features/auth/login.feature`

**Interfaces:**
- Consumes: `HomePage` (`welcomeLabel`, navbar `logout`).
- Produces:
  - `LoginModal extends BasePage`: `login(username: string, password: string): void`
  - Steps: `When I log in with valid credentials`, `Then I should be logged in`, `When I log out`, `Then I should be logged out`, `When I log in with username {string} and password {string}`, `When I log in as the registered user with password {string}`, `Then I should see the login error {string}`

> **Setup prerequisite:** the `DEMOBLAZE_USER`/`DEMOBLAZE_PASS` account in `cypress.env.json` must exist on demoblaze.com. Create it once via the site UI (or run Task 4's signup once with those values).

- [ ] **Step 1: Write the feature** `cypress/e2e/features/auth/login.feature`

```gherkin
@auth
Feature: Account login

  @smoke
  Scenario: A registered customer logs in successfully
    Given I am on the Demoblaze store
    When I log in with valid credentials
    Then I should be logged in

  Scenario: A logged-in customer can log out
    Given I am on the Demoblaze store
    When I log in with valid credentials
    And I log out
    Then I should be logged out

  Scenario: Login is rejected for a wrong password
    Given I am on the Demoblaze store
    When I log in as the registered user with password "definitely-wrong"
    Then I should see the login error "Wrong password."

  Scenario Outline: Login is rejected for unknown users
    Given I am on the Demoblaze store
    When I log in with username "<username>" and password "<password>"
    Then I should see the login error "User does not exist."

    Examples:
      | username             | password |
      | no_such_user_846213  | secret   |
      | another_ghost_user_x | secret   |
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/auth/login.feature"`
Expected: FAIL — "Step implementation missing for: I log in with valid credentials".

- [ ] **Step 3: Create `cypress/support/pages/LoginModal.ts`**

```ts
import { BasePage } from "./BasePage";

export class LoginModal extends BasePage {
  login(username: string, password: string): void {
    this.openLogin();
    cy.get("#logInModal").should("be.visible");
    cy.get("#loginusername").clear().type(username);
    cy.get("#loginpassword").clear().type(password);
    cy.get("#logInModal .btn-primary").click();
  }
}
```

- [ ] **Step 4: Create `cypress/support/step_definitions/auth.steps.ts`**

```ts
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { HomePage } from "../pages/HomePage";
import { LoginModal } from "../pages/LoginModal";

const home = new HomePage();
const loginModal = new LoginModal();

When("I log in with valid credentials", () => {
  loginModal.login(Cypress.env("DEMOBLAZE_USER"), Cypress.env("DEMOBLAZE_PASS"));
});

Then("I should be logged in", () => {
  home.welcomeLabel().should("contain.text", Cypress.env("DEMOBLAZE_USER"));
});

When("I log out", () => {
  home.logout();
});

Then("I should be logged out", () => {
  cy.get("#login2").should("be.visible");
});

When("I log in with username {string} and password {string}", (username: string, password: string) => {
  cy.on("window:alert", cy.stub().as("alert"));
  loginModal.login(username, password);
});

When("I log in as the registered user with password {string}", (password: string) => {
  cy.on("window:alert", cy.stub().as("alert"));
  loginModal.login(Cypress.env("DEMOBLAZE_USER"), password);
});

Then("I should see the login error {string}", (message: string) => {
  cy.get("@alert").should("have.been.calledWith", message);
});
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/auth/login.feature"`
Expected: PASS (4 passing — valid login, logout, wrong password, and the 2-example outline counts as scenarios).

- [ ] **Step 6: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add login modal page object and login/logout BDD scenarios"
```

---

### Task 4: Signup with a unique-user factory

**Files:**
- Create: `cypress/support/pages/SignupModal.ts`, `cypress/support/factories/userFactory.ts`, `cypress/e2e/features/auth/signup.feature`
- Modify: `cypress/support/step_definitions/auth.steps.ts` (add signup steps)

**Interfaces:**
- Produces:
  - `userFactory.ts`: `interface TestUser { username: string; password: string }`, `createUniqueUser(): TestUser`
  - `SignupModal extends BasePage`: `signup(username: string, password: string): void`
  - Steps: `When I sign up as a new unique user`, `Then I should see the signup confirmation`

- [ ] **Step 1: Write the feature** `cypress/e2e/features/auth/signup.feature`

```gherkin
@auth
Feature: Account signup

  @smoke
  Scenario: A new visitor can create an account
    Given I am on the Demoblaze store
    When I sign up as a new unique user
    Then I should see the signup confirmation
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/auth/signup.feature"`
Expected: FAIL — "Step implementation missing for: I sign up as a new unique user".

- [ ] **Step 3: Create `cypress/support/factories/userFactory.ts`**

```ts
export interface TestUser {
  username: string;
  password: string;
}

export function createUniqueUser(): TestUser {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    username: `kiparis_${suffix}`,
    password: "Passw0rd!",
  };
}
```

- [ ] **Step 4: Create `cypress/support/pages/SignupModal.ts`**

```ts
import { BasePage } from "./BasePage";

export class SignupModal extends BasePage {
  signup(username: string, password: string): void {
    this.openSignup();
    cy.get("#signInModal").should("be.visible");
    cy.get("#sign-username").clear().type(username);
    cy.get("#sign-password").clear().type(password);
    cy.get("#signInModal .btn-primary").click();
  }
}
```

- [ ] **Step 5: Append signup steps to `cypress/support/step_definitions/auth.steps.ts`**

```ts
import { createUniqueUser } from "../factories/userFactory";
import { SignupModal } from "../pages/SignupModal";

const signupModal = new SignupModal();

When("I sign up as a new unique user", () => {
  cy.on("window:alert", cy.stub().as("alert"));
  const user = createUniqueUser();
  signupModal.signup(user.username, user.password);
});

Then("I should see the signup confirmation", () => {
  cy.get("@alert").should("have.been.calledWith", "Sign up successful.");
});
```

(Add the two `import` lines to the existing import block at the top; keep the `When`/`Then` already imported from Task 3.)

- [ ] **Step 6: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/auth/signup.feature"`
Expected: PASS (1 passing).

- [ ] **Step 7: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add signup page object, unique-user factory, and signup scenario"
```

---

### Task 5: Browse the catalog (category filter, product detail, pagination)

**Files:**
- Create: `cypress/support/pages/ProductPage.ts`, `cypress/support/step_definitions/catalog.steps.ts`, `cypress/e2e/features/catalog/browse-products.feature`
- Modify: `cypress/support/pages/HomePage.ts` (add browse methods)

**Interfaces:**
- Consumes: `HomePage` (`productCards`).
- Produces:
  - `HomePage` adds: `filterByCategory(category: string): void`, `openProduct(name: string): void`, `goToNextPage(): void`, `categoryProductTitles(): Chainable`
  - `ProductPage extends BasePage`: `productTitle(): Chainable`
  - Steps: `When I filter products by {string}`, `Then I should see the product {string}`, `Then I should not see the product {string}`, `When I open the product {string}`, `Then the product detail page shows {string}`, `When I go to the next page of products`

- [ ] **Step 1: Write the feature** `cypress/e2e/features/catalog/browse-products.feature`

```gherkin
@catalog
Feature: Browse the product catalog

  @smoke
  Scenario: Filtering by a category shows matching products
    Given I am on the Demoblaze store
    When I filter products by "Phones"
    Then I should see the product "Samsung galaxy s6"

  Scenario: Switching categories changes the products shown
    Given I am on the Demoblaze store
    When I filter products by "Laptops"
    Then I should not see the product "Samsung galaxy s6"

  Scenario: Opening a product shows its detail page
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    Then the product detail page shows "Samsung galaxy s6"

  Scenario: Customers can page through the catalog
    Given I am on the Demoblaze store
    When I go to the next page of products
    Then I should see products listed
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/catalog/browse-products.feature"`
Expected: FAIL — "Step implementation missing for: I filter products by ...".

- [ ] **Step 3: Extend `cypress/support/pages/HomePage.ts`** (add methods inside the class)

```ts
  private static readonly CATEGORY = ".list-group .list-group-item";

  filterByCategory(category: string): void {
    cy.intercept("**/bycat").as("bycat");
    cy.contains(HomePage.CATEGORY, category).click();
    cy.wait("@bycat");
  }

  openProduct(name: string): void {
    cy.contains(".card-title a", name).click();
  }

  goToNextPage(): void {
    cy.get("#next2").click();
  }

  categoryProductTitles(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(".card-title");
  }
```

- [ ] **Step 4: Create `cypress/support/pages/ProductPage.ts`**

```ts
import { BasePage } from "./BasePage";

export class ProductPage extends BasePage {
  productTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(".name");
  }
}
```

- [ ] **Step 5: Create `cypress/support/step_definitions/catalog.steps.ts`**

```ts
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { HomePage } from "../pages/HomePage";
import { ProductPage } from "../pages/ProductPage";

const home = new HomePage();
const productPage = new ProductPage();

When("I filter products by {string}", (category: string) => {
  home.filterByCategory(category);
});

Then("I should see the product {string}", (name: string) => {
  home.categoryProductTitles().should("contain.text", name);
});

Then("I should not see the product {string}", (name: string) => {
  home.categoryProductTitles().should("exist").and("not.contain.text", name);
});

When("I open the product {string}", (name: string) => {
  home.openProduct(name);
});

Then("the product detail page shows {string}", (name: string) => {
  productPage.productTitle().should("contain.text", name);
});

When("I go to the next page of products", () => {
  home.goToNextPage();
});
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/catalog/browse-products.feature"`
Expected: PASS (4 passing).

- [ ] **Step 7: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add catalog browsing — category filter, product detail, pagination"
```

---

### Task 6: Add to cart (native alert handling + fixture-driven price)

**Files:**
- Create: `cypress/support/pages/CartPage.ts`, `cypress/support/step_definitions/cart.steps.ts`, `cypress/e2e/features/cart/add-to-cart.feature`, `cypress/fixtures/products.json`
- Modify: `cypress/support/pages/ProductPage.ts` (add `addToCart`)

**Interfaces:**
- Consumes: `HomePage.openProduct`, `ProductPage`.
- Produces:
  - `ProductPage` adds: `addToCart(): void`
  - `CartPage extends BasePage`: `open(): void`, `rows(): Chainable`, `total(): Chainable`, `placeOrder(): void`
  - Steps: `When I add the product to my cart`, `When I view my cart`, `Then my cart should contain {string}`, `Then my cart total should match the price of {string}`

- [ ] **Step 1: Create the fixture** `cypress/fixtures/products.json`

```json
{
  "Samsung galaxy s6": { "price": "360", "category": "Phones" }
}
```

- [ ] **Step 2: Write the feature** `cypress/e2e/features/cart/add-to-cart.feature`

```gherkin
@cart
Feature: Shopping cart

  @smoke
  Scenario: A customer adds a product to the cart
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    And I add the product to my cart
    And I view my cart
    Then my cart should contain "Samsung galaxy s6"
    And my cart total should match the price of "Samsung galaxy s6"
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/cart/add-to-cart.feature"`
Expected: FAIL — "Step implementation missing for: I add the product to my cart".

- [ ] **Step 4: Extend `cypress/support/pages/ProductPage.ts`** (add method inside the class)

```ts
  addToCart(): void {
    cy.get("a.btn-success").click(); // fires native alert "Product added."
  }
```

- [ ] **Step 5: Create `cypress/support/pages/CartPage.ts`**

```ts
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  open(): void {
    this.openCart();
    cy.url().should("include", "/cart.html");
  }

  rows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#tbodyid tr");
  }

  total(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#totalp");
  }

  placeOrder(): void {
    cy.get('button[data-target="#orderModal"]').click();
  }
}
```

- [ ] **Step 6: Create `cypress/support/step_definitions/cart.steps.ts`**

```ts
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";

const productPage = new ProductPage();
const cartPage = new CartPage();

When("I add the product to my cart", () => {
  cy.on("window:alert", cy.stub().as("alert"));
  productPage.addToCart();
  cy.get("@alert").should("have.been.calledWith", "Product added.");
});

When("I view my cart", () => {
  cartPage.open();
});

Then("my cart should contain {string}", (name: string) => {
  cartPage.rows().should("contain.text", name);
});

Then("my cart total should match the price of {string}", (name: string) => {
  cy.fixture("products").then((products: Record<string, { price: string }>) => {
    cartPage.total().should("contain.text", products[name].price);
  });
});
```

- [ ] **Step 7: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/cart/add-to-cart.feature"`
Expected: PASS (1 passing).

- [ ] **Step 8: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add cart page object and add-to-cart scenario with alert handling"
```

---

### Task 7: Checkout (place order + SweetAlert confirmation)

**Files:**
- Create: `cypress/support/pages/PlaceOrderModal.ts`, `cypress/e2e/features/cart/checkout.feature`
- Modify: `cypress/support/step_definitions/cart.steps.ts` (add checkout steps)

**Interfaces:**
- Consumes: `HomePage.openProduct`, `ProductPage.addToCart`, `CartPage` (`open`, `placeOrder`).
- Produces:
  - `interface OrderDetails { name; country; city; card; month; year }` (all `string`)
  - `PlaceOrderModal extends BasePage`: `fillAndPurchase(order: OrderDetails): void`, `confirmation(): Chainable`
  - Steps: `When I place an order with valid payment details`, `Then I should see an order confirmation`

- [ ] **Step 1: Write the feature** `cypress/e2e/features/cart/checkout.feature`

```gherkin
@cart
Feature: Checkout

  @smoke
  Scenario: A customer places an order
    Given I am on the Demoblaze store
    When I open the product "Samsung galaxy s6"
    And I add the product to my cart
    And I view my cart
    And I place an order with valid payment details
    Then I should see an order confirmation
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/cart/checkout.feature"`
Expected: FAIL — "Step implementation missing for: I place an order with valid payment details".

- [ ] **Step 3: Create `cypress/support/pages/PlaceOrderModal.ts`**

```ts
import { BasePage } from "./BasePage";

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
    cy.get("#orderModal").should("be.visible");
    cy.get("#name").type(order.name);
    cy.get("#country").type(order.country);
    cy.get("#city").type(order.city);
    cy.get("#card").type(order.card);
    cy.get("#month").type(order.month);
    cy.get("#year").type(order.year);
    cy.get("#orderModal .btn-primary").click();
  }

  confirmation(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(".sweet-alert");
  }
}
```

- [ ] **Step 4: Append checkout steps to `cypress/support/step_definitions/cart.steps.ts`**

```ts
import { PlaceOrderModal } from "../pages/PlaceOrderModal";

const placeOrderModal = new PlaceOrderModal();

When("I place an order with valid payment details", () => {
  cartPage.placeOrder();
  placeOrderModal.fillAndPurchase({
    name: "Jane Doe",
    country: "USA",
    city: "Seattle",
    card: "4111111111111111",
    month: "12",
    year: "2027",
  });
});

Then("I should see an order confirmation", () => {
  placeOrderModal.confirmation().should("be.visible").and("contain.text", "Thank you for your purchase!");
});
```

(Add the `import` to the top block; `When`/`Then`/`cartPage` already exist from Task 6.)

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/cart/checkout.feature"`
Expected: PASS (1 passing).

- [ ] **Step 6: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add checkout flow with place-order modal and confirmation"
```

---

### Task 8: Contact form

**Files:**
- Create: `cypress/support/pages/ContactModal.ts`, `cypress/support/step_definitions/contact.steps.ts`, `cypress/e2e/features/contact/contact.feature`

**Interfaces:**
- Produces:
  - `ContactModal extends BasePage`: `sendMessage(email: string, name: string, message: string): void`
  - Steps: `When I send a contact message`, `Then I should see the contact confirmation`

- [ ] **Step 1: Write the feature** `cypress/e2e/features/contact/contact.feature`

```gherkin
@contact
Feature: Contact form

  Scenario: A visitor sends a contact message
    Given I am on the Demoblaze store
    When I send a contact message
    Then I should see the contact confirmation
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx cypress run --spec "cypress/e2e/features/contact/contact.feature"`
Expected: FAIL — "Step implementation missing for: I send a contact message".

- [ ] **Step 3: Create `cypress/support/pages/ContactModal.ts`**

```ts
import { BasePage } from "./BasePage";

export class ContactModal extends BasePage {
  sendMessage(email: string, name: string, message: string): void {
    this.openContact();
    cy.get("#exampleModal").should("be.visible");
    cy.get("#recipient-email").type(email);
    cy.get("#recipient-name").type(name);
    cy.get("#message-text").type(message);
    cy.get("#exampleModal .btn-primary").click();
  }
}
```

- [ ] **Step 4: Create `cypress/support/step_definitions/contact.steps.ts`**

```ts
import { Then, When } from "@badeball/cypress-cucumber-preprocessor";
import { ContactModal } from "../pages/ContactModal";

const contactModal = new ContactModal();

When("I send a contact message", () => {
  cy.on("window:alert", cy.stub().as("alert"));
  contactModal.sendMessage("jane@example.com", "Jane Doe", "Hello, I have a question.");
});

Then("I should see the contact confirmation", () => {
  cy.get("@alert").should("have.been.calledWith", "Thanks for the message!!");
});
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/contact/contact.feature"`
Expected: PASS (1 passing).

- [ ] **Step 6: Type-check, lint, commit**

```bash
npm run type-check && npm run lint
git add -A
git commit -m "feat: add contact-form page object and scenario"
```

---

### Task 9: Custom command, full-suite verification, README

Adds the typed `cy.loginViaUI` custom command (with a smoke test exercising it), then verifies the entire suite and rewrites the README.

**Files:**
- Modify: `cypress/support/commands.ts`, `cypress/support/index.d.ts`, `README.md`
- Create: `cypress/e2e/features/auth/login-command.feature`

**Interfaces:**
- Produces: `cy.loginViaUI(username: string, password: string): Chainable<void>`

- [ ] **Step 1: Implement the custom command in `cypress/support/commands.ts`**

```ts
/// <reference types="cypress" />

Cypress.Commands.add("loginViaUI", (username: string, password: string) => {
  cy.get("#login2").click();
  cy.get("#logInModal").should("be.visible");
  cy.get("#loginusername").clear().type(username);
  cy.get("#loginpassword").clear().type(password);
  cy.get("#logInModal .btn-primary").click();
  cy.get("#nameofuser").should("contain.text", username);
});

export {};
```

- [ ] **Step 2: Declare the command type in `cypress/support/index.d.ts`**

```ts
declare global {
  namespace Cypress {
    interface Chainable {
      /** Log in through the UI and assert the welcome label shows the username. */
      loginViaUI(username: string, password: string): Chainable<void>;
    }
  }
}

export {};
```

- [ ] **Step 3: Write a feature that exercises the command** `cypress/e2e/features/auth/login-command.feature`

```gherkin
@auth
Feature: Reusable login command

  Scenario: The custom login command authenticates a customer
    Given I am logged in via the login command
    Then I should be logged in
```

- [ ] **Step 4: Add the step to `cypress/support/step_definitions/auth.steps.ts`**

```ts
import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("I am logged in via the login command", () => {
  home.visitStore();
  cy.loginViaUI(Cypress.env("DEMOBLAZE_USER"), Cypress.env("DEMOBLAZE_PASS"));
});
```

(Add `Given` to the existing import from `@badeball/...`; `home` already exists from Task 3.)

- [ ] **Step 5: Run the new feature to confirm it passes**

Run: `npx cypress run --spec "cypress/e2e/features/auth/login-command.feature"`
Expected: PASS (1 passing).

- [ ] **Step 6: Run the full suite and the smoke subset**

Run: `npm run cy:run`
Expected: all feature files pass (0 failing).

Run: `npm run cy:run:smoke`
Expected: only `@smoke`-tagged scenarios run, all passing.

- [ ] **Step 7: Run all quality gates**

Run: `npm run type-check && npm run lint && npm run check:no-hard-waits`
Expected: all exit 0 with no errors.

- [ ] **Step 8: Rewrite `README.md`**

Replace the README body with sections covering: project summary; the four-layer architecture (features → steps → page objects → commands) and why selectors live only in page objects; folder structure; prerequisites (Node 20+, create a Demoblaze account); setup (`npm install`, copy `cypress.env.example.json` → `cypress.env.json` and fill credentials); how to run (`cy:open`, `cy:run`, `cy:run:smoke`, `lint`, `type-check`, `report`); a short **"When BDD earns its keep"** note explaining that declarative Gherkin pays off with real cross-role collaboration and that selectors are deliberately kept out of features; and a **Roadmap** section listing Phases 3–5 (API layer, CI/CD, a11y/visual/docs).

```markdown
# Kiparis Framework

A Cypress 15 + TypeScript UI automation framework using declarative BDD
(Cucumber/Gherkin) against the Demoblaze demo store. Built to demonstrate
senior-level test architecture: clean layering, resilient locators, no hard
waits, and secrets kept out of source control.

## Architecture

Features (behavior) → step definitions (glue) → page objects (the only place
selectors live) → custom commands (low-level helpers). Change a selector and you
touch exactly one page object; change wording and you touch exactly one feature.

## Prerequisites

- Node.js 20+
- A Demoblaze account (create one once at https://www.demoblaze.com — Sign up)

## Setup

```bash
npm install
cp cypress.env.example.json cypress.env.json   # then fill in your credentials
```

## Running

- `npm run cy:open` — interactive runner
- `npm run cy:run` — full headless suite
- `npm run cy:run:smoke` — `@smoke` subset
- `npm run lint` / `npm run type-check` / `npm run check:no-hard-waits`
- `npm run report` — generate the Cucumber HTML report

## When BDD earns its keep

Declarative Gherkin pays off when product, QA, and engineering collaborate on
behavior. Selectors are deliberately kept out of features so scenarios read as
behavior and survive UI changes. In a solo project the value is mostly
demonstrative — which is why steps stay strictly declarative.

## Roadmap

- Phase 3 — API testing layer against `api.demoblaze.com`
- Phase 4 — GitHub Actions CI/CD, parallel sharding, merged reporting
- Phase 5 — accessibility (`cypress-axe`), visual regression, architecture docs
```

- [ ] **Step 9: Final commit**

```bash
npm run type-check && npm run lint && npm run check:no-hard-waits
git add -A
git commit -m "feat: add reusable login command, full-suite verification, and README overhaul"
```

---

## Plan self-review

**Spec coverage:**
- TypeScript migration → Task 1. Cypress 15 → Task 1. ESLint/Prettier → Task 1. Clean folder layout → all tasks. Typed custom command → Task 9.
- Declarative Gherkin, selectors only in page objects → enforced as a Global Constraint, realized Tasks 2–9.
- Robust POM (Home/Product/Cart/Login/Signup/PlaceOrder/Contact) → Tasks 2–8.
- Data-driven login `Scenario Outline` → Task 3. Signup factory → Task 4. Fixtures → Task 6 (`products.json`).
- `cy.intercept` instead of hard waits → Task 5 (category) + `check:no-hard-waits` gate. Alert/SweetAlert handling → Tasks 3, 6, 7, 8.
- Secrets out of fixtures into gitignored env → Task 1.
- Cleanup (delete live-site/imperative/broken specs, repoint `@smoke`, remove `predefined-*` scripts) → Task 1.
- Verification / definition of done → Task 9 (full suite + smoke + lint + type-check + no-hard-waits + README).
- Roadmap (Phases 3–5 deferred) → README, Task 9.

**Placeholder scan:** No "TBD/TODO". `commands.ts`/`index.d.ts` are created minimal in Task 1 and intentionally completed in Task 9 (called out explicitly), not placeholders.

**Type consistency:** `BasePage` API (`openLogin/openSignup/openCart/openContact/logout/welcomeLabel/visit`) is used consistently by all subclasses. `HomePage.openProduct` is produced in Task 5 and consumed in Tasks 6–7. `ProductPage.addToCart` produced in Task 6, consumed in Task 7. `CartPage` methods (`open/rows/total/placeOrder`) consistent across Tasks 6–7. `OrderDetails` fields match `PlaceOrderModal.fillAndPurchase` usage. The `@alert` stub alias pattern is identical across auth/cart/contact steps.

**Known runtime caveat:** Demoblaze is a shared public demo whose backend can be briefly slow/unavailable; web-first assertions absorb normal latency. If `api.demoblaze.com` is down, suite runs will fail for environmental reasons — re-run. This is documented in the spec's risks section and is the motivation for the Phase 3 API layer and Phase 4 retries.
```
