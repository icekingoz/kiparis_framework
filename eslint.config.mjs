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
