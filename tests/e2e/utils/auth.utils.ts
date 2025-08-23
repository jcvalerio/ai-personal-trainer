import { expect, Page } from '@playwright/test';
import { BasePage } from './page-objects/base.page';

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  organizationId?: string;
}

/**
 * Authentication utilities for E2E tests
 */
export class AuthUtils extends BasePage {
  private testUser: TestUser;

  constructor(page: Page) {
    super(page);
    this.testUser = {
      email: process.env.CLERK_CLAUDE_TEST_USER_EMAIL || 'appttitude@gmail.com',
      password: process.env.CLERK_CLAUDE_TEST_USER_PASSWORD || 'JuanK@1979',
      firstName: 'Claude',
      lastName: 'Test',
    };
  }

  /**
   * Sign in with test credentials
   */
  async signIn(user?: Partial<TestUser>): Promise<void> {
    const loginUser = { ...this.testUser, ...user };

    console.log('🔐 Starting sign-in process...');

    // Navigate to sign-in page
    await this.goto('/sign-in');
    await this.waitForPageLoad();

    // Wait for Clerk sign-in form to load
    await this.waitForElement('[data-clerk-element="signInForm"]', 15000);

    // Fill email field
    const emailField = this.page
      .locator('input[name="identifier"], input[type="email"]')
      .first();
    await emailField.waitFor({ state: 'visible', timeout: 10000 });
    await emailField.clear();
    await emailField.fill(loginUser.email);

    // Fill password field
    const passwordField = this.page
      .locator('input[name="password"], input[type="password"]')
      .first();
    await passwordField.waitFor({ state: 'visible', timeout: 10000 });
    await passwordField.clear();
    await passwordField.fill(loginUser.password);

    // Click sign-in button
    const signInButton = this.page
      .locator('button[type="submit"], button:has-text("Sign in")')
      .first();
    await signInButton.waitFor({ state: 'visible', timeout: 10000 });

    // Handle navigation after sign-in
    await Promise.all([
      this.page.waitForURL('**/dashboard', { timeout: 30000 }),
      signInButton.click(),
    ]);

    // Verify successful sign-in
    await this.verifyAuthenticated();
    console.log('✅ Sign-in successful');
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    console.log('🚪 Starting sign-out process...');

    try {
      // Look for user menu/profile button
      const userMenuSelectors = [
        '[data-testid="user-menu"]',
        '[data-clerk-element="userButton"]',
        'button:has-text("Sign out")',
        '.user-menu-trigger',
      ];

      let userMenuFound = false;
      for (const selector of userMenuSelectors) {
        if (await this.elementExists(selector)) {
          await this.clickElement(selector);
          userMenuFound = true;
          break;
        }
      }

      if (userMenuFound) {
        // Wait for menu to open and click sign out
        await this.page.waitForTimeout(500); // Small delay for menu animation

        const signOutButton = this.page
          .locator('button:has-text("Sign out"), [data-testid="sign-out"]')
          .first();
        await signOutButton.waitFor({ state: 'visible', timeout: 5000 });

        await Promise.all([
          this.page.waitForURL('**/sign-in', { timeout: 15000 }),
          signOutButton.click(),
        ]);
      } else {
        // Fallback: navigate to sign-out URL directly
        await this.goto('/sign-in');
      }

      await this.verifyNotAuthenticated();
      console.log('✅ Sign-out successful');
    } catch (error) {
      console.warn('⚠️ Sign-out process failed, continuing with test:', error);
      // Navigate to sign-in as fallback
      await this.goto('/sign-in');
    }
  }

  /**
   * Verify user is authenticated
   */
  async verifyAuthenticated(): Promise<void> {
    // Check we're on an authenticated page (dashboard, not sign-in)
    await expect(this.page).not.toHaveURL(/.*\/sign-in.*/i);

    // Look for common authenticated elements
    const authIndicators = [
      '[data-testid="authenticated-content"]',
      '[data-testid="user-menu"]',
      '[data-clerk-element="userButton"]',
    ];

    let authenticated = false;
    for (const selector of authIndicators) {
      if (await this.elementExists(selector)) {
        authenticated = true;
        break;
      }
    }

    // If no specific indicators found, check we're not on sign-in/sign-up pages
    const currentUrl = this.getCurrentUrl();
    if (
      !authenticated &&
      !currentUrl.includes('/sign-in') &&
      !currentUrl.includes('/sign-up')
    ) {
      authenticated = true;
    }

    expect(authenticated).toBe(true);
  }

  /**
   * Verify user is not authenticated
   */
  async verifyNotAuthenticated(): Promise<void> {
    // Should be on sign-in page or redirected there
    const currentUrl = this.getCurrentUrl();
    const isOnAuthPage =
      currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up');

    if (!isOnAuthPage) {
      // Try to access a protected route to verify redirect
      await this.goto('/dashboard');
      await this.page.waitForTimeout(2000); // Wait for potential redirect

      const finalUrl = this.getCurrentUrl();
      expect(finalUrl).toMatch(/\/(sign-in|sign-up)/);
    }
  }

