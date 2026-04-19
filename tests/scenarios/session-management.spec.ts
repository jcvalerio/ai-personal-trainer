/**
 * SCENARIO: Session Management
 *
 * Behavioral validation for docs/specs/features/session-management.md
 * This file is the "holdout set" — agents implementing the feature should NOT read this file.
 *
 * Prerequisite: The seed creates an active plan with sessions.
 * Seed: prisma/seeds/session-management.ts
 */
import { test, expect, Page } from '@playwright/test';

// These IDs match the session-management seed data
const SEED_USER_ID = '11111111-2222-3333-4444-555555555555';
const SEED_PLAN_ID = '00000000-1111-2222-3333-444444444444';

/**
 * Helper: Create a plan, start it, then navigate to the first session.
 * Used when we need a fresh session to test against.
 */
async function createPlanAndGetSessionPage(page: Page) {
  await page.goto('/workouts/plans');

  const planName = `Session Test ${Date.now()}`;
  await page.getByRole('button', { name: /new plan/i }).click();
  await page.getByLabel(/plan name/i).fill(planName);
  await page.getByLabel(/duration/i).fill('4');
  await page.getByLabel(/sessions per week/i).fill('3');
  await page.getByRole('button', { name: /create plan/i }).click();
  await expect(page.getByText(/created successfully/i)).toBeVisible();

  // Navigate to plan detail
  await page.reload();
  const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
  const planId = await planCard.getAttribute('data-plan-id');
  await page.goto(`/workouts/plans/${planId}`);
  await page.waitForLoadState('networkidle');

  // Start the plan to generate sessions
  await page.getByRole('button', { name: /start plan/i }).click();
  await expect(page.getByText(/active/i).first()).toBeVisible();

  return planId;
}

test.describe('Scenario: Session Management', () => {
  test('session detail shows exercises grouped by phase', async ({ page }) => {
    const planId = await createPlanAndGetSessionPage(page);

    // Click on first session to view details
    const sessionLink = page.locator('[data-session-id]').first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();

    // Session detail page should show exercise phases
    await expect(page.getByText(/main/i).first()).toBeVisible();
  });

  test('can start a draft session', async ({ page }) => {
    const planId = await createPlanAndGetSessionPage(page);

    // Navigate to first session
    const sessionLink = page.locator('[data-session-id]').first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();

    // Should see start button
    const startButton = page.getByRole('button', { name: /start workout/i });
    await expect(startButton).toBeVisible();

    // Start the session
    await startButton.click();

    // Session should now be active
    await expect(page.getByText(/active/i).first()).toBeVisible();
  });

  test('can complete a session with effort rating', async ({ page }) => {
    const planId = await createPlanAndGetSessionPage(page);

    // Navigate to first session
    const sessionLink = page.locator('[data-session-id]').first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();

    // Start the session first
    await page.getByRole('button', { name: /start workout/i }).click();
    await expect(page.getByText(/active/i).first()).toBeVisible();

    // Complete the session
    const completeButton = page.getByRole('button', { name: /complete workout/i });
    await expect(completeButton).toBeVisible();
    await completeButton.click();

    // Fill completion dialog
    // Look for effort rating input and notes
    const effortInput = page.getByLabel(/effort/i);
    if (await effortInput.isVisible()) {
      await effortInput.fill('7');
    }
    const notesInput = page.getByLabel(/notes/i);
    if (await notesInput.isVisible()) {
      await notesInput.fill('Good session');
    }

    // Confirm completion
    const confirmButton = page.getByRole('button', { name: /confirm|complete|submit/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Session should now be completed
    await expect(page.getByText(/completed/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('completed session does not show start button', async ({ page }) => {
    const planId = await createPlanAndGetSessionPage(page);

    const sessionLink = page.locator('[data-session-id]').first();
    await expect(sessionLink).toBeVisible({ timeout: 10000 });
    await sessionLink.click();

    // Start then complete
    await page.getByRole('button', { name: /start workout/i }).click();
    await expect(page.getByText(/active/i).first()).toBeVisible();

    const completeButton = page.getByRole('button', { name: /complete workout/i });
    await completeButton.click();

    const confirmButton = page.getByRole('button', { name: /confirm|complete|submit/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(page.getByText(/completed/i).first()).toBeVisible({ timeout: 10000 });

    // Neither start nor complete buttons should be visible
    await expect(page.getByRole('button', { name: /start workout/i })).not.toBeVisible();
  });
});
