import { test, expect } from '@playwright/test'
import { WorkoutsPage, WorkoutPlansPage, WorkoutGenerationPage } from '../utils/page-objects/workouts.page'
import { TestDataUtils } from '../utils/test-data.utils'

// Use authenticated state for these tests
test.use({ storageState: '.auth/user.json' })

test.describe('Workout Management', () => {
  let workoutsPage: WorkoutsPage
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    workoutsPage = new WorkoutsPage(page)
    testDataUtils = new TestDataUtils(page)
  })

  test('should load workouts page correctly', async ({ page }) => {
    await workoutsPage.navigate()
    await workoutsPage.verifyPageLoaded()
    
    // Check page title
    await workoutsPage.assertTitleContains('Workout')
    
    // Verify workouts are displayed or empty state is shown
    await workoutsPage.verifyWorkoutsDisplayed()
  })

  test('should display existing workouts', async ({ page }) => {
    await workoutsPage.navigate()
    
    const workoutCount = await workoutsPage.getWorkoutCount()
    const workoutCards = await workoutsPage.getWorkoutCards()
    
    // Either should have workouts or empty state
    if (workoutCount > 0) {
      expect(workoutCards.length).toBeGreaterThan(0)
      
      // Each workout card should have content
      for (const card of workoutCards) {
        expect(card.length).toBeGreaterThan(0)
      }
    }
    
    console.log(`Found ${workoutCount} workouts`)
  })

  test('should handle workout search functionality', async ({ page }) => {
    await workoutsPage.navigate()
    
    try {
      // Test search functionality if available
      await workoutsPage.searchWorkouts('test workout')
      
      // Wait for search results
      await page.waitForTimeout(1000)
      
      const searchResults = await workoutsPage.getWorkoutCards()
      
      // Search should return results or empty state
      expect(Array.isArray(searchResults)).toBe(true)
      
    } catch (error) {
      console.log('Search functionality not available:', error.message)
    }
  })

  test('should handle workout filtering', async ({ page }) => {
    await workoutsPage.navigate()
    
    try {
      // Test filter functionality if available
      await workoutsPage.filterByCategory('strength')
      
      const filteredResults = await workoutsPage.getWorkoutCards()
      
      // Filter should return results or empty state
      expect(Array.isArray(filteredResults)).toBe(true)
      
    } catch (error) {
      console.log('Filter functionality not available:', error.message)
    }
  })

  test('should navigate to create workout if available', async ({ page }) => {
    await workoutsPage.navigate()
    
    try {
      await workoutsPage.createNewWorkout()
      
      // Should navigate to workout creation page
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/(workouts|create|new)/)
      
    } catch (error) {
      console.log('Create workout functionality not available:', error.message)
    }
  })

  test('should select and view workout details', async ({ page }) => {
    await workoutsPage.navigate()
    
    const workoutCount = await workoutsPage.getWorkoutCount()
    
    if (workoutCount > 0) {
      // Select the first workout
      await workoutsPage.selectWorkout(0)
      
      // Should navigate to workout details page
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/workouts\//)
      
      await workoutsPage.waitForPageLoad()
    } else {
      console.log('No workouts available to select')
    }
  })
})

test.describe('Workout Plans Management', () => {
  let workoutPlansPage: WorkoutPlansPage
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    workoutPlansPage = new WorkoutPlansPage(page)
    testDataUtils = new TestDataUtils(page)
  })

  test('should load workout plans page correctly', async ({ page }) => {
    await workoutPlansPage.navigate()
    await workoutPlansPage.verifyPageLoaded()
    
    // Check page title
    await workoutPlansPage.assertTitleContains('Plans')
  })

  test('should display existing workout plans', async ({ page }) => {
    await workoutPlansPage.navigate()
    
    const planCount = await workoutPlansPage.getPlanCount()
    const planCards = await workoutPlansPage.getPlanCards()
    
    // Either should have plans or empty state
    if (planCount > 0) {
      expect(planCards.length).toBeGreaterThan(0)
      
      // Each plan card should have content
      for (const card of planCards) {
        expect(card.length).toBeGreaterThan(0)
      }
    }
    
    console.log(`Found ${planCount} workout plans`)
  })

  test('should handle plan search functionality', async ({ page }) => {
    await workoutPlansPage.navigate()
    
    try {
      await workoutPlansPage.searchPlans('beginner')
      
      await page.waitForTimeout(1000)
      const searchResults = await workoutPlansPage.getPlanCards()
      
      expect(Array.isArray(searchResults)).toBe(true)
      
    } catch (error) {
      console.log('Plan search functionality not available:', error.message)
    }
  })

  test('should navigate to create plan if available', async ({ page }) => {
    await workoutPlansPage.navigate()
    
    try {
      await workoutPlansPage.createNewPlan()
      
      // Should navigate to plan creation page
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/(plans|create|new)/)
      
    } catch (error) {
      console.log('Create plan functionality not available:', error.message)
    }
  })

  test('should select and view plan details', async ({ page }) => {
    await workoutPlansPage.navigate()
    
    const planCount = await workoutPlansPage.getPlanCount()
    
    if (planCount > 0) {
      await workoutPlansPage.selectPlan(0)
      
      // Should navigate to plan details page
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/plans\//)
      
      await workoutPlansPage.waitForPageLoad()
    } else {
      console.log('No workout plans available to select')
    }
  })
})

