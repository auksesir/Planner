// frontend/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './src/tests/selenium', // Your existing path (relative to frontend folder)
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: process.env.CI ? true : false, // Parallel in CI, sequential locally
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker for stability
  reporter: process.env.CI ? [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false, // Headless in CI, visible locally
    slowMo: process.env.CI ? 0 : 1000, // No slowMo in CI
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome', // Use Chrome channel locally only
      },
    },
    // Add other browsers only for CI
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      }
    ] : [])
  ],

  webServer: {
    command: 'npm start', // This will run from frontend folder
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});