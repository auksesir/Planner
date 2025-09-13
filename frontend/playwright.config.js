const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './src/tests/e2e',
  testMatch: '**/*.playwright.js', // Add .js extension
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
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
        headless: false,
        slowMo: 1000,
      },
    },
  ],
});