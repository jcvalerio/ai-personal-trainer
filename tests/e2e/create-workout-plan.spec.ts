import { test, expect, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasHorizontalOverflow).toBe(false);
}

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

  test('plans page remains usable on a mobile viewport', async ({ page }) => {
    const planName = `UI Mobile Plan ${Date.now()}`;

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/workouts/plans');

    await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Plan templates' })).toBeVisible();

    const newPlanButton = page.getByRole('button', { name: 'New plan' });
    await expect(newPlanButton).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await newPlanButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Plan name')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByLabel('Plan name').fill(planName);
    await page.getByLabel('Duration (weeks)').fill('4');
    await page.getByLabel('Sessions per week').fill('3');
    await page.getByRole('button', { name: 'Create plan' }).click();

    await expect(page.getByRole('status')).toContainText('created successfully');
    await page.reload();

    const planCard = page.locator('[data-plan-id]').filter({ hasText: planName }).first();
    await expect(planCard).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
