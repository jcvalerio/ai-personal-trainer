import { defineConfig, devices } from '@playwright/test'

/**
 * Simple Playwright config for basic validation without server dependency
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Retry configuration */
  retries: 0,
  
  /* Workers configuration */
  workers: 1,
  
  /* Reporter to use */
  reporter: [['list']],
  
  /* Shared settings */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Timeout for each action */
    actionTimeout: 10000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Global timeout for all tests */
  globalTimeout: 5 * 60 * 1000, // 5 minutes

  /* Timeout for individual tests */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },

  /* Output folder */
  outputDir: 'test-results',
})