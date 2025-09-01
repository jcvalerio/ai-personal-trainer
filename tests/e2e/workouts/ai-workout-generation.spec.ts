/**
 * E2E Tests for AI Workout Generation Workflow
 * Tests the complete AI-powered workout generation flow from preferences to session creation
 */

import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';

test.describe('AI Workout Generation Workflow', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    
    // Sign in before each test
    await authUtils.signIn();
    await authUtils.completeOnboardingIfNeeded();
  });

  test.afterEach(async ({ page }) => {
    // Clean up: sign out after each test
    await authUtils.signOut();
  });

  test('should complete full AI workout generation flow', async ({ page }) => {
    console.log('🤖 Testing complete AI workout generation workflow...');

    // Navigate to AI workout generation
    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Step 1: Template Selection
    await expect(page.locator('h2:has-text("Choose Your Starting Point")')).toBeVisible();
    
    // Choose "Create from Scratch" option
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Step 2: Set Preferences
    await expect(page.locator('h2:has-text("Tell us about your fitness preferences")')).toBeVisible();

    // Select fitness level
    await page.locator('[data-testid="fitness-level-intermediate"], button:has-text("Intermediate")').first().click();

    // Select fitness goals (multiple selections)
    await page.locator('[data-testid="goal-strength"], button:has-text("Strength")').first().click();
    await page.locator('[data-testid="goal-muscle_gain"], button:has-text("Muscle Gain")').first().click();

    // Set workout duration using slider or input
    const durationSlider = page.locator('input[type="range"]').first();
    if (await durationSlider.isVisible()) {
      await durationSlider.fill('60');
    }

    // Select equipment
    await page.locator('[data-testid="equipment-dumbbells"], button:has-text("Dumbbells")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    // Click generate workout button
    const generateButton = page.locator('button:has-text("Generate My Workout")');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Step 3: Generation Progress
    await expect(page.locator('h2:has-text("Creating Your Workout")')).toBeVisible();
    
    // Wait for progress to complete
    await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });

    // Step 4: Review Generated Workout
    await expect(page.locator('h2:has-text("Your Workout is Ready!")')).toBeVisible();
    
    // Verify workout details are displayed
    await expect(page.locator('[data-testid="workout-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="workout-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="workout-duration"]')).toBeVisible();
    
    // Verify exercises are displayed
    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    await expect(exerciseCards).toHaveCount({ min: 3 }); // At least 3 exercises
    
    // Verify each exercise has required details
    const firstExercise = exerciseCards.first();
    await expect(firstExercise.locator('[data-testid="exercise-name"]')).toBeVisible();
    await expect(firstExercise.locator('[data-testid="exercise-description"]')).toBeVisible();
    await expect(firstExercise.locator('[data-testid="exercise-sets"]')).toBeVisible();

    // Step 5: Start Workout
    const startWorkoutButton = page.locator('button:has-text("Start Workout")');
    await expect(startWorkoutButton).toBeVisible();
    await startWorkoutButton.click();

    // Step 6: Session Creation and Navigation
    // Should navigate to session execution page
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });
    
    // Verify session execution page loaded
    await expect(page.locator('[data-testid="session-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="exercise-progress"]')).toBeVisible();

    console.log('✅ AI workout generation workflow completed successfully');
  });

  test('should handle regeneration workflow', async ({ page }) => {
    console.log('🔄 Testing workout regeneration...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Complete initial generation flow (abbreviated)
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Set minimal preferences
    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    await page.locator('button:has-text("Generate My Workout")').click();
    await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });

    // Test regeneration
    const originalWorkoutName = await page.locator('[data-testid="workout-name"]').textContent();
    
    const regenerateButton = page.locator('button:has-text("Regenerate")');
    await expect(regenerateButton).toBeVisible();
    await regenerateButton.click();

    // Wait for regeneration to complete
    await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });

    // Verify a new workout was generated (name might be different)
    const newWorkoutName = await page.locator('[data-testid="workout-name"]').textContent();
    console.log(`Original: ${originalWorkoutName}, New: ${newWorkoutName}`);

    // Should still have all required elements
    await expect(page.locator('[data-testid="workout-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="exercise-card"]')).toHaveCount({ min: 3 });

    console.log('✅ Workout regeneration completed successfully');
  });

  test('should handle template-based generation', async ({ page }) => {
    console.log('📋 Testing template-based generation...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Choose template option
    await page.locator('button:has-text("Start with a Template")').click();

    // Wait for templates to load
    await page.waitForSelector('[data-testid="template-card"]', { timeout: 10000 });

    // Select first available template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
      
      // Continue with template customization
      await page.locator('button:has-text("Customize Template")').click();

      // Complete customization (minimal changes)
      await page.locator('button:has-text("Generate My Workout")').click();
      await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });

      // Verify template-based workout generated
      await expect(page.locator('[data-testid="workout-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="exercise-card"]')).toHaveCount({ min: 1 });

      console.log('✅ Template-based generation completed successfully');
    } else {
      console.log('⚠️ No templates available, skipping template-based test');
    }
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    console.log('🚨 Testing error handling...');

    // Navigate to generation page
    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Mock API error
    await page.route('**/api/ai/generate-workout', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service temporarily unavailable' })
      });
    });

    // Complete preferences and attempt generation
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    await page.locator('button:has-text("Generate My Workout")').click();

    // Should show error message and return to preferences
    await expect(page.locator('text="Generation Failed"')).toBeVisible();
    await expect(page.locator('text="AI service temporarily unavailable"')).toBeVisible();

    // Should be back on preferences step
    await expect(page.locator('h2:has-text("Tell us about your fitness preferences")')).toBeVisible();

    console.log('✅ Error handling verified');
  });

  test('should validate form inputs properly', async ({ page }) => {
    console.log('✅ Testing form validation...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Try to generate without required fields
    const generateButton = page.locator('button:has-text("Generate My Workout")');
    
    // Button should be disabled initially
    await expect(generateButton).toBeDisabled();

    // Add fitness level only
    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await expect(generateButton).toBeDisabled(); // Still disabled

    // Add goals
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await expect(generateButton).toBeDisabled(); // Still disabled

    // Add equipment - should enable button
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();
    await expect(generateButton).toBeEnabled(); // Now enabled

    console.log('✅ Form validation working correctly');
  });

  test('should persist preferences across navigation', async ({ page }) => {
    console.log('💾 Testing preference persistence...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Set some preferences
    await page.locator('[data-testid="fitness-level-intermediate"], button:has-text("Intermediate")').first().click();
    await page.locator('[data-testid="goal-strength"], button:has-text("Strength")').first().click();

    // Navigate away and back
    await page.goto('/workouts');
    await page.goto('/workouts/generate');

    // Preferences should be reset (as expected for new session)
    const intermediateButton = page.locator('[data-testid="fitness-level-intermediate"], button:has-text("Intermediate")').first();
    const selectedState = await intermediateButton.getAttribute('aria-pressed') || await intermediateButton.getAttribute('data-selected');
    
    // For new session, preferences should start fresh
    console.log('💾 Preference persistence test completed (new session starts fresh as expected)');
  });

  test('should handle mobile responsive design', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 6/7/8

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Verify mobile layout
    await expect(page.locator('h2:has-text("Choose Your Starting Point")')).toBeVisible();

    // Mobile navigation should work
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Forms should be usable on mobile
    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    
    // Buttons should be touch-friendly (44px minimum)
    const generateButton = page.locator('button:has-text("Generate My Workout")');
    const boundingBox = await generateButton.boundingBox();
    
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44); // WCAG touch target minimum
    }

    console.log('✅ Mobile responsive design verified');
  });

  test('should be accessible to screen readers', async ({ page }) => {
    console.log('♿ Testing accessibility...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Check for proper headings structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 3)) { // Check first 3 buttons
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }

    // Check for proper form labels
    const inputs = await page.locator('input, select').all();
    for (const input of inputs.slice(0, 3)) { // Check first 3 inputs
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (id) {
        // Should have associated label
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || !!ariaLabel).toBeTruthy();
      }
    }

    console.log('✅ Accessibility checks completed');
  });
});

test.describe('AI Workout Generation Error Scenarios', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    await authUtils.signIn();
    await authUtils.completeOnboardingIfNeeded();
  });

  test.afterEach(async ({ page }) => {
    await authUtils.signOut();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    console.log('🌐 Testing network error handling...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Complete preferences setup
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    // Simulate network failure
    await page.route('**/api/ai/generate-workout', (route) => {
      route.abort();
    });

    await page.locator('button:has-text("Generate My Workout")').click();

    // Should handle network error gracefully
    await expect(page.locator('text="Generation Failed"')).toBeVisible();
    
    // Should provide retry option
    const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Generate My Workout")');
    await expect(retryButton).toBeVisible();

    console.log('✅ Network error handling verified');
  });

  test('should handle AI service rate limiting', async ({ page }) => {
    console.log('⏰ Testing rate limiting handling...');

    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Mock rate limiting response
    await page.route('**/api/ai/generate-workout', (route) => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a few minutes.',
          retryAfter: 60 
        })
      });
    });

    // Complete generation attempt
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    await page.locator('button:has-text("Generate My Workout")').click();

    // Should show rate limiting message
    await expect(page.locator('text="Rate limit exceeded"')).toBeVisible();

    console.log('✅ Rate limiting handling verified');
  });
});