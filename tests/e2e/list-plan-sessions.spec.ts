import { test, expect, Page } from '@playwright/test';

async function createAndStartPlan(page: Page, name: string) {
  await page.goto('/workouts/plans');
  await page.getByRole('button', { name: 'New plan' }).click();
  await page.getByLabel('Plan name').fill(name);
  await page.getByLabel('Duration (weeks)').fill('4');
  await page.getByLabel('Sessions per week').fill('3');
  await page.getByRole('button', { name: 'Create plan' }).click();
  await expect(page.getByRole('status')).toContainText('created successfully');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();

  const planCard = page.locator('[data-plan-id]').filter({ hasText: name }).first();
  await expect(planCard).toBeVisible();
  const planId = await planCard.getAttribute('data-plan-id');
  expect(planId).toBeTruthy();

  await page.goto(`/workouts/plans/${planId}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();

  const startButton = page.getByRole('button', { name: /start plan/i });
  await expect(startButton).toBeVisible();
  await startButton.click();
  await expect(page.getByRole('status')).toHaveText(/is now active/i);
}

test.describe('List Plan Sessions', () => {
  test('shows generated sessions after starting a plan', async ({ page }) => {
    const planName = `E2E Sessions ${Date.now()}`;
    await createAndStartPlan(page, planName);

    const sessionsSection = page.getByRole('region', { name: /sessions/i });
    await expect(sessionsSection).toContainText(planName);
    await expect(sessionsSection).toContainText(/Active/i);
  });

  test('shows empty state when plan has no sessions', async ({ page }) => {
    await page.goto('/workouts/plans');
    const planName = `E2E Sessions Empty ${Date.now()}`;
    await page.getByRole('button', { name: 'New plan' }).click();
    await page.getByLabel('Plan name').fill(planName);
    await page.getByLabel('Duration (weeks)').fill('4');
    await page.getByLabel('Sessions per week').fill('3');
    await page.getByRole('button', { name: 'Create plan' }).click();
    await expect(page.getByRole('status')).toContainText('created successfully');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();

    const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
    await expect(planCard).toBeVisible();
    const planId = await planCard.getAttribute('data-plan-id');
    expect(planId).toBeTruthy();

    await page.goto(`/workouts/plans/${planId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: planName, level: 1 })).toBeVisible();
    await expect(page.getByText(/No sessions yet/i)).toBeVisible();
  });
});
