import { defineConfig, devices } from '@playwright/test'

/**
 * Phase 4 Playwright Configuration for Comprehensive E2E Testing
 * Optimized for comprehensive workout functionality testing without authentication dependencies
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Test patterns for Phase 4 comprehensive testing */
  testMatch: [
    'basic-app-functionality.spec.ts',
    'internationalization/**/*.spec.ts',
    'forms/**/*.spec.ts',
    'sessions/**/*.spec.ts',
    'integration/**/*.spec.ts'
  ],
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/phase4-html-report' }],
    ['json', { outputFile: 'test-results/phase4-results.json' }],
    ['junit', { outputFile: 'test-results/phase4-results.xml' }],
    ['list', { printSteps: true }]
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. */
    trace: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each action */
    actionTimeout: 15000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        isMobile: true
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.SKIP_SERVER_START ? undefined : [
    {
      command: 'pnpm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],

  /* Global timeout for all tests */
  globalTimeout: 15 * 60 * 1000, // 15 minutes

  /* Timeout for individual tests */
  timeout: 60 * 1000, // 60 seconds

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },

  /* Output folder */
  outputDir: 'test-results/phase4',
})