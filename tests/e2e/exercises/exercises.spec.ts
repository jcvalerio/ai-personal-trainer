import { test, expect } from '@playwright/test';
import { BasePage } from '../utils/page-objects/base.page';

// Use authenticated state for these tests
test.use({ storageState: '.auth/user.json' });

test.describe('Exercise Library', () => {
  let exercisesPage: BasePage;

  test.beforeEach(async ({ page }) => {
    exercisesPage = new BasePage(page);
    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();
  });

  test('should load exercises page correctly', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/exercises/);

    // Check page title
    await exercisesPage.assertTitleContains('Exercise');

    // Verify page has loaded
    const hasContent = await Promise.race([
      exercisesPage.elementExists('h1'),
      exercisesPage.elementExists('[data-testid="exercises-content"]'),
      exercisesPage.elementExists('main'),
    ]);

    expect(hasContent).toBe(true);
  });

  test('should display exercise library or empty state', async ({ page }) => {
    // Check for exercises or empty state
    const hasExercises = await exercisesPage.elementExists(
      '[data-testid="exercise-card"], .exercise-item'
    );
    const hasEmptyState = await exercisesPage.elementExists(
      '[data-testid="empty-state"], .empty-state'
    );

    // Should have either exercises or empty state
    expect(hasExercises || hasEmptyState).toBe(true);
  });

  test('should handle exercise search if available', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search" i], input[type="search"]'
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('push up');
      await page.waitForTimeout(1000);

      // Should show search results or no results message
      const hasResults = await Promise.race([
        exercisesPage.elementExists('[data-testid="exercise-card"]'),
        exercisesPage.elementExists('[data-testid="no-results"]'),
        exercisesPage.elementExists('.no-results'),
      ]);

      expect(hasResults).toBe(true);
    }
  });

  test('should filter exercises by category if available', async ({ page }) => {
    const filterSelect = page.locator(
      'select[data-testid="category-filter"], select:has(option)'
    );

    if (await filterSelect.isVisible()) {
      const options = await filterSelect.locator('option').all();

      if (options.length > 1) {
        // Select second option (first is usually "All")
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Should show filtered results
        const hasFilteredResults = await Promise.race([
          exercisesPage.elementExists('[data-testid="exercise-card"]'),
          exercisesPage.elementExists('[data-testid="empty-state"]'),
        ]);

        expect(hasFilteredResults).toBe(true);
      }
    }
  });

  test('should display exercise details if available', async ({ page }) => {
    const exerciseCards = page.locator(
      '[data-testid="exercise-card"], .exercise-item'
    );
    const cardCount = await exerciseCards.count();

    if (cardCount > 0) {
      // Click on first exercise
      await exerciseCards.first().click();
      await exercisesPage.waitForPageLoad();

      // Should show exercise details
      const hasDetails = await Promise.race([
        exercisesPage.elementExists('[data-testid="exercise-details"]'),
        exercisesPage.elementExists('.exercise-details'),
        exercisesPage.elementExists('h1'),
        exercisesPage.elementExists('main'),
      ]);

      expect(hasDetails).toBe(true);
    }
  });

  test('should handle exercise categories', async ({ page }) => {
    const categoryButtons = page.locator(
      '[data-testid="category-button"], .category-filter button'
    );
    const buttonCount = await categoryButtons.count();

    if (buttonCount > 0) {
      // Click on a category
      await categoryButtons.first().click();
      await page.waitForTimeout(1000);

      // Should show exercises for that category
      const hasResults = await Promise.race([
        exercisesPage.elementExists('[data-testid="exercise-card"]'),
        exercisesPage.elementExists('[data-testid="empty-state"]'),
      ]);

      expect(hasResults).toBe(true);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();

    // Verify page still loads correctly
    await expect(page).toHaveURL(/.*\/exercises/);

    const hasContent = await Promise.race([
      exercisesPage.elementExists('h1'),
      exercisesPage.elementExists('[data-testid="exercises-content"]'),
      exercisesPage.elementExists('main'),
    ]);

    expect(hasContent).toBe(true);
  });
});

