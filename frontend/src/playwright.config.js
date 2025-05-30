// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './src/tests/selenium', // Correct path
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // Run tests one by one for debugging
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        channel: 'chrome',
        headless: false, // Show browser
        slowMo: 1000,    // Slow down actions
      },
    },
  ],
});