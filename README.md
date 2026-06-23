# Kiparis Framework

A **Cypress 15 + TypeScript** UI automation framework using declarative BDD
(Cucumber/Gherkin) against the [Demoblaze](https://www.demoblaze.com) demo store.
Built to demonstrate senior-level test architecture: clean layering, resilient
locators, no hard waits, and secrets kept out of source control.

## Architecture

Four isolated layers, each with one responsibility:

1. **Features** (`cypress/e2e/features/**/*.feature`) — behavior in business
   language. No selectors, no mechanics.
2. **Step definitions** (`cypress/support/step_definitions/*.steps.ts`) — thin glue
   translating steps into page-object calls plus assertions.
3. **Page objects** (`cypress/support/pages/*.ts`) — the **only** place selectors
   live. Intent methods (`login`, `addToCart`) and element getters.
4. **Custom commands** (`cypress/support/commands.ts`) — reusable shortcuts such as
   `cy.loginViaUI`, which delegates to the page objects.

Change a selector → touch one page object. Change wording → touch one feature.

## Folder structure

```
cypress/
  e2e/features/        auth/  catalog/  cart/  contact/   (*.feature)
  support/
    pages/             BasePage, HomePage, ProductPage, CartPage,
                       LoginModal, SignupModal, PlaceOrderModal, ContactModal
    step_definitions/  auth / catalog / cart / contact / common .steps.ts, hooks.ts
    factories/         userFactory.ts
    commands.ts  e2e.ts  index.d.ts
  fixtures/            products.json
cypress.config.ts  tsconfig.json  eslint.config.mjs  .prettierrc
cypress.env.example.json
```

## Prerequisites

- Node.js 20+
- A Demoblaze account (create one once at https://www.demoblaze.com via **Sign up**)

## Setup

```bash
npm install
cp cypress.env.example.json cypress.env.json   # then fill in your credentials
```

`cypress.env.json` is **gitignored** and holds your Demoblaze username/password,
read in tests via `Cypress.env('DEMOBLAZE_USER' | 'DEMOBLAZE_PASS')`.

## Running

| Command | What it does |
|---------|--------------|
| `npm run cy:open` | Interactive runner |
| `npm run cy:run` | Full headless suite |
| `npm run cy:run:smoke` | `@smoke` subset only |
| `npm run lint` | ESLint (flat config) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run check:no-hard-waits` | Fails if any `cy.wait(<number>)` exists |
| `npm run report` | Generate the Cucumber HTML report |

## Test design choices

- **Resilient locators** — stable IDs (`#login2`, `#cartur`, `#totalp`) and
  text-scoped queries; no devtools-copied CSS paths.
- **No hard waits** — `cy.intercept` aliases + web-first assertions; enforced by
  `npm run check:no-hard-waits`.
- **Retries** — run-mode retries absorb the shared demo's transient latency.
- **Native dialogs** — add-to-cart / signup / contact alerts and the checkout
  SweetAlert are asserted explicitly.
- **Test data** — a data-driven login `Scenario Outline`, a `products.json`
  fixture, and a unique-user factory for signup.

## When BDD earns its keep

Declarative Gherkin pays off when product, QA, and engineering collaborate on
behavior. Selectors are deliberately kept out of features so scenarios read as
behavior and survive UI changes. In a solo project the value is mostly
demonstrative — which is why the steps stay strictly declarative.

## Roadmap

- **Phase 3** — API testing layer against `api.demoblaze.com`
- **Phase 4** — GitHub Actions CI/CD, parallel sharding, merged reporting
- **Phase 5** — accessibility (`cypress-axe`), visual regression, architecture docs
