import { test, expect, Page } from '@playwright/test';

const PLAN_PREFIX = 'E2E Start Plan';

async function createDraftPlan(page: Page, name: string) {
  await page.getByRole('button', { name: 'New plan' }).click();
  await page.getByLabel('Plan name').fill(name);
  await page.getByLabel('Duration (weeks)').fill('4');
  await page.getByLabel('Sessions per week').fill('3');
  await page.getByRole('button', { name: 'Create plan' }).click();
  await expect(page.getByRole('status')).toContainText('created successfully');
}

test.describe('Start Workout Plan', () => {
  test('coach can start a newly created plan and see it become active', async ({ page }) => {
    await page.goto('/workouts/plans');

    const planName = `${PLAN_PREFIX} ${Date.now()}`;
    await createDraftPlan(page, planName);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();

    const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
    await expect(planCard).toBeVisible();
    const planId = await planCard.getAttribute('data-plan-id');
    expect(planId).toBeTruthy();

    await page.goto(`/workouts/plans/${planId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: planName, level: 1 })).toBeVisible();

    const startButton = page.getByRole('button', { name: /start plan/i });
    await expect(startButton).toBeVisible();

    await startButton.click();

    const confirmationDialog = page.getByRole('dialog');
    await expect(confirmationDialog).toBeVisible();
    await expect(confirmationDialog).toContainText(/will activate the plan and generate the first week of scheduled sessions/i);

    await confirmationDialog.getByRole('button', { name: /confirm start/i }).click();

    await expect(page.getByRole('status')).toHaveText(/is now active/i);
    await expect(page.locator('span', { hasText: 'Active' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /start plan/i })).toHaveCount(0);
  });
});
