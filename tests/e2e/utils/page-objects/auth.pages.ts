import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Sign-in page object model
 */
export class SignInPage extends BasePage {
  // Locators
  private readonly emailInput = () =>
    this.page.locator('input[name="identifier"], input[type="email"]').first();
  private readonly passwordInput = () =>
    this.page.locator('input[name="password"], input[type="password"]').first();
  private readonly signInButton = () =>
    this.page
      .locator('button[type="submit"], button:has-text("Sign in")')
      .first();
  private readonly signUpLink = () =>
    this.page.locator('a[href*="sign-up"], a:has-text("Sign up")').first();
  private readonly forgotPasswordLink = () =>
    this.page.locator('a:has-text("Forgot"), a[href*="forgot"]').first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to sign-in page
   */
  async navigate(): Promise<void> {
    await this.goto('/sign-in');
    await this.waitForPageLoad();
    await this.waitForElement('[data-clerk-element="signInForm"]', 15000);
  }

  /**
   * Fill sign-in form
   */
  async fillSignInForm(email: string, password: string): Promise<void> {
    await this.emailInput().waitFor({ state: 'visible' });
    await this.emailInput().clear();
    await this.emailInput().fill(email);

    await this.passwordInput().waitFor({ state: 'visible' });
    await this.passwordInput().clear();
    await this.passwordInput().fill(password);
  }

  /**
   * Submit sign-in form
   */
  async submitSignIn(): Promise<void> {
    await this.signInButton().waitFor({ state: 'visible' });

    await Promise.all([
      this.page.waitForURL('**/dashboard', { timeout: 30000 }),
      this.signInButton().click(),
    ]);
  }

  /**
   * Complete sign-in flow
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.fillSignInForm(email, password);
    await this.submitSignIn();
  }

  /**
   * Navigate to sign-up page
   */
  async navigateToSignUp(): Promise<void> {
    await this.signUpLink().click();
    await this.page.waitForURL('**/sign-up', { timeout: 10000 });
  }

  /**
   * Check for error messages
   */
  async getErrorMessage(): Promise<string | null> {
    const errorSelectors = [
      '[data-testid="error"]',
      '.error-message',
      '[role="alert"]',
      '.text-red-500',
    ];

    for (const selector of errorSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        return await element.textContent();
      }
    }

    return null;
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/sign-in/);
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.signInButton()).toBeVisible();
  }
}

/**
 * Sign-up page object model
 */
export class SignUpPage extends BasePage {
  // Locators
  private readonly emailInput = () =>
    this.page
      .locator('input[name="emailAddress"], input[type="email"]')
      .first();
  private readonly passwordInput = () =>
    this.page.locator('input[name="password"], input[type="password"]').first();
  private readonly firstNameInput = () =>
    this.page.locator('input[name="firstName"]').first();
  private readonly lastNameInput = () =>
    this.page.locator('input[name="lastName"]').first();
  private readonly signUpButton = () =>
    this.page
      .locator('button[type="submit"], button:has-text("Sign up")')
      .first();
  private readonly signInLink = () =>
    this.page.locator('a[href*="sign-in"], a:has-text("Sign in")').first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to sign-up page
   */
  async navigate(): Promise<void> {
    await this.goto('/sign-up');
    await this.waitForPageLoad();
    await this.waitForElement('[data-clerk-element="signUpForm"]', 15000);
  }

  /**
   * Fill sign-up form
   */
  async fillSignUpForm(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    await this.emailInput().waitFor({ state: 'visible' });
    await this.emailInput().clear();
    await this.emailInput().fill(email);

    await this.passwordInput().waitFor({ state: 'visible' });
    await this.passwordInput().clear();
    await this.passwordInput().fill(password);

    if (firstName && (await this.elementExists('input[name="firstName"]'))) {
      await this.firstNameInput().clear();
      await this.firstNameInput().fill(firstName);
    }

    if (lastName && (await this.elementExists('input[name="lastName"]'))) {
      await this.lastNameInput().clear();
      await this.lastNameInput().fill(lastName);
    }
  }

  /**
   * Submit sign-up form
   */
  async submitSignUp(): Promise<void> {
    await this.signUpButton().waitFor({ state: 'visible' });
    await this.signUpButton().click();

    // Wait for either onboarding or email verification page
    try {
      await Promise.race([
        this.page.waitForURL('**/onboarding', { timeout: 15000 }),
        this.page.waitForURL('**/verify-email', { timeout: 15000 }),
        this.page.waitForURL('**/dashboard', { timeout: 15000 }),
      ]);
    } catch (error) {
      console.warn('Sign-up redirect timeout - checking current page');
    }
  }

