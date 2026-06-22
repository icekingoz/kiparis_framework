import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import createEsbuildPlugin from "@badeball/cypress-cucumber-preprocessor/esbuild";

export default defineConfig({
  // FULL HD-ish viewport
  viewportWidth: 1280,
  viewportHeight: 720,
  // Cleans up Downloads, Screenshots and Videos (not reports)
  trashAssetsBeforeRuns: true,
  e2e: {
    baseUrl: "https://www.demoblaze.com",
    numTestsKeptInMemory: 10,
    specPattern: "**/*.feature",
    async setupNodeEvents(
      on: Cypress.PluginEvents,
      config: Cypress.PluginConfigOptions,
    ): Promise<Cypress.PluginConfigOptions> {
      // Required for the preprocessor to generate JSON reports after each run.
      await addCucumberPreprocessorPlugin(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );

      // Return the (possibly modified) config object.
      return config;
    },
  },
});
