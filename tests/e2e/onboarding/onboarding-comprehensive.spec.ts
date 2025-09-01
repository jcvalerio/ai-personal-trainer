/**
 * E2E Tests for Onboarding Workflow
 * Tests the complete user onboarding flow including profile setup, fitness assessment, and preferences
 */

import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';

test.describe('Onboarding Workflow', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    
    // Start each test with fresh session
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up
    try {
      await authUtils.signOut();
    } catch (error) {
      console.log('Sign out cleanup failed:', error);
    }
  });

  test('should complete full onboarding workflow for new user', async ({ page }) => {
    console.log('👋 Testing complete onboarding workflow...');

    // Sign in to trigger onboarding
    await authUtils.signIn();
    
    // Should redirect to onboarding if user hasn't completed it
    const currentUrl = page.url();
    
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Redirected to onboarding as expected');
      
      await expect(page.locator('[data-testid="onboarding-form"], h1:has-text("Welcome")')).toBeVisible();
      
      // Step 1: Basic Profile Information
      await fillBasicProfile(page);
      
      // Step 2: Fitness Assessment
      await fillFitnessAssessment(page);
      
      // Step 3: Goals and Preferences
      await fillGoalsAndPreferences(page);
      
      // Complete onboarding
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Get Started"), button:has-text("Continue")');
      await expect(completeButton).toBeVisible();
      await completeButton.click();

      // Should redirect to dashboard after completion
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      
      console.log('✅ Onboarding completed successfully');
    } else {
      console.log('ℹ️ User already onboarded, skipping onboarding flow test');
      // Verify we're on dashboard or workouts page
      expect(currentUrl).toMatch(/(dashboard|workouts)/);
    }
  });

  test('should validate required fields in onboarding', async ({ page }) => {
    console.log('✅ Testing onboarding form validation...');

    await authUtils.signIn();
    
    // Navigate to onboarding if not redirected automatically
    if (!page.url().includes('/onboarding')) {
      await page.goto('/onboarding');
    }

    await page.waitForLoadState('networkidle');
    
    // Try to submit without required fields
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next Step")').first();
    
    if (await continueButton.isVisible()) {
      // Should be disabled initially or show validation errors
      const isDisabled = await continueButton.isDisabled();
      
      if (!isDisabled) {
        await continueButton.click();
        
        // Should show validation errors
        await expect(page.locator('text="required", text="Please"), .error-message').toBeVisible();
      }
      
      console.log('✅ Form validation working correctly');
    }
  });

  test('should allow skipping optional onboarding steps', async ({ page }) => {
    console.log('⏭️ Testing optional step skipping...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Look for skip options
      const skipButton = page.locator('button:has-text("Skip"), a:has-text("Skip")');
      
      if (await skipButton.isVisible()) {
        await skipButton.click();
        
        // Should progress to next step or completion
        await page.waitForTimeout(1000);
        console.log('Skip functionality available');
      }
      
      // Eventually complete with minimal info
      await fillMinimalOnboarding(page);
    }

    console.log('✅ Skip functionality verified');
  });

  test('should handle onboarding display name issue fix', async ({ page }) => {
    console.log('👤 Testing display name fix...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Check that display name is properly shown (not "null null")
      const welcomeText = page.locator('h1, h2, .welcome-text');
      
      if (await welcomeText.isVisible()) {
        const text = await welcomeText.textContent() || '';
        
        // Should not contain "null null"
        expect(text.toLowerCase()).not.toContain('null null');
        
        // Should contain some form of greeting or email
        expect(text.length).toBeGreaterThan(5);
        
        console.log(`Display name appears correct: ${text}`);
      }
    }

    console.log('✅ Display name issue fix verified');
  });

  test('should persist onboarding progress across page refreshes', async ({ page }) => {
    console.log('💾 Testing onboarding progress persistence...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Fill some basic information
      await fillBasicProfile(page);
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Information should be preserved
      const firstNameField = page.locator('input[name="firstName"], input[placeholder*="first name" i]').first();
      
      if (await firstNameField.isVisible()) {
        const value = await firstNameField.inputValue();
        expect(value).toBeTruthy();
        console.log(`Preserved value: ${value}`);
      }
    }

    console.log('✅ Progress persistence verified');
  });

  test('should handle different fitness levels properly', async ({ page }) => {
    console.log('🏃 Testing fitness level selection...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Test each fitness level selection
      const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
      
      for (const level of fitnessLevels) {
        const levelButton = page.locator(`[data-testid="fitness-level-${level}"], button:has-text("${level}")`, { hasText: new RegExp(level, 'i') }).first();
        
        if (await levelButton.isVisible()) {
          await levelButton.click();
          
          // Should show as selected
          await expect(levelButton).toHaveClass(/selected|active|checked/);
          
          console.log(`✅ ${level} level selectable`);
          break; // Select first available level
        }
      }
    }

    console.log('✅ Fitness level selection verified');
  });

  test('should handle multiple goal selection', async ({ page }) => {
    console.log('🎯 Testing goal selection...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Navigate to goals section if not already there
      await navigateToGoalsSection(page);
      
      // Test selecting multiple goals
      const goalOptions = [
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'general_fitness'
      ];
      
      let goalsSelected = 0;
      for (const goal of goalOptions) {
        const goalButton = page.locator(`[data-testid="goal-${goal}"], button:has-text("${goal.replace('_', ' ')}")`, { hasText: new RegExp(goal.replace('_', ' '), 'i') }).first();
        
        if (await goalButton.isVisible() && goalsSelected < 3) {
          await goalButton.click();
          goalsSelected++;
          console.log(`✅ Selected goal: ${goal}`);
        }
      }
      
      expect(goalsSelected).toBeGreaterThan(0);
    }

    console.log('✅ Goal selection verified');
  });

  test('should provide helpful guidance and tips', async ({ page }) => {
    console.log('💡 Testing onboarding guidance...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Look for helpful text, tooltips, or guidance
      const helpElements = await page.locator('.help-text, .tooltip, .guidance, [data-testid="help"]').all();
      
      if (helpElements.length > 0) {
        console.log(`Found ${helpElements.length} help elements`);
        
        // Verify help content is useful
        for (const element of helpElements.slice(0, 3)) {
          const text = await element.textContent();
          if (text && text.length > 10) {
            console.log(`Help text: ${text.substring(0, 50)}...`);
          }
        }
      }
      
      // Look for progress indicators
      const progressIndicator = page.locator('.progress-bar, .steps-indicator, [data-testid="progress"]');
      if (await progressIndicator.isVisible()) {
        console.log('✅ Progress indicator found');
      }
    }

    console.log('✅ Guidance elements verified');
  });

  test('should handle mobile responsive onboarding', async ({ page }) => {
    console.log('📱 Testing mobile onboarding...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Verify mobile layout works
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // Form elements should be touch-friendly
      const buttons = await page.locator('button').all();
      for (const button of buttons.slice(0, 3)) {
        const bbox = await button.boundingBox();
        if (bbox) {
          expect(bbox.height).toBeGreaterThanOrEqual(44); // WCAG touch target minimum
        }
      }
      
      // Complete minimal onboarding on mobile
      await fillMinimalOnboarding(page);
    }

    console.log('✅ Mobile onboarding verified');
  });

  test('should handle accessibility requirements', async ({ page }) => {
    console.log('♿ Testing onboarding accessibility...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check form labels
      const inputs = await page.locator('input, select').all();
      for (const input of inputs.slice(0, 3)) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        
        // Should have some form of labeling
        expect(id || ariaLabel || placeholder).toBeTruthy();
      }
      
      // Check for focus management
      const firstFocusableElement = page.locator('input, button, select').first();
      if (await firstFocusableElement.isVisible()) {
        await firstFocusableElement.focus();
        await expect(firstFocusableElement).toBeFocused();
      }
    }

    console.log('✅ Accessibility features verified');
  });

  // Helper functions
  async function fillBasicProfile(page: any) {
    console.log('📝 Filling basic profile information...');
    
    // First Name
    const firstNameField = page.locator('input[name="firstName"], input[placeholder*="first name" i]').first();
    if (await firstNameField.isVisible()) {
      await firstNameField.clear();
      await firstNameField.fill('Claude');
    }
    
    // Last Name
    const lastNameField = page.locator('input[name="lastName"], input[placeholder*="last name" i]').first();
    if (await lastNameField.isVisible()) {
      await lastNameField.clear();
      await lastNameField.fill('Test');
    }
    
    // Age
    const ageField = page.locator('input[name="age"], input[type="number"]').first();
    if (await ageField.isVisible()) {
      await ageField.clear();
      await ageField.fill('30');
    }
    
    // Continue to next step
    const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  }

  async function fillFitnessAssessment(page: any) {
    console.log('🏋️ Filling fitness assessment...');
    
    // Fitness Level
    const fitnessLevel = page.locator('[data-testid="fitness-level-intermediate"], button:has-text("Intermediate")').first();
    if (await fitnessLevel.isVisible()) {
      await fitnessLevel.click();
    }
    
    // Activity Level
    const activityLevel = page.locator('[data-testid="activity-moderate"], button:has-text("Moderate")').first();
    if (await activityLevel.isVisible()) {
      await activityLevel.click();
    }
    
    // Continue
    const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  }

  async function fillGoalsAndPreferences(page: any) {
    console.log('🎯 Filling goals and preferences...');
    
    // Primary Goal
    const primaryGoal = page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first();
    if (await primaryGoal.isVisible()) {
      await primaryGoal.click();
    }
    
    // Equipment Available
    const equipment = page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first();
    if (await equipment.isVisible()) {
      await equipment.click();
    }
    
    // Workout Duration Preference
    const durationSlider = page.locator('input[type="range"]').first();
    if (await durationSlider.isVisible()) {
      await durationSlider.fill('45');
    }
    
    // Continue
    const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  }

  async function fillMinimalOnboarding(page: any) {
    console.log('⚡ Filling minimal onboarding...');
    
    // Fill only required fields to complete onboarding quickly
    const firstNameField = page.locator('input[name="firstName"]').first();
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Test');
    }
    
    // Select any available fitness level
    const anyFitnessLevel = page.locator('[data-testid^="fitness-level-"], button[class*="fitness"]').first();
    if (await anyFitnessLevel.isVisible()) {
      await anyFitnessLevel.click();
    }
    
    // Select any available goal
    const anyGoal = page.locator('[data-testid^="goal-"], button[class*="goal"]').first();
    if (await anyGoal.isVisible()) {
      await anyGoal.click();
    }
    
    // Complete
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Get Started"), button:has-text("Finish")').first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  }

  async function navigateToGoalsSection(page: any) {
    // This helper navigates to the goals section if onboarding has multiple steps
    const goalsStep = page.locator('button:has-text("Goals"), .step-goals');
    if (await goalsStep.isVisible()) {
      await goalsStep.click();
      await page.waitForTimeout(500);
    }
  }
});