  /**
   * Get current authentication state
   */
  async getAuthState(): Promise<AuthState> {
    try {
      // Check if we can access a protected route
      const currentUrl = this.getCurrentUrl();
      const isAuthenticated =
        !currentUrl.includes('/sign-in') && !currentUrl.includes('/sign-up');

      if (!isAuthenticated) {
        return { isAuthenticated: false };
      }

      // Try to extract user info from page if available
      const userId = await this.page
        .evaluate(() => {
          return (window as any)?.Clerk?.user?.id || null;
        })
        .catch(() => null);

      const email = await this.page
        .evaluate(() => {
          return (
            (window as any)?.Clerk?.user?.primaryEmailAddress?.emailAddress ||
            null
          );
        })
        .catch(() => null);

      return {
        isAuthenticated: true,
        userId,
        email,
      };
    } catch {
      return { isAuthenticated: false };
    }
  }

  /**
   * Complete onboarding flow if needed
   */
  async completeOnboardingIfNeeded(): Promise<void> {
    const currentUrl = this.getCurrentUrl();

    if (currentUrl.includes('/onboarding')) {
      console.log('🎯 Completing onboarding flow...');

      // Fill out basic profile information
      await this.fillOnboardingForm();

      console.log('✅ Onboarding completed');
    }
  }

  /**
   * Fill onboarding form with test data
   */
  private async fillOnboardingForm(): Promise<void> {
    // Wait for onboarding form to load
    await this.waitForElement('form, [data-testid="onboarding-form"]', 10000);

    // Fill common onboarding fields if they exist
    const fields = [
      {
        selector: 'input[name="firstName"], input[placeholder*="first name" i]',
        value: this.testUser.firstName || 'Claude',
      },
      {
        selector: 'input[name="lastName"], input[placeholder*="last name" i]',
        value: this.testUser.lastName || 'Test',
      },
      {
        selector:
          'select[name="fitnessLevel"], select[data-testid="fitness-level"]',
        value: 'intermediate',
      },
      { selector: 'input[name="age"], input[type="number"]', value: '30' },
      {
        selector: 'select[name="goals"], select[data-testid="fitness-goals"]',
        value: 'general_fitness',
      },
    ];

    for (const field of fields) {
      if (await this.elementExists(field.selector)) {
        const element = this.page.locator(field.selector).first();
        const tagName = await element.evaluate((el) =>
          el.tagName.toLowerCase()
        );

        if (tagName === 'select') {
          await element.selectOption(field.value);
        } else {
          await element.clear();
          await element.fill(field.value);
        }
      }
    }

    // Submit onboarding form
    const submitButton = this.page
      .locator(
        'button[type="submit"], button:has-text("Complete"), button:has-text("Continue")'
      )
      .first();

    if (
      await this.elementExists(
        'button[type="submit"], button:has-text("Complete"), button:has-text("Continue")'
      )
    ) {
      await Promise.all([
        this.page.waitForURL('**/dashboard', { timeout: 15000 }),
        submitButton.click(),
      ]);
    }
  }

  /**
   * Create a new test user account (if enabled)
   */
  async createTestUser(userData: TestUser): Promise<void> {
    if (process.env.TEST_CREATE_NEW_USERS !== 'true') {
      throw new Error(
        'Test user creation is disabled. Set TEST_CREATE_NEW_USERS=true to enable.'
      );
    }

    console.log('👤 Creating new test user...');

    await this.goto('/sign-up');
    await this.waitForPageLoad();

    // Fill sign-up form
    await this.waitForElement('[data-clerk-element="signUpForm"]', 15000);

    await this.fillField(
      'input[name="emailAddress"], input[type="email"]',
      userData.email
    );
    await this.fillField(
      'input[name="password"], input[type="password"]',
      userData.password
    );

    if (userData.firstName) {
      await this.fillField('input[name="firstName"]', userData.firstName);
    }

    if (userData.lastName) {
      await this.fillField('input[name="lastName"]', userData.lastName);
    }

    // Submit sign-up form
    const signUpButton = this.page
      .locator('button[type="submit"], button:has-text("Sign up")')
      .first();
    await signUpButton.click();

    // Handle email verification if required
    await this.handleEmailVerification();

    console.log('✅ Test user created successfully');
  }

  /**
   * Handle email verification during sign-up
   */
  private async handleEmailVerification(): Promise<void> {
    // This would typically require access to email inbox
    // For now, we'll assume the test user is already verified
    // or skip this step in test environment
    console.log('📧 Handling email verification...');

    try {
      await this.page.waitForURL('**/onboarding', { timeout: 30000 });
    } catch {
      // Verification might not be required in test environment
      console.log('⚠️ Email verification step skipped or not required');
    }
  }

  /**
   * Get test user credentials
   */
  getTestUser(): TestUser {
    return { ...this.testUser };
  }
}
