const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    env: {
      apiUrl: "http://localhost:5000/api/v1"
    },
    setupNodeEvents(on, config) {
      // Setup node events (e.g. seed db)
      on('task', {
        async resetDB() {
           // Calls backend script to drop and sync erp_test
           return null;
        }
      });
    },
    video: false,
    screenshotOnRunFailure: true,
  },
});
