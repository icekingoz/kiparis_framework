# Kiparis Framework Modernization — Design Spec

- **Date:** 2026-06-22
- **Author:** Ozzy Inatullaev
- **Status:** Approved (design); pending implementation plan
- **Scope of this spec:** Phase 1 + Phase 2 of a 5-phase modernization

---

## 1. Background & motivation

Kiparis is a UI automation framework built on Cypress 13.x with a Cucumber/BDD top
layer, JS step definitions, a Page Object Model, and fixtures. The goal of this work is
to evolve it into a portfolio piece that demonstrates **Senior QA / SDET-level** skills
against **2026 best practices**.

### Current-state assessment

**Strengths to preserve:** a real layered structure (Gherkin → step defs → page object →
fixtures), working Cucumber reporting in three formats, video support, esbuild
preprocessing, and tag-based runs.

**Issues that currently signal "junior":**

- **Imperative Gherkin** — feature steps embed raw CSS/XPath selectors
  (e.g. `I click on element with selector "body > div.L3eUgb > ..."`). This is the single
  biggest tell; BDD should read as behavior, not DOM paths.
- **Tests target uncontrolled live production sites** (Google, Wikipedia, Marc Jacobs,
  Coach, Ferragamo, Cartier, Balenciaga, Chanel) with devtools-copied selectors — flaky,
  non-reproducible, and a recognized red flag.
- **Hard waits** (`cy.wait(15000)`).
- **Broken / empty step definitions** — the `resize…emulate {word}` switch references an
  undefined `value`; iframe/window/tab/alert/hover steps are empty stubs.
- **Plaintext credentials** committed in `cypress/fixtures/demoblaze.json`.
- **Mixed JS/TS** — config is TypeScript, everything else is JavaScript.
- **No CI/CD, no API testing layer, no real custom commands** (`commands.js` is boilerplate).

### 2026 best-practice findings (research-grounded)

- For a modernized Cypress framework, the senior bar is: full TypeScript, declarative BDD,
  resilient locators, no hard waits, secrets hygiene, an API testing layer, CI/CD, and
  polish (a11y, visual, docs).
- **Cucumber without real cross-team collaboration is itself an anti-pattern.** Because this
  is a solo portfolio, the BDD layer must be strictly **declarative** and the README must
  briefly justify when BDD earns its keep. Done this way, it demonstrates that the author
  understands BDD rather than merely wiring up Cucumber.
- Testing a self-owned/controlled app is ideal; a stable, automation-purposed demo site
  that exposes a **real API** is an acceptable pinned target. Demoblaze qualifies (it has a
  REST API at `api.demoblaze.com`).

---

## 2. Foundational decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tooling foundation | **Modernize Cypress 15 + TypeScript** in place | Builds on the framework already owned; demonstrates depth in one tool done at a senior level. |
| BDD layer | **Keep Cucumber — declarative Gherkin**, selectors confined to page objects | Fixes the #1 junior signal while preserving the framework's BDD identity; demonstrates correct BDD judgment. |
| Target application | **Demoblaze** (pinned demo site) | Already partially modeled in the repo; exposes both a UI and a real REST API (`api.demoblaze.com`), enabling a single-app UI + API story. |
| Overall ambition | **All 5 phases**, built incrementally | Strongest portfolio piece; each phase is its own spec → plan → build cycle. |
| This spec | **Phase 1 + Phase 2 together** | Phase 1 alone is plumbing; bundling yields a working, modern suite that demonstrates the new architecture end to end. |

---

## 3. Roadmap (vision — full 5 phases)

| Phase | Sub-project | Delivers |
|------|-------------|----------|
| **1** | Foundation & TypeScript core | Cypress 13→15, JS→TS migration, tsconfig/ESLint/Prettier, delete live-site & broken-stub specs, credentials → gitignored env config, clean folder layout, typed custom commands |
| **2** | Declarative BDD UI suite (Demoblaze) | Robust POM, business-readable Gherkin journeys (login as `Scenario Outline`, signup, add-to-cart, cart mgmt, checkout, contact), resilient locators, `cy.intercept` instead of hard waits, fixtures/factories |
| **3** | API testing layer | Typed API client against `api.demoblaze.com`, API specs (auth/cart/orders), API-driven setup for UI ("thin UI / thick API" trophy) |
| **4** | CI/CD, parallelization & reporting | GitHub Actions (caching, lint gate, sharded matrix, artifacts, merged report, README badge), `retries: 2`, trace/screenshots on failure |
| **5** | Senior polish | Accessibility (`cypress-axe`), visual regression, architecture docs + diagrams, README overhaul |

**Phases 3–5 are out of scope for this spec** and will each get their own spec. This
document fully specifies **Phase 1 + Phase 2**.

