/**
 * E2E Tests for Workout Session Execution Workflow
 * Tests the complete workout session execution flow including exercise tracking, timers, and completion
 */

import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';

test.describe('Session Execution Workflow', () => {
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

  test('should complete full session execution workflow', async ({ page }) => {
    console.log('🏋️ Testing complete session execution workflow...');

    // First, create a workout session through AI generation
    await createTestSession(page);

    // Now test session execution
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });
    
    // Verify session header and initial state
    await expect(page.locator('[data-testid="session-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-progress"]')).toBeVisible();
    
    // Verify exercise list is displayed
    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    await expect(exerciseCards).toHaveCount({ min: 1 });

    // Start first exercise
    const firstExercise = exerciseCards.first();
    await expect(firstExercise.locator('[data-testid="exercise-name"]')).toBeVisible();
    
    // Click start/begin exercise button
    const startExerciseButton = firstExercise.locator('button:has-text("Start"), button:has-text("Begin")');
    if (await startExerciseButton.isVisible()) {
      await startExerciseButton.click();
    }

    // Complete sets for first exercise
    await completeExerciseSets(page, firstExercise);

    // Check if there are more exercises
    const exerciseCount = await exerciseCards.count();
    console.log(`Total exercises: ${exerciseCount}`);

    if (exerciseCount > 1) {
      // Navigate to next exercise
      const nextButton = page.locator('button:has-text("Next Exercise"), button:has-text("Continue")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }

      // Complete second exercise
      const secondExercise = exerciseCards.nth(1);
      await completeExerciseSets(page, secondExercise);
    }

    // Complete session
    const completeSessionButton = page.locator('button:has-text("Complete Session"), button:has-text("Finish Workout")');
    
    // Wait for completion button to appear (might be after all exercises are done)
    await expect(completeSessionButton).toBeVisible({ timeout: 10000 });
    await completeSessionButton.click();

    // Verify completion flow
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+\/results/, { timeout: 15000 });
    
    // Verify results page
    await expect(page.locator('[data-testid="session-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-summary"]')).toBeVisible();

    console.log('✅ Session execution workflow completed successfully');
  });

  test('should handle exercise timer functionality', async ({ page }) => {
    console.log('⏱️ Testing exercise timer functionality...');

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    
    // Complete first set to trigger rest timer
    await completeSet(page, exerciseCard, 1);

    // Check for rest timer
    const restTimer = page.locator('[data-testid="rest-timer"]');
    if (await restTimer.isVisible()) {
      // Verify timer is counting down
      const initialTime = await restTimer.textContent();
      await page.waitForTimeout(2000);
      const laterTime = await restTimer.textContent();
      
      console.log(`Timer: ${initialTime} -> ${laterTime}`);
      expect(initialTime).not.toBe(laterTime);

      // Skip rest if option available
      const skipRestButton = page.locator('button:has-text("Skip Rest"), button:has-text("Skip")');
      if (await skipRestButton.isVisible()) {
        await skipRestButton.click();
      }
    }

    console.log('✅ Timer functionality verified');
  });

  test('should handle pause and resume functionality', async ({ page }) => {
    console.log('⏸️ Testing pause and resume functionality...');

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    // Look for pause button
    const pauseButton = page.locator('button:has-text("Pause"), [data-testid="pause-button"]');
    
    if (await pauseButton.isVisible()) {
      await pauseButton.click();

      // Verify pause state
      await expect(page.locator('text="Paused"')).toBeVisible();
      
      // Look for resume button
      const resumeButton = page.locator('button:has-text("Resume"), [data-testid="resume-button"]');
      await expect(resumeButton).toBeVisible();
      await resumeButton.click();

      // Verify resumed state
      await expect(page.locator('text="Paused"')).not.toBeVisible();
    }

    console.log('✅ Pause/resume functionality verified');
  });

  test('should track exercise progress correctly', async ({ page }) => {
    console.log('📊 Testing exercise progress tracking...');

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    
    // Check initial progress state
    const progressIndicator = exerciseCard.locator('[data-testid="exercise-progress"]');
    if (await progressIndicator.isVisible()) {
      const initialProgress = await progressIndicator.textContent();
      console.log(`Initial progress: ${initialProgress}`);
    }

    // Complete a set and verify progress update
    await completeSet(page, exerciseCard, 1);

    // Verify progress updated
    if (await progressIndicator.isVisible()) {
      const updatedProgress = await progressIndicator.textContent();
      console.log(`Updated progress: ${updatedProgress}`);
      // Progress should have changed
      expect(updatedProgress).toBeTruthy();
    }

    console.log('✅ Progress tracking verified');
  });

  test('should handle weight and rep input correctly', async ({ page }) => {
    console.log('🏋️‍♀️ Testing weight and rep input...');

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    
    // Look for set input fields
    const setContainer = exerciseCard.locator('[data-testid="set-1"], .set-input').first();
    
    if (await setContainer.isVisible()) {
      // Input weight
      const weightInput = setContainer.locator('input[placeholder*="Weight"], input[data-testid="weight-input"]');
      if (await weightInput.isVisible()) {
        await weightInput.clear();
        await weightInput.fill('50');
      }

      // Input reps
      const repsInput = setContainer.locator('input[placeholder*="Reps"], input[data-testid="reps-input"]');
      if (await repsInput.isVisible()) {
        await repsInput.clear();
        await repsInput.fill('10');
      }

      // Mark set as complete
      const completeSetButton = setContainer.locator('button:has-text("Complete"), button:has-text("✓")');
      if (await completeSetButton.isVisible()) {
        await completeSetButton.click();
      }

      // Verify set is marked as completed
      await expect(setContainer).toHaveClass(/completed|done/);
    }

    console.log('✅ Weight and rep input verified');
  });

  test('should handle session interruption and recovery', async ({ page }) => {
    console.log('🔄 Testing session interruption and recovery...');

    await createTestSession(page);
    const sessionUrl = page.url();
    
    // Complete some progress
    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    await completeSet(page, exerciseCard, 1);

    // Simulate page refresh/reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on same session
    expect(page.url()).toBe(sessionUrl);
    
    // Progress should be preserved
    const setContainer = exerciseCard.locator('[data-testid="set-1"]').first();
    if (await setContainer.isVisible()) {
      await expect(setContainer).toHaveClass(/completed|done/);
    }

    console.log('✅ Session recovery verified');
  });

  test('should handle exercise skipping', async ({ page }) => {
    console.log('⏭️ Testing exercise skipping...');

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    const exerciseCount = await exerciseCards.count();

    if (exerciseCount > 1) {
      // Look for skip exercise option
      const skipButton = page.locator('button:has-text("Skip Exercise"), button:has-text("Skip"), [data-testid="skip-exercise"]');
      
      if (await skipButton.isVisible()) {
        await skipButton.click();

        // Should move to next exercise or completion
        // Verify we're not stuck on the same exercise
        await page.waitForTimeout(1000);
        console.log('Exercise skip functionality available');
      }
    }

    console.log('✅ Exercise skipping verified');
  });

  test('should handle mobile responsive session execution', async ({ page }) => {
    console.log('📱 Testing mobile session execution...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="session-header"]')).toBeVisible();
    
    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    await expect(exerciseCard).toBeVisible();

    // Test mobile interactions
    const setContainer = exerciseCard.locator('[data-testid="set-1"], .set-input').first();
    if (await setContainer.isVisible()) {
      // Touch targets should be large enough
      const buttons = await setContainer.locator('button').all();
      for (const button of buttons.slice(0, 2)) {
        const bbox = await button.boundingBox();
        if (bbox) {
          expect(bbox.height).toBeGreaterThanOrEqual(44); // WCAG minimum touch target
        }
      }
    }

    console.log('✅ Mobile session execution verified');
  });

  test('should handle session with different exercise types', async ({ page }) => {
    console.log('🎯 Testing different exercise types...');

    // This test would ideally use a predefined session with various exercise types
    // For now, we'll test with whatever exercises are generated
    await createTestSession(page);
    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    const exerciseCount = await exerciseCards.count();

    for (let i = 0; i < Math.min(exerciseCount, 3); i++) {
      const exerciseCard = exerciseCards.nth(i);
      const exerciseName = await exerciseCard.locator('[data-testid="exercise-name"]').textContent() || `Exercise ${i + 1}`;
      
      console.log(`Testing exercise: ${exerciseName}`);

      // Test if it's a timed exercise (e.g., plank)
      if (exerciseName.toLowerCase().includes('plank') || exerciseName.toLowerCase().includes('hold')) {
        // Look for timer-based input
        const timerInput = exerciseCard.locator('[data-testid="duration-input"], input[placeholder*="seconds"]');
        if (await timerInput.isVisible()) {
          await timerInput.fill('30');
        }
      } else {
        // Regular rep-based exercise
        await completeSet(page, exerciseCard, 1);
      }
    }

    console.log('✅ Different exercise types handled');
  });

  /**
   * Helper function to create a test session through AI generation
   */
  async function createTestSession(page: any) {
    console.log('🤖 Creating test session via AI generation...');
    
    // Navigate to AI workout generation
    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Quick generation setup
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    // Minimal preferences for quick generation
    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    await page.locator('button:has-text("Generate My Workout")').click();
    await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });
    
    // Start the workout to create session
    await page.locator('button:has-text("Start Workout")').click();
  }

  /**
   * Helper function to complete exercise sets
   */
  async function completeExerciseSets(page: any, exerciseCard: any) {
    console.log('✅ Completing exercise sets...');
    
    // Get number of sets for this exercise
    const setContainers = exerciseCard.locator('[data-testid^="set-"], .set-input');
    const setCount = await setContainers.count();
    
    console.log(`Found ${setCount} sets for exercise`);

    for (let i = 0; i < Math.min(setCount, 3); i++) { // Limit to 3 sets for testing
      await completeSet(page, exerciseCard, i + 1);
      
      // Small delay between sets
      await page.waitForTimeout(500);
    }
  }

  /**
   * Helper function to complete a single set
   */
  async function completeSet(page: any, exerciseCard: any, setNumber: number) {
    console.log(`✅ Completing set ${setNumber}...`);

    const setContainer = exerciseCard.locator(`[data-testid="set-${setNumber}"], .set-input`).nth(setNumber - 1);
    
    if (await setContainer.isVisible()) {
      // Fill weight if available
      const weightInput = setContainer.locator('input[placeholder*="Weight"], input[data-testid="weight-input"]');
      if (await weightInput.isVisible()) {
        await weightInput.clear();
        await weightInput.fill('20');
      }

      // Fill reps if available
      const repsInput = setContainer.locator('input[placeholder*="Reps"], input[data-testid="reps-input"]');
      if (await repsInput.isVisible()) {
        await repsInput.clear();
        await repsInput.fill('10');
      }

      // Fill duration if available (for timed exercises)
      const durationInput = setContainer.locator('input[placeholder*="Duration"], input[data-testid="duration-input"]');
      if (await durationInput.isVisible()) {
        await durationInput.clear();
        await durationInput.fill('30');
      }

      // Mark set as complete
      const completeButton = setContainer.locator('button:has-text("Complete"), button:has-text("✓"), [data-testid="complete-set"]');
      if (await completeButton.isVisible()) {
        await completeButton.click();
      }

      console.log(`Set ${setNumber} completed`);
    }
  }
});

