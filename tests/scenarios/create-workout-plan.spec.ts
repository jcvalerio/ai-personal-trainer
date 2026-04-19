/**
 * SCENARIO: Create Workout Plan via UI
 *
 * Behavioral validation for docs/specs/features/create-workout-plan.md
 * This file is the "holdout set" — agents implementing the feature should NOT read this file.
 */
import { test, expect } from '@playwright/test';

test.describe('Scenario: Create Workout Plan', () => {
  test('coach creates a plan and sees it in the list', async ({ page }) => {
    await page.goto('/workouts/plans');

    // Open new plan dialog
    await page.getByRole('button', { name: /new plan/i }).click();

    // Fill form
    const planName = `Test Plan ${Date.now()}`;
    await page.getByLabel(/plan name/i).fill(planName);
    await page.getByLabel(/duration/i).fill('6');
    await page.getByLabel(/sessions per week/i).fill('4');

    // Submit
    await page.getByRole('button', { name: /create plan/i }).click();

    // Verify success
    await expect(page.getByText(/created successfully/i)).toBeVisible();

    // Verify plan appears (either navigated to detail or visible in list)
    await expect(page.getByText(planName).first()).toBeVisible();
  });

  test('validation prevents empty plan name', async ({ page }) => {
    await page.goto('/workouts/plans');
    await page.getByRole('button', { name: /new plan/i }).click();

    // Fill everything except name
    await page.getByLabel(/duration/i).fill('4');
    await page.getByLabel(/sessions per week/i).fill('3');

    // Submit
    await page.getByRole('button', { name: /create plan/i }).click();

    // Should show validation error, dialog should stay open
    await expect(page.getByLabel(/plan name/i)).toBeVisible();

    // Should NOT show success
    await expect(page.getByText(/created successfully/i)).not.toBeVisible();
  });

  test('created plan has draft status', async ({ page }) => {
    await page.goto('/workouts/plans');
    await page.getByRole('button', { name: /new plan/i }).click();

    const planName = `Draft Check ${Date.now()}`;
    await page.getByLabel(/plan name/i).fill(planName);
    await page.getByLabel(/duration/i).fill('4');
    await page.getByLabel(/sessions per week/i).fill('3');
    await page.getByRole('button', { name: /create plan/i }).click();
    await expect(page.getByText(/created successfully/i)).toBeVisible();

    // Navigate to the plan and verify draft status
    // The plan should be in draft status by default
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });
});