---

## 4. Architecture & layering (Phase 1+2)

Four layers, each with one job and a clean boundary:

1. **Features** (`.feature`, Gherkin) — describe behavior in business language. No
   selectors, no mechanics.
2. **Step definitions** (`.ts`) — thin glue translating a step into page-object calls plus
   assertions. No selectors.
3. **Page Objects** (`.ts` classes) — the **only** place selectors live. Expose intent
   methods (`login(user)`, `addProductToCart(name)`) and element getters. No business
   assertions inside.
4. **Custom commands** (`.ts`) — low-level reusable Cypress helpers (e.g. `cy.loginViaUI()`),
   typed via a `.d.ts` augmentation.

**Isolation guarantee:** a selector change touches exactly one page object; a wording change
touches exactly one feature.

### Folder structure

```
cypress/
  e2e/features/
    auth/        login.feature, signup.feature
    catalog/     browse-products.feature
    cart/        add-to-cart.feature, checkout.feature
    contact/     contact.feature
  support/
    step_definitions/   auth.steps.ts, catalog.steps.ts, cart.steps.ts,
                        contact.steps.ts, common.steps.ts, hooks.ts
    pages/              BasePage.ts, HomePage.ts, ProductPage.ts, CartPage.ts,
                        LoginModal.ts, SignupModal.ts, PlaceOrderModal.ts, ContactModal.ts
    factories/          userFactory.ts
    commands.ts, e2e.ts, index.d.ts
  fixtures/             users.json, products.json   (no secrets)
  reports/              (gitignored output)
cypress.config.ts
cypress.env.json          (gitignored — local secrets)
cypress.env.example.json  (committed template)
tsconfig.json  ·  eslint.config.mjs  ·  .prettierrc  ·  package.json  ·  README.md
```

### Tooling baseline

- **Cypress `^15`** + `@badeball/cypress-cucumber-preprocessor` (current, Cypress-15
  compatible) + `@bahmutov/cypress-esbuild-preprocessor`.
- **TypeScript everywhere**, `strict: true`, `tsconfig` with `types: ["cypress","node"]`.
- **ESLint** (typescript-eslint + `eslint-plugin-cypress`) + **Prettier**, both enforced
  (the README promises Prettier today but ships no config).
- **npm scripts:** `cy:open`, `cy:run`, `cy:run:smoke`, `lint`, `format`, `type-check`,
  `report`.

---

## 5. Page Object Model design

One class per page/modal, extending `BasePage` (navbar navigation, shared `visit`,
intercept helpers). Each PO holds selectors privately and exposes intent methods:

```ts
class ProductPage extends BasePage {
  private addBtn = () => cy.contains('a', 'Add to cart');
  addToCart() { this.addBtn().click(); }   // selector lives ONLY here
}
```

**Pages modeled:** `HomePage` (navbar + category sidebar + product grid + pagination),
`ProductPage`, `CartPage` (table + total + Place Order), `LoginModal`, `SignupModal`,
`PlaceOrderModal`, `ContactModal`.

**Locator strategy (documented in `BasePage`):** Demoblaze exposes stable IDs for most
interactive elements (`#login2`, `#loginusername`, `#cartur`, `#totalp`); we lean on those.
For ID-less product cards we scope with `cy.contains('.card', name)`. This is a deliberate,
explained choice rather than copied devtools paths.

**Demoblaze mechanics handled properly (resurrecting the old broken stubs):**

- Add-to-cart fires a native `window:alert` → asserted via `cy.on('window:alert', …)`.
- Place Order confirmation is a SweetAlert → asserted on the DOM.
- **No hard waits** — category/data loads use `cy.intercept(...).as()` + `cy.wait('@alias')`
  and web-first `.should('be.visible')`, never `cy.wait(<number>)`.

---

## 6. Declarative BDD design

**Step library** — small, intent-level, reusable. Representative steps:

- `Given I am on the Demoblaze store`
- `When I log in with username {string} and password {string}`
- `When I add the product {string} to my cart`
- `Then my cart should contain {string}`
- `Then my cart total should be {int}`
- `When I place an order with valid payment details`
- `Then I should see an order confirmation`
- `Then I should see a login error`

**Layering example (selector never leaves the page object):**

```
Feature:  When I add the product "Samsung galaxy s6" to my cart
Step def: When('I add the product {string} to my cart', (name) => {
            homePage.openProduct(name); productPage.addToCart();
          });
PageObj:  ProductPage.addToCart() { cy.contains('a', 'Add to cart').click(); }
```

**Data-driven:** `login.feature` uses a `Scenario Outline` + Examples table covering valid
and invalid credential combinations.

