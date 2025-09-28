import { test, expect } from '@playwright/test';

// Placeholder spec that will fail until the UI + API flow is implemented.

test.describe('Create Workout Plan via UI', () => {
  test('coach can draft and submit a new plan', async ({ page }) => {
    await page.goto('/workouts/plans');

    const newPlanButton = page.getByRole('button', { name: 'New plan' });
    await expect(newPlanButton).toBeVisible();
    await newPlanButton.click();

    await page.getByLabel('Plan name').fill('Sedentary Strength Builder');
    await page.getByLabel('Duration (weeks)').fill('4');
    await page.getByLabel('Sessions per week').fill('3');

    await page.getByRole('button', { name: 'Create plan' }).click();

    await expect(page.getByRole('status')).toContainText('created successfully');
    const planHeading = page
      .getByRole('heading', { name: 'Sedentary Strength Builder' })
      .first();
    await expect(planHeading).toBeVisible();
  });
});