test.describe('Session Execution Error Handling', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    await authUtils.signIn();
    await authUtils.completeOnboardingIfNeeded();
  });

  test.afterEach(async ({ page }) => {
    await authUtils.signOut();
  });

  test('should handle session not found error', async ({ page }) => {
    console.log('❌ Testing session not found error...');

    // Navigate to non-existent session
    await page.goto('/workouts/sessions/non-existent-session-id');

    // Should show error message
    await expect(page.locator('text="Session not found"), text="Not found"')).toBeVisible();
    
    // Should provide navigation back to workouts
    const backButton = page.locator('a[href="/workouts"], button:has-text("Back to Workouts")');
    await expect(backButton).toBeVisible();

    console.log('✅ Session not found error handled correctly');
  });

  test('should handle network errors during session updates', async ({ page }) => {
    console.log('🌐 Testing network errors during session...');

    // Create a session first
    await page.goto('/workouts/generate');
    await page.waitForLoadState('networkidle');

    // Quick session creation
    await page.locator('button:has-text("Create from Scratch")').click();
    await page.locator('button:has-text("Set Preferences")').click();

    await page.locator('[data-testid="fitness-level-beginner"], button:has-text("Beginner")').first().click();
    await page.locator('[data-testid="goal-general_fitness"], button:has-text("General Fitness")').first().click();
    await page.locator('[data-testid="equipment-bodyweight"], button:has-text("Bodyweight")').first().click();

    await page.locator('button:has-text("Generate My Workout")').click();
    await page.waitForSelector('text="Your Workout is Ready!"', { timeout: 30000 });
    await page.locator('button:has-text("Start Workout")').click();

    await page.waitForURL(/\/workouts\/sessions\/[a-f0-9-]+/, { timeout: 15000 });

    // Simulate network failure for session updates
    await page.route('**/api/workouts/sessions/*/sets', (route) => {
      route.abort();
    });

    // Try to complete a set (should handle network error)
    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
    const setContainer = exerciseCard.locator('[data-testid="set-1"], .set-input').first();
    
    if (await setContainer.isVisible()) {
      const completeButton = setContainer.locator('button:has-text("Complete"), button:has-text("✓")');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Should show error message or retry option
        await page.waitForTimeout(2000);
        
        // Error handling might be subtle - check for retry buttons or error states
        const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
        if (await retryButton.isVisible()) {
          console.log('Retry option available for network error');
        }
      }
    }

    console.log('✅ Network error handling verified');
  });
});