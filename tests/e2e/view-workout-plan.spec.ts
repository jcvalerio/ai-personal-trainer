import { test, expect } from '@playwright/test';

const DEMO_PLAN_NAME = 'Sedentary Strength Builder';
const DEMO_PLAN_ID = '00000000-1111-2222-3333-444444444444';

// Relies on prisma/seeds/create-workout-plan.ts creating the plan + user.

test.describe('View Workout Plan', () => {
  test('coach can inspect seeded plan details', async ({ page }) => {
    await page.goto('/workouts/plans');

    const planLink = page.locator(`[data-plan-id="${DEMO_PLAN_ID}"]`).first();
    await expect(planLink).toBeVisible();
    await expect(planLink).toContainText(DEMO_PLAN_NAME);

    await planLink.click();

    await expect(page.getByRole('heading', { name: DEMO_PLAN_NAME })).toBeVisible();
    await expect(page.getByText('Draft', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('4 weeks').first()).toBeVisible();
    await expect(page.getByText('3 sessions / week').first()).toBeVisible();

    const macrocycle = page.getByRole('region', { name: /Macrocycle overview/i });
    await expect(macrocycle).toContainText(/build_strength/i);
    await expect(macrocycle).toContainText(/Foundation/);

    const schedule = page.getByRole('region', { name: /Weekly schedule/i });
    await expect(schedule).toContainText(/Monday/);
    await expect(schedule).toContainText(/Full Body Primer/);
    await expect(schedule).toContainText(/Rest day/);

    const templates = page.getByRole('region', { name: /Workout templates/i });
    await expect(templates).toContainText(/Full Body Primer/);
    await expect(templates).toContainText(/strength/i);
  });
});
