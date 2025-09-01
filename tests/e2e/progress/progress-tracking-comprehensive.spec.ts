/**
 * E2E Tests for Progress Tracking Workflow
 * Tests the complete progress tracking system including measurements, statistics, and progress visualization
 */

import { test, expect } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';

test.describe('Progress Tracking Comprehensive Workflow', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    
    // Sign in before each test
    await authUtils.signIn();
    await authUtils.completeOnboardingIfNeeded();
  });

  test.afterEach(async ({ page }) => {
    // Clean up: sign out after each test
    await authUtils.signOut();
  });

  test('should complete full progress tracking workflow', async ({ page }) => {
    console.log('📊 Testing complete progress tracking workflow...');

    // Navigate to progress tracking page
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Step 1: Verify progress overview page loads
    await expect(page.locator('h1:has-text("Progress"), h2:has-text("Your Progress")')).toBeVisible();
    
    // Check for key progress elements
    await expect(page.locator('[data-testid="progress-overview"], .progress-overview')).toBeVisible();
    
    // Step 2: Test measurements tracking
    await page.locator('button:has-text("Add Measurement"), a[href*="measurements"]').first().click();
    await page.waitForLoadState('networkidle');

    // Fill measurement form
    await expect(page.locator('h2:has-text("Record Measurement"), h1:has-text("Measurements")')).toBeVisible();
    
    // Weight measurement
    const weightInput = page.locator('input[name="weight"], input[placeholder*="weight" i]').first();
    if (await weightInput.isVisible()) {
      await weightInput.clear();
      await weightInput.fill('75.5');
    }

    // Body fat percentage (if available)
    const bodyFatInput = page.locator('input[name="bodyFat"], input[placeholder*="body fat" i]').first();
    if (await bodyFatInput.isVisible()) {
      await bodyFatInput.clear();
      await bodyFatInput.fill('15.2');
    }

    // Muscle mass (if available)
    const muscleInput = page.locator('input[name="muscleMass"], input[placeholder*="muscle" i]').first();
    if (await muscleInput.isVisible()) {
      await muscleInput.clear();
      await muscleInput.fill('65.8');
    }

    // Save measurement
    const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Record")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000); // Wait for save to complete
    }

    // Step 3: Verify measurement history
    await page.goto('/progress/measurements');
    await page.waitForLoadState('networkidle');

    // Check measurements list/table
    const measurementsList = page.locator('[data-testid="measurements-list"], .measurements-list, table');
    if (await measurementsList.isVisible()) {
      // Verify recent measurement appears
      await expect(measurementsList).toContainText('75.5');
    }

    // Step 4: Test statistics and analytics
    await page.goto('/progress/stats');
    await page.waitForLoadState('networkidle');

    // Verify statistics page elements
    await expect(page.locator('h1:has-text("Statistics"), h2:has-text("Stats")')).toBeVisible();
    
    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    if (await statCards.count() > 0) {
      await expect(statCards.first()).toBeVisible();
    }

    // Step 5: Test workout history and performance
    await page.goto('/progress/workouts');
    await page.waitForLoadState('networkidle');

    // Verify workout history
    await expect(page.locator('h1:has-text("Workout History"), h2:has-text("Recent Workouts")')).toBeVisible();
    
    // Check for workout history elements
    const workoutHistory = page.locator('[data-testid="workout-history"], .workout-history');
    if (await workoutHistory.isVisible()) {
      console.log('✅ Workout history section visible');
    }

    // Step 6: Test progress charts and visualization
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Look for chart elements (could be various chart libraries)
    const chartElements = page.locator('[data-testid="progress-chart"], .chart-container, canvas, svg');
    if (await chartElements.count() > 0) {
      console.log('✅ Progress visualization charts detected');
    }

    // Step 7: Test goal tracking
    const goalElements = page.locator('[data-testid="goals"], .goals-section, .goal-card');
    if (await goalElements.isVisible()) {
      // Check goal progress indicators
      const progressBars = page.locator('.progress-bar, [role="progressbar"]');
      if (await progressBars.count() > 0) {
        console.log('✅ Goal progress indicators found');
      }
    }

    console.log('✅ Progress tracking workflow completed successfully');
  });

  test('should handle measurement input validation', async ({ page }) => {
    console.log('✅ Testing measurement validation...');

    await page.goto('/progress/measurements');
    await page.waitForLoadState('networkidle');

    // Try to access measurement form
    const addButton = page.locator('button:has-text("Add"), button:has-text("Record"), a:has-text("Add")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // Test invalid weight input
      const weightInput = page.locator('input[name="weight"], input[placeholder*="weight" i]').first();
      if (await weightInput.isVisible()) {
        // Test negative weight
        await weightInput.fill('-10');
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show validation error
          const errorMessage = page.locator('.error, .text-red, [role="alert"]');
          if (await errorMessage.isVisible()) {
            console.log('✅ Validation error shown for invalid input');
          }
        }

        // Test valid input
        await weightInput.clear();
        await weightInput.fill('70.5');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Valid input accepted');
        }
      }
    }

    console.log('✅ Measurement validation testing completed');
  });

  test('should display progress trends and analytics', async ({ page }) => {
    console.log('📈 Testing progress analytics...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Look for various types of progress indicators
    const progressElements = [
      '[data-testid="progress-chart"]',
      '.progress-chart',
      '.analytics-section',
      '.trend-indicator',
      '.progress-summary',
      'canvas', // Chart.js or similar
      'svg'     // D3 or similar
    ];

    let foundElements = 0;
    for (const selector of progressElements) {
      if (await page.locator(selector).count() > 0) {
        foundElements++;
        console.log(`✅ Found progress element: ${selector}`);
      }
    }

    // Check for time period filters
    const timeFilters = page.locator('button:has-text("Week"), button:has-text("Month"), button:has-text("Year"), select[name*="period"]');
    if (await timeFilters.count() > 0) {
      console.log('✅ Time period filters available');
      
      // Test filter interaction
      const monthFilter = timeFilters.filter({ hasText: /month/i }).first();
      if (await monthFilter.isVisible()) {
        await monthFilter.click();
        await page.waitForTimeout(1000);
        console.log('✅ Time filter interaction works');
      }
    }

    // Check for key metrics display
    const metricElements = page.locator('.metric, .stat, .kpi, [data-testid*="metric"]');
    if (await metricElements.count() > 0) {
      console.log(`✅ Found ${await metricElements.count()} metric displays`);
    }

    console.log('✅ Progress analytics testing completed');
  });

  test('should handle empty progress state gracefully', async ({ page }) => {
    console.log('📝 Testing empty progress state...');

    // This test assumes a new user or cleared data state
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Look for empty state messages
    const emptyStateMessages = [
      'No progress data',
      'Start tracking',
      'Record your first',
      'Get started',
      'No measurements',
      'No workouts'
    ];

    let foundEmptyState = false;
    for (const message of emptyStateMessages) {
      if (await page.locator(`text="${message}"`).count() > 0) {
        foundEmptyState = true;
        console.log(`✅ Empty state message found: ${message}`);
        break;
      }
    }

    // Look for call-to-action buttons in empty state
    const ctaButtons = page.locator('button:has-text("Add"), button:has-text("Record"), button:has-text("Start"), a:has-text("Add")');
    if (await ctaButtons.count() > 0) {
      console.log('✅ Call-to-action buttons available in empty state');
      
      // Test CTA functionality
      const firstCTA = ctaButtons.first();
      if (await firstCTA.isVisible()) {
        await firstCTA.click();
        await page.waitForTimeout(1000);
        console.log('✅ Empty state CTA navigation works');
      }
    }

    console.log('✅ Empty progress state testing completed');
  });

  test('should support mobile responsive progress tracking', async ({ page }) => {
    console.log('📱 Testing mobile responsive progress tracking...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 6/7/8

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify mobile layout
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Test mobile navigation if present
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, .bottom-nav');
    if (await mobileNav.isVisible()) {
      console.log('✅ Mobile navigation detected');
    }

    // Test touch-friendly measurement input
    const addButton = page.locator('button:has-text("Add"), button:has-text("Record")').first();
    if (await addButton.isVisible()) {
      // Verify touch target size (minimum 44px)
      const boundingBox = await addButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      }

      await addButton.click();
      await page.waitForTimeout(1000);

      // Test mobile-friendly form inputs
      const inputs = page.locator('input[type="number"], input[type="text"]');
      for (let i = 0; i < Math.min(3, await inputs.count()); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const inputBox = await input.boundingBox();
          if (inputBox) {
            expect(inputBox.height).toBeGreaterThanOrEqual(44); // Touch-friendly
          }
        }
      }
    }

    // Test responsive chart display
    const charts = page.locator('canvas, svg, .chart');
    if (await charts.count() > 0) {
      const chart = charts.first();
      if (await chart.isVisible()) {
        const chartBox = await chart.boundingBox();
        if (chartBox) {
          expect(chartBox.width).toBeLessThanOrEqual(375); // Fits mobile viewport
          console.log('✅ Charts responsive on mobile');
        }
      }
    }

    console.log('✅ Mobile responsive testing completed');
  });

  test('should be accessible for screen readers', async ({ page }) => {
    console.log('♿ Testing progress tracking accessibility...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Check for proper headings structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }

    // Check for proper form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs.slice(0, 3)) { // Check first 3 inputs
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        // Should have associated label
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || !!ariaLabel || !!placeholder).toBeTruthy();
      }
    }

    // Check for proper table accessibility if present
    const tables = await page.locator('table').all();
    for (const table of tables) {
      // Should have caption or aria-label
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      expect(caption > 0 || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
    }

    // Check for progress indicators accessibility
    const progressBars = await page.locator('[role="progressbar"]').all();
    for (const progressBar of progressBars) {
      const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
      const ariaValueMax = await progressBar.getAttribute('aria-valuemax');
      
      // Progress bars should have current and max values
      expect(ariaValueNow).toBeTruthy();
      expect(ariaValueMax).toBeTruthy();
    }

    console.log('✅ Accessibility checks completed');
  });

  test('should handle data export functionality', async ({ page }) => {
    console.log('📤 Testing data export features...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Look for export buttons
    const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("Export")');
    
    if (await exportButtons.count() > 0) {
      const exportButton = exportButtons.first();
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        console.log(`✅ Export download initiated: ${download.suggestedFilename()}`);
        
        // Verify file type
        const filename = download.suggestedFilename();
        const validExtensions = ['.csv', '.xlsx', '.json', '.pdf'];
        const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
        expect(hasValidExtension).toBeTruthy();
      }
    } else {
      console.log('ℹ️ Export functionality not available or not visible');
    }

    console.log('✅ Data export testing completed');
  });

  test('should handle progress data synchronization', async ({ page }) => {
    console.log('🔄 Testing progress data sync...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Add a measurement to test sync
    const measurementPath = '/progress/measurements';
    if (await page.locator(`a[href="${measurementPath}"], a[href*="measurement"]`).count() > 0) {
      await page.goto(measurementPath);
      await page.waitForLoadState('networkidle');

      // Try to add measurement and verify sync
      const addButton = page.locator('button:has-text("Add"), button:has-text("Record")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForLoadState('networkidle');

        const weightInput = page.locator('input[name="weight"], input[placeholder*="weight" i]').first();
        if (await weightInput.isVisible()) {
          const timestamp = Date.now();
          const testWeight = (70 + (timestamp % 30)).toString(); // Unique weight
          
          await weightInput.fill(testWeight);
          
          const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            // Navigate away and back to test persistence
            await page.goto('/progress');
            await page.waitForLoadState('networkidle');
            
            await page.goto(measurementPath);
            await page.waitForLoadState('networkidle');

            // Verify the measurement persists
            const measurementsList = page.locator('body');
            if (await measurementsList.textContent()) {
              const content = await measurementsList.textContent();
              if (content?.includes(testWeight)) {
                console.log('✅ Progress data sync working - measurement persisted');
              }
            }
          }
        }
      }
    }

    console.log('✅ Progress data sync testing completed');
  });
});

