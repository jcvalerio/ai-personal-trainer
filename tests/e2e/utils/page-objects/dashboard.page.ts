import { expect, Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Dashboard page object model
 */
export class DashboardPage extends BasePage {
  // Locators
  private readonly welcomeMessage = () => this.page.locator('[data-testid="welcome-message"], h1, .welcome').first()
  private readonly workoutSummary = () => this.page.locator('[data-testid="workout-summary"]')
  private readonly quickActions = () => this.page.locator('[data-testid="quick-actions"]')
  private readonly recentWorkouts = () => this.page.locator('[data-testid="recent-workouts"]')
  private readonly progressChart = () => this.page.locator('[data-testid="progress-chart"]')
  private readonly navigationMenu = () => this.page.locator('[data-testid="navigation"], nav')
  
  // Navigation links
  private readonly workoutsLink = () => this.page.locator('a[href*="/workouts"], a:has-text("Workouts")')
  private readonly exercisesLink = () => this.page.locator('a[href*="/exercises"], a:has-text("Exercises")')
  private readonly progressLink = () => this.page.locator('a[href*="/progress"], a:has-text("Progress")')
  
  // Quick action buttons
  private readonly startWorkoutButton = () => this.page.locator('button:has-text("Start Workout"), a:has-text("Start Workout")')
  private readonly createPlanButton = () => this.page.locator('button:has-text("Create Plan"), a:has-text("Create Plan")')
  private readonly generateWorkoutButton = () => this.page.locator('button:has-text("Generate"), a:has-text("AI Workout")')

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to dashboard
   */
  async navigate(): Promise<void> {
    await this.goto('/dashboard')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Verify dashboard is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/dashboard/)
    
    // Check for key dashboard elements
    const isDashboardLoaded = await Promise.race([
      this.elementExists('[data-testid="dashboard-content"]'),
      this.elementExists('h1'),
      this.elementExists('[data-testid="welcome-message"]'),
      this.elementExists('main')
    ])

    expect(isDashboardLoaded).toBe(true)
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    if (await this.elementExists('[data-testid="welcome-message"], h1, .welcome')) {
      return await this.welcomeMessage().textContent() || ''
    }
    return ''
  }

  /**
   * Check if workout summary is visible
   */
  async hasWorkoutSummary(): Promise<boolean> {
    return await this.elementExists('[data-testid="workout-summary"]')
  }

  /**
   * Get workout summary data
   */
  async getWorkoutSummaryData(): Promise<{
    totalWorkouts?: number
    weeklyGoal?: number
    streak?: number
  }> {
    if (!await this.hasWorkoutSummary()) {
      return {}
    }

    const summary: any = {}
    
    try {
      const totalWorkoutsElement = this.page.locator('[data-testid="total-workouts"]')
      if (await totalWorkoutsElement.isVisible()) {
        const text = await totalWorkoutsElement.textContent()
        summary.totalWorkouts = parseInt(text?.match(/\d+/)?.[0] || '0')
      }

      const weeklyGoalElement = this.page.locator('[data-testid="weekly-goal"]')
      if (await weeklyGoalElement.isVisible()) {
        const text = await weeklyGoalElement.textContent()
        summary.weeklyGoal = parseInt(text?.match(/\d+/)?.[0] || '0')
      }

      const streakElement = this.page.locator('[data-testid="streak"]')
      if (await streakElement.isVisible()) {
        const text = await streakElement.textContent()
        summary.streak = parseInt(text?.match(/\d+/)?.[0] || '0')
      }
    } catch (error) {
      console.warn('Error getting workout summary data:', error)
    }

    return summary
  }

  /**
   * Navigate to workouts page
   */
  async navigateToWorkouts(): Promise<void> {
    await this.workoutsLink().first().click()
    await this.page.waitForURL('**/workouts', { timeout: 10000 })
    await this.waitForPageLoad()
  }

  /**
   * Navigate to exercises page
   */
  async navigateToExercises(): Promise<void> {
    await this.exercisesLink().first().click()
    await this.page.waitForURL('**/exercises', { timeout: 10000 })
    await this.waitForPageLoad()
  }

  /**
   * Navigate to progress page
   */
  async navigateToProgress(): Promise<void> {
    await this.progressLink().first().click()
    await this.page.waitForURL('**/progress', { timeout: 10000 })
    await this.waitForPageLoad()
  }

  /**
   * Start a quick workout
   */
  async startQuickWorkout(): Promise<void> {
    if (await this.elementExists('button:has-text("Start Workout"), a:has-text("Start Workout")')) {
      await this.startWorkoutButton().first().click()
      
      // Wait for navigation to workout or workout selection page
      await Promise.race([
        this.page.waitForURL('**/workouts/**', { timeout: 15000 }),
        this.page.waitForURL('**/sessions/**', { timeout: 15000 })
      ])
      await this.waitForPageLoad()
    } else {
      throw new Error('Start Workout button not found')
    }
  }

  /**
   * Create new workout plan
   */
  async createNewPlan(): Promise<void> {
    if (await this.elementExists('button:has-text("Create Plan"), a:has-text("Create Plan")')) {
      await this.createPlanButton().first().click()
      await this.page.waitForURL('**/workouts/plans', { timeout: 15000 })
      await this.waitForPageLoad()
    } else {
      throw new Error('Create Plan button not found')
    }
  }

  /**
   * Generate AI workout
   */
  async generateAIWorkout(): Promise<void> {
    if (await this.elementExists('button:has-text("Generate"), a:has-text("AI Workout")')) {
      await this.generateWorkoutButton().first().click()
      await this.page.waitForURL('**/workouts/generate', { timeout: 15000 })
      await this.waitForPageLoad()
    } else {
      throw new Error('Generate Workout button not found')
    }
  }

  /**
   * Get recent workouts list
   */
  async getRecentWorkouts(): Promise<string[]> {
    if (!await this.elementExists('[data-testid="recent-workouts"]')) {
      return []
    }

    const workoutElements = await this.page.locator('[data-testid="recent-workouts"] [data-testid="workout-item"]').all()
    const workouts: string[] = []

    for (const element of workoutElements) {
      const text = await element.textContent()
      if (text?.trim()) {
        workouts.push(text.trim())
      }
    }

    return workouts
  }

  /**
   * Check if navigation menu is visible
   */
  async hasNavigationMenu(): Promise<boolean> {
    return await this.elementExists('[data-testid="navigation"], nav, [data-testid="sidebar"]')
  }

  /**
   * Get navigation menu items
   */
  async getNavigationItems(): Promise<string[]> {
    if (!await this.hasNavigationMenu()) {
      return []
    }

    const navItems = await this.page.locator('nav a, [data-testid="navigation"] a, [data-testid="nav-item"]').all()
    const items: string[] = []

    for (const item of navItems) {
      const text = await item.textContent()
      if (text?.trim()) {
        items.push(text.trim())
      }
    }

    return items
  }

  /**
   * Check if user is properly authenticated on dashboard
   */
  async verifyUserAuthenticated(): Promise<void> {
    // Should not be on sign-in page
    await expect(this.page).not.toHaveURL(/.*\/sign-in/)
    
    // Should have dashboard content
    await this.verifyPageLoaded()
    
    // Look for authenticated user indicators
    const hasAuthIndicators = await Promise.race([
      this.elementExists('[data-testid="user-menu"]'),
      this.elementExists('[data-clerk-element="userButton"]'),
      this.hasNavigationMenu(),
      this.hasWorkoutSummary()
    ])

    expect(hasAuthIndicators).toBe(true)
  }

  /**
   * Check if progress chart is visible
   */
  async hasProgressChart(): Promise<boolean> {
    return await this.elementExists('[data-testid="progress-chart"], .chart, svg')
  }

  /**
   * Wait for dashboard data to load
   */
  async waitForDashboardData(): Promise<void> {
    // Wait for loading indicators to disappear
    await this.waitForLoadingComplete()
    
    // Wait for any of the main data sections to load
    await Promise.race([
      this.waitForElement('[data-testid="workout-summary"]', 10000),
      this.waitForElement('[data-testid="recent-workouts"]', 10000),
      this.waitForElement('[data-testid="progress-chart"]', 10000),
      this.page.waitForTimeout(5000) // Fallback timeout
    ]).catch(() => {
      console.log('Dashboard data sections may not be present - continuing with test')
    })
  }

  /**
   * Verify dashboard has expected sections
   */
  async verifyDashboardSections(): Promise<void> {
    await this.verifyPageLoaded()
    
    // At least one of these sections should be present
    const hasSections = await Promise.race([
      this.hasWorkoutSummary(),
      this.elementExists('[data-testid="recent-workouts"]'),
      this.hasNavigationMenu(),
      this.elementExists('[data-testid="quick-actions"]')
    ])

    expect(hasSections).toBe(true)
  }
}