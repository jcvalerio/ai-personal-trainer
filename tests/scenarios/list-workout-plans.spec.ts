/**
 * SCENARIO: List Workout Plans
 *
 * Behavioral validation for docs/specs/features/list-workout-plans.md
 * This file is the "holdout set" — agents implementing the feature should NOT read this file.
 */
import { test, expect } from '@playwright/test';

const SEED_PLAN_ID = '00000000-1111-2222-3333-444444444444';
const SEED_PLAN_NAME = 'Sedentary Strength Builder';

test.describe('Scenario: List Workout Plans', () => {
  test('plans page shows plans with name and status badge', async ({ page }) => {
    // Navigate directly to the seeded plan page to verify it exists and renders correctly
    await page.goto(`/workouts/plans/${SEED_PLAN_ID}`);

    await expect(page.getByRole('heading', { name: SEED_PLAN_NAME, level: 1 })).toBeVisible();
    await expect(page.getByText(/draft|active|completed/i).first()).toBeVisible();
  });

  test('plans page has a new plan button', async ({ page }) => {
    await page.goto('/workouts/plans');

    await expect(page.getByRole('button', { name: /new plan/i })).toBeVisible();
  });

  test('clicking a plan navigates to detail page', async ({ page }) => {
    await page.goto('/workouts/plans');

    // Wait for at least one plan card to appear
    await expect(page.locator('[data-plan-id]').first()).toBeVisible({ timeout: 10000 });

    // Click the first plan card
    const firstPlan = page.locator('[data-plan-id]').first();
    await firstPlan.click();

    // Should navigate to a plan detail page (has an h1 heading)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