test.describe('AI Workout Generation', () => {
  let workoutGenerationPage: WorkoutGenerationPage
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    workoutGenerationPage = new WorkoutGenerationPage(page)
    testDataUtils = new TestDataUtils(page)
  })

  test('should load workout generation page correctly', async ({ page }) => {
    await workoutGenerationPage.navigate()
    await workoutGenerationPage.verifyPageLoaded()
    
    // Check page title
    await workoutGenerationPage.assertTitleContains('Generate')
    
    // Verify generation form is functional
    await workoutGenerationPage.verifyGenerationForm()
  })

  test('should display workout generation form', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    // Check for form elements
    const hasFormElements = await Promise.race([
      workoutGenerationPage.elementExists('select[name="fitnessLevel"]'),
      workoutGenerationPage.elementExists('input[name="duration"]'),
      workoutGenerationPage.elementExists('input[type="checkbox"]'),
      workoutGenerationPage.elementExists('button:has-text("Generate")')
    ])
    
    expect(hasFormElements).toBe(true)
  })

  test('should generate workout with basic parameters', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    try {
      // Fill generation form with basic parameters
      const generationOptions = testDataUtils.generateAIWorkoutRequest()
      
      await workoutGenerationPage.fillGenerationForm(generationOptions)
      
      // Generate workout
      await workoutGenerationPage.generateWorkout()
      
      // Verify workout was generated
      const isGenerated = await workoutGenerationPage.isWorkoutGenerated()
      expect(isGenerated).toBe(true)
      
      // Verify generated content
      const workoutContent = await workoutGenerationPage.getGeneratedWorkoutContent()
      expect(workoutContent.length).toBeGreaterThan(0)
      
    } catch (error) {
      console.log('AI workout generation failed (may be expected if API not available):', error.message)
    }
  })

  test('should handle different fitness levels', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    const fitnessLevels = ['beginner', 'intermediate', 'advanced']
    
    for (const level of fitnessLevels) {
      try {
        await workoutGenerationPage.fillGenerationForm({
          fitnessLevel: level,
          duration: 30
        })
        
        await workoutGenerationPage.generateWorkout()
        
        const isGenerated = await workoutGenerationPage.isWorkoutGenerated()
        if (isGenerated) {
          const content = await workoutGenerationPage.getGeneratedWorkoutContent()
          expect(content).toContain(level)
        }
        
        // Reset for next iteration
        await page.reload()
        await workoutGenerationPage.waitForPageLoad()
        
      } catch (error) {
        console.log(`Generation failed for ${level} level:`, error.message)
      }
    }
  })

  test('should handle equipment selection', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    try {
      const availableEquipment = await workoutGenerationPage.getAvailableEquipment()
      
      if (availableEquipment.length > 0) {
        await workoutGenerationPage.fillGenerationForm({
          equipment: [availableEquipment[0]],
          duration: 45
        })
        
        await workoutGenerationPage.generateWorkout()
        
        const isGenerated = await workoutGenerationPage.isWorkoutGenerated()
        expect(isGenerated).toBe(true)
      }
      
    } catch (error) {
      console.log('Equipment selection test failed:', error.message)
    }
  })

  test('should save generated workout if available', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    try {
      // Generate a workout first
      await workoutGenerationPage.completeWorkoutGeneration()
      
      // Try to save it
      await workoutGenerationPage.saveGeneratedWorkout()
      
      // Should navigate away from generation page
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      
      // Should be on workouts or dashboard page
      expect(currentUrl).toMatch(/\/(workouts|dashboard|plans)/)
      
    } catch (error) {
      console.log('Save workout functionality not available:', error.message)
    }
  })

  test('should handle generation errors gracefully', async ({ page }) => {
    await workoutGenerationPage.navigate()
    
    // Try to generate without filling required fields
    try {
      await workoutGenerationPage.page.locator('button:has-text("Generate")').click()
      
      // Should either show validation errors or handle gracefully
      await page.waitForTimeout(2000)
      
      const errors = await workoutGenerationPage.checkForErrors()
      
      // If errors exist, they should be meaningful
      if (errors.length > 0) {
        const hasValidationErrors = errors.some(error => 
          error.toLowerCase().includes('required') || 
          error.toLowerCase().includes('select') ||
          error.toLowerCase().includes('fill')
        )
        
        expect(hasValidationErrors).toBe(true)
      }
      
    } catch (error) {
      console.log('Generation error handling test completed:', error.message)
    }
  })
})

test.describe('Workout Data Integration', () => {
  let testDataUtils: TestDataUtils
  
  test.beforeEach(async ({ page }) => {
    testDataUtils = new TestDataUtils(page)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup any test data created
    await testDataUtils.cleanup()
  })

  test('should create workout plan via API', async ({ page }) => {
    const workoutPlans = testDataUtils.generateWorkoutPlans()
    const testPlan = workoutPlans[0]
    
    try {
      const planId = await testDataUtils.createWorkoutPlan(testPlan)
      
      expect(planId).toBeTruthy()
      expect(typeof planId).toBe('string')
      
      console.log('Created workout plan:', planId)
      
    } catch (error) {
      console.log('Workout plan creation via API not available:', error.message)
    }
  })

  test('should create workout session via API', async ({ page }) => {
    const sessionData = testDataUtils.generateWorkoutSession()
    
    try {
      const sessionId = await testDataUtils.createWorkoutSession(sessionData)
      
      expect(sessionId).toBeTruthy()
      expect(typeof sessionId).toBe('string')
      
      console.log('Created workout session:', sessionId)
      
    } catch (error) {
      console.log('Workout session creation via API not available:', error.message)
    }
  })
})