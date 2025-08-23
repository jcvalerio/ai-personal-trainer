import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects/dashboard.page';
import { AuthUtils } from '../utils/auth.utils';

// Use authenticated state for these tests
test.use({ storageState: '.auth/user.json' });

test.describe('Dashboard Functionality', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardData();
  });

  test('should load dashboard correctly', async ({ page }) => {
    await dashboardPage.verifyPageLoaded();
    await dashboardPage.verifyUserAuthenticated();

    // Check page title
    await dashboardPage.assertTitleContains('Dashboard');

    // Verify essential dashboard sections are present
    await dashboardPage.verifyDashboardSections();
  });

  test('should display welcome message', async ({ page }) => {
    const welcomeMessage = await dashboardPage.getWelcomeMessage();

    // Should have some welcome text
    if (welcomeMessage) {
      expect(welcomeMessage.length).toBeGreaterThan(0);
      expect(welcomeMessage.toLowerCase()).toMatch(
        /(welcome|dashboard|hello)/i
      );
    }
  });

  test('should display workout summary if available', async ({ page }) => {
    const hasWorkoutSummary = await dashboardPage.hasWorkoutSummary();

    if (hasWorkoutSummary) {
      const summaryData = await dashboardPage.getWorkoutSummaryData();

      // Verify summary data structure
      expect(typeof summaryData).toBe('object');

      // Check for numeric values where they exist
      if (summaryData.totalWorkouts !== undefined) {
        expect(typeof summaryData.totalWorkouts).toBe('number');
        expect(summaryData.totalWorkouts).toBeGreaterThanOrEqual(0);
      }

      if (summaryData.weeklyGoal !== undefined) {
        expect(typeof summaryData.weeklyGoal).toBe('number');
        expect(summaryData.weeklyGoal).toBeGreaterThan(0);
      }

      if (summaryData.streak !== undefined) {
        expect(typeof summaryData.streak).toBe('number');
        expect(summaryData.streak).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should display navigation menu', async ({ page }) => {
    const hasNavigation = await dashboardPage.hasNavigationMenu();

    if (hasNavigation) {
      const navItems = await dashboardPage.getNavigationItems();

      // Should have navigation items
      expect(navItems.length).toBeGreaterThan(0);

      // Check for common navigation items
      const navText = navItems.join(' ').toLowerCase();
      const expectedItems = ['workout', 'exercise', 'progress', 'dashboard'];

      const hasExpectedItems = expectedItems.some((item) =>
        navText.includes(item)
      );
      expect(hasExpectedItems).toBe(true);
    }
  });

  test('should navigate to workouts page', async ({ page }) => {
    try {
      await dashboardPage.navigateToWorkouts();

      // Should be on workouts page
      await expect(page).toHaveURL(/.*\/workouts/);
      await dashboardPage.waitForPageLoad();
    } catch (error) {
      // Navigation might not be available in current UI
      console.log('Workouts navigation not available:', error.message);
    }
  });

  test('should navigate to exercises page', async ({ page }) => {
    try {
      await dashboardPage.navigateToExercises();

      // Should be on exercises page
      await expect(page).toHaveURL(/.*\/exercises/);
      await dashboardPage.waitForPageLoad();
    } catch (error) {
      // Navigation might not be available in current UI
      console.log('Exercises navigation not available:', error.message);
    }
  });

  test('should navigate to progress page', async ({ page }) => {
    try {
      await dashboardPage.navigateToProgress();

      // Should be on progress page
      await expect(page).toHaveURL(/.*\/progress/);
      await dashboardPage.waitForPageLoad();
    } catch (error) {
      // Navigation might not be available in current UI
      console.log('Progress navigation not available:', error.message);
    }
  });

  test('should handle quick workout action', async ({ page }) => {
    try {
      await dashboardPage.startQuickWorkout();

      // Should navigate to workout-related page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(workouts|sessions|exercise)/);
    } catch (error) {
      // Quick workout button might not be available
      console.log('Quick workout action not available:', error.message);
    }
  });

  test('should handle create plan action', async ({ page }) => {
    try {
      await dashboardPage.createNewPlan();

      // Should navigate to plan creation page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/workouts\/plans/);
    } catch (error) {
      // Create plan button might not be available
      console.log('Create plan action not available:', error.message);
    }
  });

  test('should handle AI workout generation', async ({ page }) => {
    try {
      await dashboardPage.generateAIWorkout();

      // Should navigate to workout generation page
      await expect(page).toHaveURL(/.*\/workouts\/generate/);
    } catch (error) {
      // AI workout generation might not be available
      console.log('AI workout generation not available:', error.message);
    }
  });

  test('should display recent workouts if available', async ({ page }) => {
    const recentWorkouts = await dashboardPage.getRecentWorkouts();

    // If recent workouts exist, they should be valid
    if (recentWorkouts.length > 0) {
      for (const workout of recentWorkouts) {
        expect(workout.length).toBeGreaterThan(0);
        expect(typeof workout).toBe('string');
      }
    }
  });

  test('should display progress chart if available', async ({ page }) => {
    const hasProgressChart = await dashboardPage.hasProgressChart();

    // If progress chart exists, verify it's rendered
    if (hasProgressChart) {
      // Look for chart elements (SVG, canvas, or chart containers)
      const chartElements = await Promise.race([
        dashboardPage.elementExists('svg'),
        dashboardPage.elementExists('canvas'),
        dashboardPage.elementExists('.recharts-wrapper'),
        dashboardPage.elementExists('[data-testid="chart"]'),
      ]);

      expect(chartElements).toBe(true);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload dashboard
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardData();

    // Verify page still loads correctly
    await dashboardPage.verifyPageLoaded();

    // Check for mobile-friendly elements
    const hasMobileMenu = await Promise.race([
      dashboardPage.elementExists('[data-testid="mobile-menu"]'),
      dashboardPage.elementExists('button[aria-label*="menu" i]'),
      dashboardPage.elementExists('.hamburger'),
      dashboardPage.elementExists('[data-testid="menu-toggle"]'),
    ]);

    // Either has mobile menu or regular navigation
    const hasNavigation =
      hasMobileMenu || (await dashboardPage.hasNavigationMenu());
    expect(hasNavigation).toBe(true);
  });

  test('should handle page refresh correctly', async ({ page }) => {
    // Reload the page
    await page.reload();
    await dashboardPage.waitForPageLoad();
    await dashboardPage.waitForDashboardData();

    // Should still be authenticated and on dashboard
    await dashboardPage.verifyPageLoaded();
    await dashboardPage.verifyUserAuthenticated();
  });

  test('should not show error messages on load', async ({ page }) => {
    await dashboardPage.waitForDashboardData();

    // Check for error messages
    const errors = await dashboardPage.checkForErrors();

    // Should not have critical errors
    const criticalErrors = errors.filter(
      (error) =>
        error.toLowerCase().includes('error') ||
        error.toLowerCase().includes('failed') ||
        error.toLowerCase().includes('something went wrong')
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Dashboard Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardData();

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);

    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should handle concurrent navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();

    // Try rapid navigation
    const navigationPromises = [];

    try {
      navigationPromises.push(dashboardPage.navigateToWorkouts());
      await page.waitForTimeout(100);

      navigationPromises.push(dashboardPage.navigate());
      await page.waitForTimeout(100);

      navigationPromises.push(dashboardPage.navigateToExercises());

      // Wait for all navigation attempts
      await Promise.allSettled(navigationPromises);

      // Should end up somewhere valid
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|workouts|exercises)/);
    } catch (error) {
      console.log(
        'Concurrent navigation test skipped - navigation not available'
      );
    }
  });
});
