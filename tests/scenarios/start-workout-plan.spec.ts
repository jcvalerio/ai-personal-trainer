/**
 * SCENARIO: Start Workout Plan
 *
 * Behavioral validation for docs/specs/features/start-workout-plan.md
 * This file is the "holdout set" — agents implementing the feature should NOT read this file.
 */
import { test, expect, Page } from '@playwright/test';

async function createAndNavigateToPlan(page: Page): Promise<string> {
  await page.goto('/workouts/plans');

  const planName = `Start Test ${Date.now()}`;
  await page.getByRole('button', { name: /new plan/i }).click();
  await page.getByLabel(/plan name/i).fill(planName);
  await page.getByLabel(/duration/i).fill('4');
  await page.getByLabel(/sessions per week/i).fill('3');
  await page.getByRole('button', { name: /create plan/i }).click();
  await expect(page.getByText(/created successfully/i)).toBeVisible();

  // Navigate to the plan detail page
  await page.reload();
  const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
  await expect(planCard).toBeVisible();
  const planId = await planCard.getAttribute('data-plan-id');
  await page.goto(`/workouts/plans/${planId}`);
  await page.waitForLoadState('networkidle');

  return planName;
}

test.describe('Scenario: Start Workout Plan', () => {
  test('starting a draft plan changes status to active', async ({ page }) => {
    const planName = await createAndNavigateToPlan(page);

    // Verify draft status and start button — use level: 1 to target h1 only
    await expect(page.getByRole('heading', { name: planName, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /start plan/i })).toBeVisible();

    // Start the plan
    await page.getByRole('button', { name: /start plan/i }).click();

    // Verify active status
    await expect(page.getByText(/active/i).first()).toBeVisible();

    // Start button should disappear
    await expect(page.getByRole('button', { name: /start plan/i })).not.toBeVisible();
  });

  test('starting a plan generates sessions', async ({ page }) => {
    await createAndNavigateToPlan(page);

    await page.getByRole('button', { name: /start plan/i }).click();

    // Wait for status change
    await expect(page.getByText(/active/i).first()).toBeVisible();

    // Sessions should appear — plan has 3 sessions/week so expect at least 1 session visible
    await expect(page.getByText(/session/i).first()).toBeVisible();
  });
});
