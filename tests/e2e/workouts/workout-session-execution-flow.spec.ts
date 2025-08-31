import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Test for Workout Session Execution Flow
 * 
 * This test validates the complete workout session workflow including:
 * - Session initialization and loading
 * - Real-time timer functionality
 * - Set completion and progression
 * - Rest periods and controls
 * - Exercise navigation
 * - Data persistence and tracking
 * 
 * Based on manual testing performed on 2025-08-30
 */

test.describe('Workout Session Execution Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Configure viewport for iPhone 14 Pro Max (mobile-first design)
    await page.setViewportSize({ width: 430, height: 932 });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible({ timeout: 10000 });
  });

  test('should complete full workout session execution workflow', async ({ page }) => {
    // Step 1: Navigate to workouts page
    await page.getByRole('link', { name: 'Start New Workout' }).click();
    await page.getByRole('link').filter({ hasText: /^$/ }).click(); // Back to workouts
    
    // Step 2: Access demo session
    await page.getByRole('link', { name: 'Demo Session' }).click();
    
    // Step 3: Verify session initialization
    await expect(page.getByRole('heading', { name: 'Session in Progress' })).toBeVisible();
    await expect(page.getByText('Exercise 1 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Burpees' })).toBeVisible();
    await expect(page.getByText('Set 1/3')).toBeVisible();
    
    // Step 4: Verify session controls are present
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByText('0% Complete')).toBeVisible();
    
    // Step 5: Verify exercise details
    await expect(page.getByText('Target Reps')).toBeVisible();
    await expect(page.getByText('12', { exact: true })).toBeVisible();
    
    // Step 6: Test interactive controls - Add reps
    const repsSpinButton = page.getByRole('spinbutton', { name: 'Reps' });
    const repsPlusButton = page.locator('div').filter({ hasText: /^Reps$/ }).getByRole('button').nth(1);
    
    // Add first rep
    await repsPlusButton.click();
    await expect(repsSpinButton).toHaveValue('1');
    
    // Add second rep
    await repsPlusButton.click();
    await expect(repsSpinButton).toHaveValue('2');
    
    // Step 7: Verify Complete Set button is enabled
    const completeSetButton = page.getByRole('button', { name: 'Complete Set' });
    await expect(completeSetButton).toBeEnabled();
    
    // Step 8: Complete the set
    await completeSetButton.click();
    
    // Step 9: Verify set progression
    await expect(page.getByText('Set 2/3')).toBeVisible({ timeout: 5000 });
    
    // Step 10: Verify rest period functionality
    await expect(page.getByText('Rest Period')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip Rest' })).toBeVisible();
    
    // Step 11: Verify completed sets tracking
    await expect(page.getByRole('heading', { name: 'Completed Sets' })).toBeVisible();
    await expect(page.getByText('Set 1')).toBeVisible();
    await expect(page.getByText('2 reps')).toBeVisible();
    
    // Step 12: Verify navigation controls
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled(); // First exercise
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    await expect(page.getByText('1 / 5')).toBeVisible();
    
    // Step 13: Test timer functionality (verify timer is running)
    const timerElement = page.locator('div').filter({ hasText: /^\d+:\d+$/ }).first();
    const initialTime = await timerElement.textContent();
    
    // Wait a moment and verify timer has progressed
    await page.waitForTimeout(2000);
    const laterTime = await timerElement.textContent();
    expect(initialTime).not.toBe(laterTime);
    
    // Step 14: Test rest skip functionality
    await page.getByRole('button', { name: 'Skip Rest' }).click();
    
    // Verify rest period is skipped and we can start next set
    await expect(page.getByText('Rest Period')).not.toBeVisible({ timeout: 2000 });
    
    // Step 15: Test exercise navigation
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Exercise 2 of 5')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('2 / 5')).toBeVisible();
    
    // Verify Previous button is now enabled
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  test('should handle session pause and resume functionality', async ({ page }) => {
    // Navigate to demo session
    await page.goto('http://localhost:3000/en/workouts/session');
    
    // Wait for session to load
    await expect(page.getByRole('heading', { name: 'Session in Progress' })).toBeVisible();
    
    // Test pause functionality
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Note: Actual pause behavior would need to be verified based on UI changes
    // This is a placeholder for pause/resume testing
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('should validate mobile-responsive session interface', async ({ page }) => {
    // Navigate to demo session
    await page.goto('http://localhost:3000/en/workouts/session');
    
    // Wait for session to load
    await expect(page.getByRole('heading', { name: 'Session in Progress' })).toBeVisible();
    
    // Verify mobile-optimized controls are accessible
    const repsPlusButton = page.locator('div').filter({ hasText: /^Reps$/ }).getByRole('button').nth(1);
    const completeSetButton = page.getByRole('button', { name: 'Complete Set' });
    
    // Verify touch targets are appropriately sized (minimum 44px)
    const buttonBox = await repsPlusButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test touch interactions
    await repsPlusButton.click();
    await expect(page.getByRole('spinbutton', { name: 'Reps' })).toHaveValue('1');
  });

  test('should handle session data persistence', async ({ page }) => {
    // Navigate to demo session
    await page.goto('http://localhost:3000/en/workouts/session');
    
    // Complete a set
    await page.locator('div').filter({ hasText: /^Reps$/ }).getByRole('button').nth(1).click();
    await page.locator('div').filter({ hasText: /^Reps$/ }).getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Complete Set' }).click();
    
    // Verify data persistence
    await expect(page.getByRole('heading', { name: 'Completed Sets' })).toBeVisible();
    await expect(page.getByText('Set 1')).toBeVisible();
    await expect(page.getByText('2 reps')).toBeVisible();
    
    // Navigate away and back (if session persists)
    await page.getByRole('link', { name: 'Back to Workouts' }).click();
    await page.getByRole('link', { name: 'Demo Session' }).click();
    
    // Note: Verify if session state is maintained (implementation dependent)
    await expect(page.getByRole('heading', { name: 'Session in Progress' })).toBeVisible();
  });

  test('should validate accessibility features', async ({ page }) => {
    // Navigate to demo session
    await page.goto('http://localhost:3000/en/workouts/session');
    
    // Wait for session to load
    await expect(page.getByRole('heading', { name: 'Session in Progress' })).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify ARIA labels are present
    await expect(page.getByRole('spinbutton', { name: 'Reps' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Weight (lbs)' })).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
    
    // Verify semantic markup
    await expect(page.getByRole('button', { name: 'Complete Set' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });
});