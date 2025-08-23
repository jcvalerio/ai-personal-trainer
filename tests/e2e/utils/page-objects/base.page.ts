import { expect, Page } from '@playwright/test';

/**
 * Base page class with common utilities and methods
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => document.readyState === 'complete');
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for text to be visible
   */
  async waitForText(text: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      text,
      { timeout }
    );
  }

  /**
   * Take a screenshot with automatic naming
   */
  async takeScreenshot(name?: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = name
      ? `${name}-${timestamp}`
      : `screenshot-${timestamp}`;
    await this.page.screenshot({
      path: `test-results/screenshots/${screenshotName}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout: 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Assert current URL matches expected path
   */
  async assertUrlPath(expectedPath: string): Promise<void> {
    const currentUrl = new URL(this.page.url());
    expect(currentUrl.pathname).toBe(expectedPath);
  }

  /**
   * Fill form field with retry logic
   */
  async fillField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.clear();
    await field.fill(value);

    // Verify the field was filled correctly
    const fieldValue = await field.inputValue();
    if (fieldValue !== value) {
      throw new Error(
        `Failed to fill field ${selector}. Expected: ${value}, Got: ${fieldValue}`
      );
    }
  }

  /**
   * Click element with retry logic
   */
  async clickElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

  /**
   * Wait for navigation after action
   */
  async waitForNavigation(action: () => Promise<void>): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      action(),
    ]);
  }

  /**
   * Check for error messages
   */
  async checkForErrors(): Promise<string[]> {
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      '[role="alert"]',
      '.text-red-500',
      '.text-red-600',
      '.text-destructive',
    ];

    const errors: string[] = [];

    for (const selector of errorSelectors) {
      const elements = await this.page.locator(selector).all();
      for (const element of elements) {
        const text = await element.textContent();
        if (text?.trim()) {
          errors.push(text.trim());
        }
      }
    }

    return errors;
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '.animate-spin',
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, {
          state: 'hidden',
          timeout: 5000,
        });
      } catch {
        // Loading indicator might not exist, continue
      }
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Assert page title contains expected text
   */
  async assertTitleContains(expectedText: string): Promise<void> {
    const title = await this.getTitle();
    expect(title).toContain(expectedText);
  }
}