  /**
   * Complete sign-up flow
   */
  async signUp(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    await this.navigate();
    await this.fillSignUpForm(email, password, firstName, lastName);
    await this.submitSignUp();
  }

  /**
   * Navigate to sign-in page
   */
  async navigateToSignIn(): Promise<void> {
    await this.signInLink().click();
    await this.page.waitForURL('**/sign-in', { timeout: 10000 });
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/sign-up/);
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.signUpButton()).toBeVisible();
  }
}

/**
 * Onboarding page object model
 */
export class OnboardingPage extends BasePage {
  // Locators
  private readonly firstNameInput = () =>
    this.page
      .locator('input[name="firstName"], input[placeholder*="first name" i]')
      .first();
  private readonly lastNameInput = () =>
    this.page
      .locator('input[name="lastName"], input[placeholder*="last name" i]')
      .first();
  private readonly ageInput = () =>
    this.page.locator('input[name="age"], input[type="number"]').first();
  private readonly fitnessLevelSelect = () =>
    this.page
      .locator(
        'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
      )
      .first();
  private readonly goalsSelect = () =>
    this.page
      .locator('select[name="goals"], select[data-testid="fitness-goals"]')
      .first();
  private readonly continueButton = () =>
    this.page
      .locator(
        'button[type="submit"], button:has-text("Complete"), button:has-text("Continue")'
      )
      .first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to onboarding page
   */
  async navigate(): Promise<void> {
    await this.goto('/onboarding');
    await this.waitForPageLoad();
    await this.waitForElement('form, [data-testid="onboarding-form"]', 15000);
  }

  /**
   * Fill onboarding form
   */
  async fillOnboardingForm(data: {
    firstName?: string;
    lastName?: string;
    age?: number;
    fitnessLevel?: string;
    goals?: string;
  }): Promise<void> {
    if (
      data.firstName &&
      (await this.elementExists(
        'input[name="firstName"], input[placeholder*="first name" i]'
      ))
    ) {
      await this.firstNameInput().clear();
      await this.firstNameInput().fill(data.firstName);
    }

    if (
      data.lastName &&
      (await this.elementExists(
        'input[name="lastName"], input[placeholder*="last name" i]'
      ))
    ) {
      await this.lastNameInput().clear();
      await this.lastNameInput().fill(data.lastName);
    }

    if (
      data.age &&
      (await this.elementExists('input[name="age"], input[type="number"]'))
    ) {
      await this.ageInput().clear();
      await this.ageInput().fill(data.age.toString());
    }

    if (
      data.fitnessLevel &&
      (await this.elementExists(
        'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
      ))
    ) {
      await this.fitnessLevelSelect().selectOption(data.fitnessLevel);
    }

    if (
      data.goals &&
      (await this.elementExists(
        'select[name="goals"], select[data-testid="fitness-goals"]'
      ))
    ) {
      await this.goalsSelect().selectOption(data.goals);
    }
  }

  /**
   * Submit onboarding form
   */
  async submitOnboarding(): Promise<void> {
    await this.continueButton().waitFor({ state: 'visible' });

    await Promise.all([
      this.page.waitForURL('**/dashboard', { timeout: 15000 }),
      this.continueButton().click(),
    ]);
  }

  /**
   * Complete onboarding flow
   */
  async completeOnboarding(
    data: {
      firstName?: string;
      lastName?: string;
      age?: number;
      fitnessLevel?: string;
      goals?: string;
    } = {}
  ): Promise<void> {
    const defaultData = {
      firstName: 'Claude',
      lastName: 'Test',
      age: 30,
      fitnessLevel: 'intermediate',
      goals: 'general_fitness',
      ...data,
    };

    await this.fillOnboardingForm(defaultData);
    await this.submitOnboarding();
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/onboarding/);

    // Check that at least one form field is present
    const hasAnyField = await Promise.race([
      this.elementExists(
        'input[name="firstName"], input[placeholder*="first name" i]'
      ),
      this.elementExists('input[name="age"], input[type="number"]'),
      this.elementExists(
        'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
      ),
    ]);

    expect(hasAnyField).toBe(true);
    await expect(this.continueButton()).toBeVisible();
  }

  /**
   * Skip onboarding if possible
   */
  async skipOnboarding(): Promise<void> {
    const skipButton = this.page
      .locator('button:has-text("Skip"), a:has-text("Skip")')
      .first();

    if (
      await this.elementExists('button:has-text("Skip"), a:has-text("Skip")')
    ) {
      await Promise.all([
        this.page.waitForURL('**/dashboard', { timeout: 15000 }),
        skipButton.click(),
      ]);
    } else {
      // If no skip option, complete with minimal data
      await this.completeOnboarding();
    }
  }
}
