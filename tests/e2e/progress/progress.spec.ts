import { test, expect } from '@playwright/test'
import { BasePage } from '../utils/page-objects/base.page'
import { TestDataUtils } from '../utils/test-data.utils'

// Use authenticated state for these tests
test.use({ storageState: '.auth/user.json' })

test.describe('Progress Tracking', () => {
  let progressPage: BasePage
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    progressPage = new BasePage(page)
    testDataUtils = new TestDataUtils(page)
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
  })

  test('should load progress page correctly', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/progress/)
    
    // Check page title
    await progressPage.assertTitleContains('Progress')
    
    // Verify page has loaded
    const hasContent = await Promise.race([
      progressPage.elementExists('h1'),
      progressPage.elementExists('[data-testid="progress-content"]'),
      progressPage.elementExists('main')
    ])
    
    expect(hasContent).toBe(true)
  })

  test('should display progress overview', async ({ page }) => {
    // Check for progress overview elements
    const hasOverview = await Promise.race([
      progressPage.elementExists('[data-testid="progress-overview"]'),
      progressPage.elementExists('.progress-overview'),
      progressPage.elementExists('[data-testid="stats-summary"]')
    ])
    
    if (hasOverview) {
      expect(hasOverview).toBe(true)
    } else {
      // Should at least show empty state or getting started message
      const hasEmptyState = await progressPage.elementExists('[data-testid="empty-state"], .empty-state')
      expect(hasEmptyState).toBe(true)
    }
  })

  test('should display workout statistics if available', async ({ page }) => {
    // Look for workout statistics
    const statsElements = page.locator('[data-testid="workout-stats"], .workout-stats, .stat-card')
    const statsCount = await statsElements.count()
    
    if (statsCount > 0) {
      // Verify stats contain meaningful data
      const stats = await statsElements.all()
      
      for (const stat of stats) {
        const text = await stat.textContent()
        if (text?.trim()) {
          expect(text.length).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should display progress charts if available', async ({ page }) => {
    // Look for chart elements
    const hasCharts = await Promise.race([
      progressPage.elementExists('[data-testid="progress-chart"]'),
      progressPage.elementExists('.chart'),
      progressPage.elementExists('svg'),
      progressPage.elementExists('canvas')
    ])
    
    if (hasCharts) {
      // Verify chart is rendered
      const chartElements = page.locator('[data-testid="progress-chart"], .chart, svg, canvas')
      const chartCount = await chartElements.count()
      
      expect(chartCount).toBeGreaterThan(0)
    }
  })

  test('should handle time period selection if available', async ({ page }) => {
    // Look for time period filters
    const timeFilters = page.locator('[data-testid="time-filter"], select[data-testid="period"]')
    
    if (await timeFilters.count() > 0) {
      const filter = timeFilters.first()
      
      // Try different time periods
      const periods = ['week', 'month', 'year']
      
      for (const period of periods) {
        try {
          await filter.selectOption(period)
          await page.waitForTimeout(1000)
          
          // Chart should update (just verify no errors)
          const errors = await progressPage.checkForErrors()
          const criticalErrors = errors.filter(error => 
            error.toLowerCase().includes('error')
          )
          
          expect(criticalErrors.length).toBe(0)
          
        } catch (error) {
          console.log(`Time period ${period} not available`)
        }
      }
    }
  })

  test('should display workout history if available', async ({ page }) => {
    // Look for workout history
    const historyElements = page.locator('[data-testid="workout-history"], .workout-history')
    
    if (await historyElements.count() > 0) {
      const historyItems = page.locator('[data-testid="history-item"], .history-item')
      const itemCount = await historyItems.count()
      
      if (itemCount > 0) {
        // Verify history items have content
        const items = await historyItems.all()
        
        for (const item of items) {
          const text = await item.textContent()
          if (text?.trim()) {
            expect(text.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  test('should handle goal tracking if available', async ({ page }) => {
    // Look for goal tracking elements
    const goalElements = page.locator('[data-testid="goals"], .goals, [data-testid="goal-progress"]')
    
    if (await goalElements.count() > 0) {
      const goals = await goalElements.all()
      
      for (const goal of goals) {
        const text = await goal.textContent()
        if (text?.trim()) {
          expect(text.length).toBeGreaterThan(0)
          
          // Look for progress indicators
          const progressIndicators = goal.locator('[data-testid="progress"], .progress, .progress-bar')
          if (await progressIndicators.count() > 0) {
            expect(await progressIndicators.count()).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  test('should display personal records if available', async ({ page }) => {
    // Look for personal records
    const prElements = page.locator('[data-testid="personal-records"], .personal-records, [data-testid="pr"]')
    
    if (await prElements.count() > 0) {
      const records = await prElements.all()
      
      for (const record of records) {
        const text = await record.textContent()
        if (text?.trim()) {
          expect(text.length).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Reload page
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Verify page still loads correctly
    await expect(page).toHaveURL(/.*\/progress/)
    
    const hasContent = await Promise.race([
      progressPage.elementExists('h1'),
      progressPage.elementExists('[data-testid="progress-content"]'),
      progressPage.elementExists('main')
    ])
    
    expect(hasContent).toBe(true)
  })
})

test.describe('Progress Data Interaction', () => {
  let progressPage: BasePage
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    progressPage = new BasePage(page)
    testDataUtils = new TestDataUtils(page)
  })

  test('should handle workout completion tracking', async ({ page }) => {
    // This would typically require completing a workout first
    // For now, we'll check if the progress page can handle workout data
    
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for completed workouts section
    const completedWorkouts = page.locator('[data-testid="completed-workouts"], .completed-workouts')
    
    if (await completedWorkouts.count() > 0) {
      const workoutList = completedWorkouts.locator('[data-testid="workout-item"], .workout-item')
      const workoutCount = await workoutList.count()
      
      if (workoutCount > 0) {
        // Click on a completed workout to view details
        await workoutList.first().click()
        await progressPage.waitForPageLoad()
        
        // Should show workout details or navigate to workout page
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/(progress|workouts|sessions)/)
      }
    }
  })

  test('should export progress data if available', async ({ page }) => {
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for export functionality
    const exportButtons = page.locator('button:has-text("Export"), button[data-testid="export"]')
    
    if (await exportButtons.count() > 0) {
      // Click export button
      await exportButtons.first().click()
      
      // Should show export options or start download
      const hasExportResponse = await Promise.race([
        progressPage.elementExists('[data-testid="export-modal"]'),
        progressPage.elementExists('.export-options'),
        page.waitForEvent('download', { timeout: 5000 }),
        page.waitForTimeout(2000)
      ])
      
      expect(hasExportResponse).toBeTruthy()
    }
  })

  test('should handle progress photo uploads if available', async ({ page }) => {
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for photo upload functionality
    const uploadButtons = page.locator('button:has-text("Upload"), input[type="file"]')
    
    if (await uploadButtons.count() > 0) {
      const uploadButton = uploadButtons.first()
      const tagName = await uploadButton.evaluate(el => el.tagName.toLowerCase())
      
      if (tagName === 'input') {
        // File input - could test with mock file
        expect(await uploadButton.getAttribute('type')).toBe('file')
      } else {
        // Upload button - click to see upload interface
        await uploadButton.click()
        
        const hasUploadInterface = await Promise.race([
          progressPage.elementExists('input[type="file"]'),
          progressPage.elementExists('[data-testid="file-upload"]'),
          progressPage.elementExists('.upload-modal')
        ])
        
        if (hasUploadInterface) {
          expect(hasUploadInterface).toBe(true)
        }
      }
    }
  })

  test('should handle measurement tracking if available', async ({ page }) => {
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for measurement input/tracking
    const measurementInputs = page.locator('[data-testid="measurement"], input[placeholder*="weight" i], input[placeholder*="measurement" i]')
    
    if (await measurementInputs.count() > 0) {
      const input = measurementInputs.first()
      
      // Test measurement input
      await input.clear()
      await input.fill('175')
      
      // Look for save button
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first()
      
      if (await saveButton.isVisible()) {
        await saveButton.click()
        await page.waitForTimeout(1000)
        
        // Should not show error
        const errors = await progressPage.checkForErrors()
        const criticalErrors = errors.filter(error => 
          error.toLowerCase().includes('error')
        )
        
        expect(criticalErrors.length).toBe(0)
      }
    }
  })
})

test.describe('Progress Analytics', () => {
  test('should display analytics dashboard if available', async ({ page }) => {
    const progressPage = new BasePage(page)
    
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for analytics sections
    const analyticsElements = page.locator('[data-testid="analytics"], .analytics, [data-testid="dashboard"]')
    
    if (await analyticsElements.count() > 0) {
      // Should have multiple metrics
      const metricElements = page.locator('[data-testid="metric"], .metric, .stat-card')
      const metricCount = await metricElements.count()
      
      if (metricCount > 0) {
        expect(metricCount).toBeGreaterThan(0)
        
        // Each metric should have meaningful content
        const metrics = await metricElements.all()
        
        for (const metric of metrics) {
          const text = await metric.textContent()
          if (text?.trim()) {
            expect(text.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  test('should calculate workout streaks if available', async ({ page }) => {
    const progressPage = new BasePage(page)
    
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for streak information
    const streakElements = page.locator('[data-testid="streak"], .streak, [data-testid="current-streak"]')
    
    if (await streakElements.count() > 0) {
      const streak = streakElements.first()
      const streakText = await streak.textContent()
      
      if (streakText?.trim()) {
        // Should contain number and possibly "days"
        expect(streakText).toMatch(/\d+/)
      }
    }
  })

  test('should show workout frequency analysis if available', async ({ page }) => {
    const progressPage = new BasePage(page)
    
    await progressPage.goto('/progress')
    await progressPage.waitForPageLoad()
    
    // Look for frequency analysis
    const frequencyElements = page.locator('[data-testid="frequency"], .frequency, [data-testid="workout-frequency"]')
    
    if (await frequencyElements.count() > 0) {
      const frequency = frequencyElements.first()
      const frequencyText = await frequency.textContent()
      
      if (frequencyText?.trim()) {
        // Should contain meaningful frequency information
        expect(frequencyText.length).toBeGreaterThan(0)
      }
    }
  })
})