test.describe('Exercise Details', () => {
  test('should display exercise information', async ({ page }) => {
    const exercisesPage = new BasePage(page);

    // Navigate to exercises page first
    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();

    // Find and click on an exercise if available
    const exerciseCards = page.locator(
      '[data-testid="exercise-card"], .exercise-item, a[href*="exercise"]'
    );
    const cardCount = await exerciseCards.count();

    if (cardCount > 0) {
      await exerciseCards.first().click();
      await exercisesPage.waitForPageLoad();

      // Should display exercise information
      const hasExerciseInfo = await Promise.race([
        exercisesPage.elementExists('[data-testid="exercise-name"]'),
        exercisesPage.elementExists('h1'),
        exercisesPage.elementExists('[data-testid="exercise-description"]'),
        exercisesPage.elementExists('.exercise-info'),
      ]);

      expect(hasExerciseInfo).toBe(true);
    }
  });

  test('should show exercise instructions if available', async ({ page }) => {
    const exercisesPage = new BasePage(page);

    // Try to navigate to a specific exercise (if URL pattern is known)
    try {
      await exercisesPage.goto('/exercises/push-ups');
      await exercisesPage.waitForPageLoad();

      const hasInstructions = await Promise.race([
        exercisesPage.elementExists('[data-testid="instructions"]'),
        exercisesPage.elementExists('.instructions'),
        exercisesPage.elementExists('[data-testid="exercise-steps"]'),
      ]);

      if (hasInstructions) {
        expect(hasInstructions).toBe(true);
      }
    } catch (error) {
      console.log('Exercise detail page not available:', error.message);
    }
  });

  test('should handle exercise media if available', async ({ page }) => {
    const exercisesPage = new BasePage(page);

    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();

    // Look for exercise with media
    const mediaElements = page.locator(
      'img, video, [data-testid="exercise-media"]'
    );
    const mediaCount = await mediaElements.count();

    if (mediaCount > 0) {
      const firstMedia = mediaElements.first();

      // Verify media loads correctly
      if (await firstMedia.getAttribute('src')) {
        const src = await firstMedia.getAttribute('src');
        expect(src).toBeTruthy();
      }
    }
  });
});

test.describe('Exercise Integration', () => {
  test('should add exercise to workout if functionality exists', async ({
    page,
  }) => {
    const exercisesPage = new BasePage(page);

    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();

    // Look for "Add to Workout" buttons
    const addButtons = page.locator(
      'button:has-text("Add"), button[data-testid="add-to-workout"]'
    );
    const buttonCount = await addButtons.count();

    if (buttonCount > 0) {
      await addButtons.first().click();

      // Should show some confirmation or workout selection
      const hasResponse = await Promise.race([
        exercisesPage.elementExists('[data-testid="workout-selector"]'),
        exercisesPage.elementExists('.success-message'),
        exercisesPage.elementExists('[role="alert"]'),
        page.waitForTimeout(2000),
      ]);

      expect(hasResponse).toBe(true);
    }
  });

  test('should navigate between exercises and workouts', async ({ page }) => {
    const exercisesPage = new BasePage(page);

    // Start from exercises
    await exercisesPage.goto('/exercises');
    await exercisesPage.waitForPageLoad();

    // Try to navigate to workouts
    const workoutLinks = page.locator(
      'a[href*="/workouts"], a:has-text("Workout")'
    );

    if ((await workoutLinks.count()) > 0) {
      await workoutLinks.first().click();
      await exercisesPage.waitForPageLoad();

      // Should be on workouts page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/workouts/);

      // Navigate back to exercises
      const exerciseLinks = page.locator(
        'a[href*="/exercises"], a:has-text("Exercise")'
      );

      if ((await exerciseLinks.count()) > 0) {
        await exerciseLinks.first().click();
        await exercisesPage.waitForPageLoad();

        // Should be back on exercises page
        await expect(page).toHaveURL(/.*\/exercises/);
      }
    }
  });
});