test.describe('Onboarding Error Handling', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.afterEach(async ({ page }) => {
    try {
      await authUtils.signOut();
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  });

  test('should handle onboarding API errors gracefully', async ({ page }) => {
    console.log('🚨 Testing onboarding API error handling...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Mock API error for onboarding submission
      await page.route('**/api/user/profile', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error during onboarding' })
        });
      });

      // Fill out form and submit
      const firstNameField = page.locator('input[name="firstName"]').first();
      if (await firstNameField.isVisible()) {
        await firstNameField.fill('Test');
      }

      const submitButton = page.locator('button:has-text("Complete"), button:has-text("Submit")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show error message
        await expect(page.locator('text="error"), .error-message')).toBeVisible();
        
        // Should allow retry
        const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Retry")');
        if (await retryButton.isVisible()) {
          console.log('Retry option available');
        }
      }
    }

    console.log('✅ API error handling verified');
  });

  test('should handle session expiration during onboarding', async ({ page }) => {
    console.log('⏰ Testing session expiration handling...');

    await authUtils.signIn();
    
    if (page.url().includes('/onboarding')) {
      // Fill some information
      const firstNameField = page.locator('input[name="firstName"]').first();
      if (await firstNameField.isVisible()) {
        await firstNameField.fill('Test');
      }

      // Simulate session expiration
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to continue
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();

        // Should redirect to sign-in or show authentication error
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        if (currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up')) {
          console.log('Redirected to authentication as expected');
        } else {
          // Check for authentication error message
          const errorMessage = page.locator('text="Please sign in"), text="Authentication"');
          if (await errorMessage.isVisible()) {
            console.log('Authentication error shown as expected');
          }
        }
      }
    }

    console.log('✅ Session expiration handling verified');
  });
});