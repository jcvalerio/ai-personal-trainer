import { test, expect } from '@playwright/test';

test.describe('Create Workout Plan via UI', () => {
  test('coach can draft and submit a new plan', async ({ page }) => {
    const planName = `UI Plan ${Date.now()}`;

    await page.goto('/workouts/plans');

    const newPlanButton = page.getByRole('button', { name: 'New plan' });
    await expect(newPlanButton).toBeVisible();
    await newPlanButton.click();

    await page.getByLabel('Plan name').fill(planName);
    await page.getByLabel('Duration (weeks)').fill('4');
    await page.getByLabel('Sessions per week').fill('3');

    await page.getByRole('button', { name: 'Create plan' }).click();

    await expect(page.getByRole('status')).toContainText('created successfully');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();

    const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
    await expect(planCard).toBeVisible();
    await expect(planCard).toContainText('Draft');
  });
});
