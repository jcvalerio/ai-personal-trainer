/**
 * SCENARIO: View Workout Plan
 *
 * Behavioral validation for docs/specs/features/view-workout-plan.md
 * This file is the "holdout set" — agents implementing the feature should NOT read this file.
 * Agents read the SPEC. We run these SCENARIOS to validate.
 */
import { test, expect } from '@playwright/test';

const SEED_PLAN_ID = '00000000-1111-2222-3333-444444444444';
const SEED_PLAN_NAME = 'Sedentary Strength Builder';

test.describe('Scenario: View Workout Plan', () => {
  test('displays plan name, duration, sessions per week, and status', async ({ page }) => {
    await page.goto(`/workouts/plans/${SEED_PLAN_ID}`);

    // Plan name as h1
    await expect(page.getByRole('heading', { name: SEED_PLAN_NAME, level: 1 })).toBeVisible();

    // Key metadata visible — scope to header to avoid matching macrocycle section
    const header = page.locator('header').first();
    await expect(header.getByText('4 weeks')).toBeVisible();
    await expect(header.getByText(/3 sessions?\s*\/?\s*week/i)).toBeVisible();

    // Status badge
    await expect(page.getByText('Draft', { exact: false }).first()).toBeVisible();
  });

  test('shows weekly schedule with workout and rest days', async ({ page }) => {
    await page.goto(`/workouts/plans/${SEED_PLAN_ID}`);

    // Schedule section exists and shows workout days
    await expect(page.getByText('Monday')).toBeVisible();
    await expect(page.getByText('Wednesday')).toBeVisible();
    await expect(page.getByText('Friday')).toBeVisible();

    // Shows workout name on workout days
    await expect(page.getByText('Full Body Primer').first()).toBeVisible();

    // Shows rest days
    await expect(page.getByText(/rest/i).first()).toBeVisible();
  });

  test('shows macrocycle information', async ({ page }) => {
    await page.goto(`/workouts/plans/${SEED_PLAN_ID}`);

    // Macrocycle phase visible
    await expect(page.getByText('Foundation')).toBeVisible();
  });

  test('returns 404 state for non-existent plan', async ({ page }) => {
    await page.goto('/workouts/plans/00000000-0000-0000-0000-000000000000');

    // Should show some error/not-found state — not crash
    await expect(
      page.getByText(/not found|error|doesn't exist/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
