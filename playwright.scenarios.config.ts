/**
 * Playwright config for SCENARIO tests (the "holdout set").
 *
 * These tests validate behavioral outcomes described in docs/specs/features/.
 * They are separate from E2E tests that agents may read during implementation.
 *
 * Run with: pnpm exec playwright test --config playwright.scenarios.config.ts
 */
import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

if (process.env.DOTENV_CONFIG_PATH) {
  loadEnv({ path: process.env.DOTENV_CONFIG_PATH });
} else {
  loadEnv();
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/scenarios',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: './tests/playwright.global-setup.ts',
  globalTeardown: './tests/playwright.global-teardown.ts',
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  outputDir: 'test-results-scenarios',
});
