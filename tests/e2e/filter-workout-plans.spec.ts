import { test, expect } from '@playwright/test';

test.describe('Filter Workout Plans', () => {
  test('coach can search plans and combine search with a status filter', async ({ page }) => {
    await page.goto('/workouts/plans');

    await expect(page.getByRole('heading', { name: 'Workout Plans', level: 1 })).toBeVisible();

    await page.getByLabel('Search plans').fill('mobility');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Mobility Builder' })).toBeVisible();
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Recovery Reset' })).toBeVisible();
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Sedentary Strength Builder' })).toHaveCount(0);

    await page.getByLabel('Status').selectOption('active');

    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Mobility Builder' })).toBeVisible();
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Recovery Reset' })).toHaveCount(0);
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Sedentary Strength Builder' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('coach sees a filtered empty state and can clear filters', async ({ page }) => {
    await page.goto('/workouts/plans');

    await page.getByLabel('Search plans').fill('no-match-value');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.getByText('No plans match the current filters')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Sedentary Strength Builder' })).toBeVisible();
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Mobility Builder' })).toBeVisible();
    await expect(page.locator('[data-plan-id]').filter({ hasText: 'Recovery Reset' })).toBeVisible();
    await expect(page.getByLabel('Search plans')).toHaveValue('');
    await expect(page.getByLabel('Status')).toHaveValue('');
  });
});