**Step organization:** grouped by domain (`auth.steps.ts`, `cart.steps.ts`, …) mirroring the
feature folders; `common.steps.ts` holds genuinely shared navigation/assertions.

**Tagging:** `@smoke` becomes a curated fast Demoblaze subset; domain tags (`@auth`,
`@cart`, `@regression`) support targeted runs.

### Scenario coverage (Phase 2)

- **auth/login** — valid login; invalid login (wrong password, unknown user) via
  `Scenario Outline`; logout.
- **auth/signup** — register a fresh unique user (factory).
- **catalog/browse-products** — filter by category (Phones/Laptops/Monitors); open a
  product; pagination.
- **cart/add-to-cart** — add product(s); verify cart contents and total.
- **cart/checkout** — place an order with valid payment details; verify confirmation.
- **contact/contact** — submit the contact form.

---

## 7. Test data, config & secrets

**Test data & factories:**

- `fixtures/users.json` — non-secret data (invalid-login combinations, etc.).
- `fixtures/products.json` — product names/prices for data-driven steps.
- `support/factories/userFactory.ts` — generates unique signup users
  (`kiparis_${Date.now()}`) since Demoblaze signup requires unique usernames.

**Account strategy (keeps tests independent and re-runnable):**

- **Signup** tests mint a fresh unique user each run via the factory.
- **Valid-login** tests use a pre-seeded account supplied through env config. Creating that
  account once (via the Demoblaze UI/API) is documented as a one-time setup prerequisite in
  the README.

**Config & secrets (fixes the committed-credentials red flag):**

- Remove the plaintext `billyjoebob/password1` from `demoblaze.json`.
- Secrets live in `cypress.env.json` (**gitignored**), read via
  `Cypress.env('DEMOBLAZE_USER')` / `Cypress.env('DEMOBLAZE_PASS')`.
- Commit `cypress.env.example.json` as a template.
- `baseUrl` moves into `cypress.config.ts`. The same env seam will feed GitHub Actions
  secrets in Phase 4.

---

## 8. Cleanup — what gets removed or rewritten

- **Delete** `shopping.feature` (live luxury sites), `searchEngines.feature` (live engines),
  `predefined.feature` (imperative Google/Wikipedia) — all hit uncontrolled production sites.
- **Delete/replace** `Predefined_Steps.js`: the imperative `I click…selector` steps, the
  broken `resize…emulate` switch (undefined `value`), and the empty iframe/window/tab/alert/
  hover stubs. The genuinely useful mechanic (alert handling) is reimplemented in page
  objects.
- **Repoint `@smoke`:** the package.json smoke scripts currently depend on
  `predefined.feature`; they target a curated Demoblaze smoke subset instead. The
  `predefined-headed` / `predefined-headless` scripts are removed with the feature; the new
  script set in §4 supersedes the current scripts.
- **Migrate** every `.js` → `.ts`; the old `demoblaze_PO.js` `loginValid()` becomes typed
  `LoginModal`/`HomePage` flows reading credentials from env.
- Replace the boilerplate `commands.js` with a typed `commands.ts` exposing at least
  `cy.loginViaUI()` plus the type augmentation in `index.d.ts`.

---

## 9. Verification — definition of done (Phase 1+2)

- `npm run type-check` passes (no TypeScript errors).
- `npm run lint` passes.
- `npm run cy:run` — full Demoblaze suite green headless.
- `npm run cy:run:smoke` — curated smoke subset green.
- No hard waits remain (grep / lint check for `cy.wait(<number>)`).
- No secrets in committed files (credentials only in gitignored `cypress.env.json`).
- README updated for the new structure and run instructions.

---

## 10. Risks & open items (resolve during implementation)

- **Peer-version compatibility:** confirm `@badeball/cypress-cucumber-preprocessor` and the
  esbuild preprocessor versions that officially support Cypress 15 before pinning. (Verify
  step in the plan, not an assumption.)
- **Demoblaze stability:** it is a shared public demo; its data resets periodically and the
  backend can be briefly unavailable. Tests must not depend on persisted server state
  between runs (mint/seed data per run).
- **Valid-login seeded account:** depends on a Demoblaze account that persists; document the
  one-time setup and fall back to a signup-then-login flow if the account is lost.
- **Native alert / SweetAlert timing:** validate the `window:alert` and SweetAlert handling
  is reliable headless before broadening cart/checkout coverage.

---

## 11. Out of scope (this spec)

- Phase 3 (API testing layer), Phase 4 (CI/CD, parallelization, reporting beyond existing
  Cucumber HTML), Phase 5 (a11y, visual regression, docs overhaul). Each gets its own spec.
- No new third-party SaaS integrations (e.g. Sauce Labs, BrowserStack, Allure) in this phase.
