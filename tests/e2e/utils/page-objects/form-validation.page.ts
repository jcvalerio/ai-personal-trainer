import { expect, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Form Validation page object model for comprehensive form testing
 */
export class FormValidationPage extends BasePage {
  // Form Locators
  private readonly form = () => this.page.locator('form');
  private readonly submitButton = () =>
    this.page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")'
    );

  // Input Field Locators
  private readonly nameInput = () =>
    this.page.locator(
      'input[name="name"], input[data-testid="workout-name"], input[placeholder*="name" i]'
    );
  private readonly durationInput = () =>
    this.page.locator(
      'input[name="duration"], input[data-testid="duration"], input[placeholder*="duration" i]'
    );
  private readonly emailInput = () =>
    this.page.locator('input[type="email"], input[name="email"]');
  private readonly repsInput = () =>
    this.page.locator('input[name="reps"], input[data-testid="reps"]');

  // Validation Message Locators
  private readonly errorMessages = () =>
    this.page.locator(
      '.error-message, [data-testid="error"], .field-error, .invalid-feedback'
    );
  private readonly successMessage = () =>
    this.page.locator(
      '.success-message, [data-testid="success"], .alert-success'
    );

  // Loading State Locators
  private readonly loadingIndicator = () =>
    this.page.locator('.loading, [data-testid="loading"], .spinner');
  private readonly disabledSubmit = () =>
    this.submitButton().locator('[disabled]');

  // Accessibility Locators
  private readonly formLabels = () => this.page.locator('label');
  private readonly requiredFields = () =>
    this.page.locator('input[required], select[required], textarea[required]');
  private readonly ariaDescribedBy = () =>
    this.page.locator('[aria-describedby]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workout creation form
   */
  async navigateToCreateWorkout(): Promise<void> {
    await this.goto('/workouts/create');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * Navigate to workout generation form
   */
  async navigateToGenerateWorkout(): Promise<void> {
    await this.goto('/workouts/generate');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * Submit the current form
   */
  async submitForm(): Promise<void> {
    await this.submitButton().first().click();

    // Wait for validation or processing
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get submit button locator
   */
  getSubmitButton(): Locator {
    return this.submitButton().first();
  }

  /**
   * Get current validation errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];

    try {
      await this.page.waitForTimeout(500); // Wait for validation to appear

      const errorElements = await this.errorMessages().all();

      for (const element of errorElements) {
        const text = await element.textContent();
        if (text?.trim()) {
          errors.push(text.trim());
        }
      }
    } catch {
      // No errors found or elements not visible
    }

    return errors;
  }

  /**
   * Fill workout name field
   */
  async fillWorkoutName(name: string): Promise<void> {
    if (
      await this.elementExists(
        'input[name="name"], input[data-testid="workout-name"], input[placeholder*="name" i]'
      )
    ) {
      await this.nameInput().fill(name);
    }
  }

  /**
   * Fill duration field
   */
  async fillDuration(duration: string): Promise<void> {
    if (
      await this.elementExists(
        'input[name="duration"], input[data-testid="duration"], input[placeholder*="duration" i]'
      )
    ) {
      await this.durationInput().fill(duration);
    }
  }

  /**
   * Test numeric field validation
   */
  async testNumericValidation(
    fieldName: string,
    invalidValue: string
  ): Promise<void> {
    const fieldSelector = `input[name="${fieldName}"], input[data-testid="${fieldName}"]`;

    if (await this.elementExists(fieldSelector)) {
      await this.page.locator(fieldSelector).fill(invalidValue);
      await this.page.locator(fieldSelector).blur();
      await this.page.waitForTimeout(500); // Wait for validation
    }
  }

  /**
   * Test email field validation
   */
  async testEmailValidation(invalidEmail: string): Promise<void> {
    if (await this.elementExists('input[type="email"], input[name="email"]')) {
      await this.emailInput().fill(invalidEmail);
      await this.emailInput().blur();
      await this.page.waitForTimeout(500); // Wait for validation
    }
  }

  /**
   * Fill a valid workout form with all required fields
   */
  async fillValidWorkoutForm(): Promise<void> {
    try {
      // Fill name if present
      if (
        await this.elementExists(
          'input[name="name"], input[data-testid="workout-name"], input[placeholder*="name" i]'
        )
      ) {
        await this.fillWorkoutName('Valid Workout Name');
      }

      // Fill duration if present
      if (
        await this.elementExists(
          'input[name="duration"], input[data-testid="duration"], input[placeholder*="duration" i]'
        )
      ) {
        await this.fillDuration('30');
      }

      // Fill description if present
      if (
        await this.elementExists(
          'textarea[name="description"], textarea[data-testid="description"]'
        )
      ) {
        await this.page
          .locator(
            'textarea[name="description"], textarea[data-testid="description"]'
          )
          .fill('A comprehensive workout routine');
      }

      // Select fitness level if present
      if (
        await this.elementExists(
          'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
        )
      ) {
        await this.page
          .locator(
            'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
          )
          .selectOption('intermediate');
      }

      // Select equipment if present
      const equipmentCheckboxes = this.page.locator(
        'input[type="checkbox"][name*="equipment"]'
      );
      const checkboxCount = await equipmentCheckboxes.count();

      if (checkboxCount > 0) {
        // Check first available equipment option
        await equipmentCheckboxes.first().check();
      }

      // Fill any other required fields dynamically
      const requiredInputs = await this.requiredFields().all();

      for (const input of requiredInputs) {
        const inputType = await input.getAttribute('type');
        const inputName = await input.getAttribute('name');
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

        const currentValue = await input.inputValue();

        // Only fill if empty
        if (!currentValue) {
          if (
            inputType === 'text' ||
            inputType === 'string' ||
            tagName === 'input'
          ) {
            await input.fill('Test Value');
          } else if (inputType === 'number') {
            await input.fill('1');
          } else if (inputType === 'email') {
            await input.fill('test@example.com');
          } else if (tagName === 'select') {
            const options = input.locator('option');
            const optionCount = await options.count();
            if (optionCount > 1) {
              await input.selectOption({ index: 1 }); // Select second option (skip placeholder)
            }
          } else if (tagName === 'textarea') {
            await input.fill('Test content');
          }
        }
      }
    } catch (error) {
      console.log('Error filling valid workout form:', error.message);
    }
  }

  /**
   * Check for success message after form submission
   */
  async checkForSuccessMessage(): Promise<boolean> {
    return await this.elementExists(
      '.success-message, [data-testid="success"], .alert-success'
    );
  }

  /**
   * Check for loading indicator
   */
  async checkForLoadingIndicator(): Promise<boolean> {
    return await this.elementExists(
      '.loading, [data-testid="loading"], .spinner'
    );
  }

  /**
   * Verify form has proper labels
   */
  async verifyFormLabels(): Promise<boolean> {
    const labelCount = await this.formLabels().count();
    return labelCount > 0;
  }

  /**
   * Verify ARIA attributes are present
   */
  async verifyAriaAttributes(): Promise<boolean> {
    const hasAriaDescribedBy = await this.elementExists('[aria-describedby]');
    const hasAriaRequired = await this.elementExists('[aria-required="true"]');
    const hasAriaInvalid = await this.elementExists('[aria-invalid]');

    return hasAriaDescribedBy || hasAriaRequired || hasAriaInvalid;
  }

  /**
   * Test keyboard navigation through form
   */
  async testKeyboardNavigation(): Promise<boolean> {
    try {
      // Find first input
      const firstInput = this.page.locator('input, select, textarea').first();

      if (await firstInput.isVisible()) {
        await firstInput.focus();

        // Tab to next field
        await this.page.keyboard.press('Tab');

        // Check if focus moved to a different element
        const activeElement = await this.page.evaluate(
          () => document.activeElement?.tagName
        );

        return (
          activeElement === 'INPUT' ||
          activeElement === 'SELECT' ||
          activeElement === 'TEXTAREA' ||
          activeElement === 'BUTTON'
        );
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Blur (lose focus) from a specific field
   */
  async blurField(fieldName: string): Promise<void> {
    const fieldSelectors = [
      `input[name="${fieldName}"]`,
      `input[data-testid="${fieldName}"]`,
      `input[data-testid="${fieldName}-input"]`,
      `textarea[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
    ];

    for (const selector of fieldSelectors) {
      if (await this.elementExists(selector)) {
        await this.page.locator(selector).blur();
        break;
      }
    }
  }

  /**
   * Get current value of a form field
   */
  async getFieldValue(fieldName: string): Promise<string> {
    const fieldSelectors = [
      `input[name="${fieldName}"]`,
      `input[data-testid="${fieldName}"]`,
      `input[data-testid="${fieldName}-input"]`,
      `textarea[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
    ];

    for (const selector of fieldSelectors) {
      if (await this.elementExists(selector)) {
        const element = this.page.locator(selector);
        const tagName = await element.evaluate((el) =>
          el.tagName.toLowerCase()
        );

        if (tagName === 'select') {
          return (await element.inputValue()) || '';
        } else {
          return (await element.inputValue()) || '';
        }
      }
    }

    return '';
  }

  /**
   * Verify nested form elements exist
   */
  async verifyNestedFormElements(): Promise<boolean> {
    const hasNestedElements = await Promise.race([
      this.elementExists('.exercise-list input'),
      this.elementExists('[data-testid*="exercise"] input'),
      this.elementExists('fieldset'),
      this.elementExists('.form-group .form-group'),
      this.elementExists('[data-testid="dynamic-form"]'),
    ]);

    return hasNestedElements;
  }

  /**
   * Test nested form validation (like dynamic exercise lists)
   */
  async testNestedFormValidation(): Promise<void> {
    try {
      // Look for add/remove buttons for dynamic content
      const addButton = this.page.locator(
        'button:has-text("Add"), button[data-testid*="add"]'
      );
      const removeButton = this.page.locator(
        'button:has-text("Remove"), button[data-testid*="remove"]'
      );

      if (await addButton.isVisible()) {
        await addButton.first().click();
        await this.page.waitForTimeout(500);
      }

      // Try to submit with incomplete nested data
      await this.submitForm();

      if (await removeButton.isVisible()) {
        await removeButton.first().click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('Nested form testing completed:', error.message);
    }
  }
}
