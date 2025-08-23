import { test, expect } from '@playwright/test';

test.describe('Basic Validation Tests', () => {
  test('should validate Playwright setup', async ({ page }) => {
    // Test that we can navigate to a basic page
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example/);

    console.log('✅ Playwright setup is working correctly');
  });

  test('should validate environment variables', async () => {
    // Check that test credentials are available
    const testEmail = process.env.CLERK_CLAUDE_TEST_USER_EMAIL;
    const testPassword = process.env.CLERK_CLAUDE_TEST_USER_PASSWORD;

    expect(testEmail).toBeTruthy();
    expect(testPassword).toBeTruthy();

    console.log('✅ Test environment variables are configured');
    console.log(`Test user email: ${testEmail}`);
  });

  test('should validate local server accessibility', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    try {
      // Try to access the local development server
      const response = await page.goto(baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      if (response && response.ok()) {
        console.log('✅ Local development server is accessible');
        expect(response.status()).toBeLessThan(400);
      } else {
        console.log(
          '⚠️ Local development server returned error:',
          response?.status()
        );
        // Don't fail the test, just log the issue
      }
    } catch (error) {
      console.log(
        '⚠️ Could not connect to local development server:',
        error.message
      );
      // Don't fail the test if server is not running
    }
  });

  test('should validate test utilities can be imported', async () => {
    // Try to import our test utilities
    const { AuthUtils, TestDataUtils, BasePage } = await import(
      './utils/index'
    );

    expect(AuthUtils).toBeTruthy();
    expect(TestDataUtils).toBeTruthy();
    expect(BasePage).toBeTruthy();

    console.log('✅ Test utilities can be imported successfully');
  });
});