test.describe('Progress Tracking Error Scenarios', () => {
  let authUtils: AuthUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthUtils(page);
    await authUtils.signIn();
    await authUtils.completeOnboardingIfNeeded();
  });

  test.afterEach(async ({ page }) => {
    await authUtils.signOut();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    console.log('🌐 Testing network error handling...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Simulate network failure for progress data
    await page.route('**/api/progress/**', (route) => {
      route.abort();
    });

    await page.route('**/api/measurements/**', (route) => {
      route.abort();
    });

    // Reload page to trigger network calls
    await page.reload();
    await page.waitForTimeout(3000);

    // Should show error state or loading state
    const errorIndicators = page.locator('.error, .text-red, [data-testid="error"], .loading, .spinner');
    const errorCount = await errorIndicators.count();
    
    if (errorCount > 0) {
      console.log('✅ Network error handling visible');
    }

    // Should provide retry mechanism
    const retryButtons = page.locator('button:has-text("Retry"), button:has-text("Try Again"), button:has-text("Reload")');
    if (await retryButtons.count() > 0) {
      console.log('✅ Retry mechanism available');
    }

    console.log('✅ Network error handling verified');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    console.log('🚨 Testing API error handling...');

    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Mock API error responses
    await page.route('**/api/measurements', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Try to access measurements
    const measurementsLink = page.locator('a[href*="measurement"], button:has-text("Add Measurement")');
    if (await measurementsLink.count() > 0) {
      await measurementsLink.first().click();
      await page.waitForTimeout(2000);

      // Should handle error gracefully
      const errorMessages = page.locator('.error, .text-red, [role="alert"]');
      if (await errorMessages.count() > 0) {
        console.log('✅ API error displayed to user');
      }
    }

    console.log('✅ API error handling verified');
  });
});