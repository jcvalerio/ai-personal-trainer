import { test as setup, expect } from '@playwright/test';
import { AuthUtils } from './utils/auth.utils';

const authFile = '.auth/user.json';

/**
 * Authentication setup for all tests
 * This runs once before all tests to authenticate the user
 */
setup('authenticate', async ({ page }) => {
  console.log('🚀 Setting up authentication for E2E tests...');

  const authUtils = new AuthUtils(page);

  try {
    // Sign in with test credentials
    await authUtils.signIn();

    // Complete onboarding if needed
    await authUtils.completeOnboardingIfNeeded();

    // Verify we're properly authenticated
    await authUtils.verifyAuthenticated();

    // Save authentication state
    await page.context().storageState({ path: authFile });

    console.log('✅ Authentication setup completed successfully');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/auth-setup-failure.png',
      fullPage: true,
    });

    throw error;
  }
});

/**
 * Verify authentication state
 */
setup('verify auth state', async ({ page }) => {
  console.log('🔍 Verifying authentication state...');

  const authUtils = new AuthUtils(page);

  try {
    // Load the authentication state
    await page.goto('/dashboard');

    // Verify we can access authenticated pages
    await authUtils.verifyAuthenticated();

    console.log('✅ Authentication state verified');
  } catch (error) {
    console.error('❌ Authentication verification failed:', error);
    throw error;
  }
});
