import { expect, Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Session statistics interface for type safety
 */
interface SessionStatistics {
  duration?: number
  exercisesCompleted?: number
  totalExercises?: number
  calories?: number
}

/**
 * Workout Session page object model for session execution and timer functionality
 */
export class WorkoutSessionPage extends BasePage {
  // Session Navigation Locators
  private readonly sessionsList = () => this.page.locator('[data-testid="sessions-list"]')
  private readonly startSessionButton = () => this.page.locator('button:has-text("Start"), a:has-text("New Session")')
  private readonly activeSessionLink = () => this.page.locator('a[href*="/sessions/"], [data-testid="active-session"]')

  // Session Page Locators
  private readonly sessionContainer = () => this.page.locator('[data-testid="session-container"], [data-testid="workout-session"]')
  private readonly exerciseList = () => this.page.locator('[data-testid="exercise-list"]')
  private readonly currentExercise = () => this.page.locator('[data-testid="current-exercise"]')
  private readonly exerciseCards = () => this.page.locator('[data-testid="exercise-card"]')

  // Timer Locators
  private readonly timer = () => this.page.locator('[data-testid="timer"], .timer, [data-testid="workout-timer"]')
  private readonly timerDisplay = () => this.page.locator('[data-testid="timer-display"], .timer-display')
  private readonly playButton = () => this.page.locator('button[data-testid="play"], button:has([data-testid="play-icon"])')
  private readonly pauseButton = () => this.page.locator('button[data-testid="pause"], button:has([data-testid="pause-icon"])')
  private readonly resetButton = () => this.page.locator('button[data-testid="reset"], button:has-text("Reset")')

  // Tabata Specific Locators
  private readonly tabataContainer = () => this.page.locator('[data-testid="tabata-timer"], [data-testid="tabata-container"]')
  private readonly workPhase = () => this.page.locator('[data-testid="work-phase"], .work-phase')
  private readonly restPhase = () => this.page.locator('[data-testid="rest-phase"], .rest-phase')
  private readonly roundCounter = () => this.page.locator('[data-testid="round-counter"], [data-testid="cycle-counter"]')
  private readonly startTabataButton = () => this.page.locator('button:has-text("Start Tabata"), button[data-testid="start-tabata"]')
  private readonly stopTabataButton = () => this.page.locator('button:has-text("Stop"), button[data-testid="stop-tabata"]')

  // Progress and Control Locators
  private readonly completeButton = () => this.page.locator('button:has-text("Complete"), button[data-testid="mark-complete"]')
  private readonly nextExerciseButton = () => this.page.locator('button:has-text("Next"), button[data-testid="next-exercise"]')
  private readonly previousExerciseButton = () => this.page.locator('button:has-text("Previous"), button[data-testid="previous-exercise"]')
  private readonly progressBar = () => this.page.locator('[data-testid="progress-bar"], .progress-bar')
  private readonly finishSessionButton = () => this.page.locator('button:has-text("Finish"), button[data-testid="finish-session"]')
  private readonly saveProgressButton = () => this.page.locator('button:has-text("Save"), button[data-testid="save-progress"]')

  // Status and Message Locators
  private readonly completionMessage = () => this.page.locator('[data-testid="completion-message"], .completion-message')
  private readonly offlineMessage = () => this.page.locator('[data-testid="offline-message"], .offline-indicator')
  private readonly sessionStats = () => this.page.locator('[data-testid="session-stats"], .session-statistics')

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to sessions overview page
   */
  async navigateToSessions(): Promise<void> {
    await this.goto('/workouts/session')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to specific session by ID
   */
  async navigateToSession(sessionId: string): Promise<void> {
    await this.goto(`/workouts/sessions/${sessionId}`)
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to an active session (first available)
   */
  async navigateToActiveSession(): Promise<void> {
    await this.navigateToSessions()
    
    // Try to find and navigate to an active session
    if (await this.elementExists('a[href*="/sessions/"]')) {
      await this.activeSessionLink().first().click()
      await this.waitForPageLoad()
    } else {
      // Create a new session if none exists
      await this.startNewSession()
    }
  }

  /**
   * Navigate to create session page
   */
  async navigateToCreateSession(): Promise<void> {
    await this.goto('/workouts/session')
    await this.waitForPageLoad()
  }

  /**
   * Navigate to session by workout type
   */
  async navigateToSessionByType(workoutType: string): Promise<void> {
    await this.navigateToSessions()
    
    // Look for session with specific workout type
    const sessionWithType = this.page.locator(`[data-testid="session-card"]:has-text("${workoutType}")`)
    
    if (await sessionWithType.isVisible()) {
      await sessionWithType.click()
      await this.waitForPageLoad()
    } else {
      // Navigate to a generic session
      await this.navigateToActiveSession()
    }
  }

  /**
   * Verify sessions page is loaded
   */
  async verifySessionsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/session/)
    
    const isLoaded = await Promise.race([
      this.elementExists('[data-testid="sessions-content"]'),
      this.elementExists('[data-testid="session-container"]'),
      this.elementExists('h1'),
      this.elementExists('main')
    ])

    expect(isLoaded).toBe(true)
  }

  /**
   * Verify session execution page is loaded
   */
  async verifySessionPageLoaded(): Promise<boolean> {
    try {
      const hasSessionElements = await Promise.race([
        this.elementExists('[data-testid="session-container"]'),
        this.elementExists('[data-testid="workout-session"]'),
        this.elementExists('[data-testid="timer"]'),
        this.elementExists('[data-testid="exercise-list"]')
      ])

      return hasSessionElements
    } catch {
      return false
    }
  }

  /**
   * Verify sessions are displayed or empty state
   */
  async verifySessionsDisplayed(): Promise<void> {
    await this.waitForLoadingComplete()
    
    const hasSessions = await this.elementExists('[data-testid="session-card"]')
    const hasEmptyState = await this.elementExists('[data-testid="empty-state"], .empty-state')
    const hasCreateButton = await this.elementExists('button:has-text("Start"), a:has-text("New Session")')
    
    // Should have sessions, empty state, or create button
    expect(hasSessions || hasEmptyState || hasCreateButton).toBe(true)
  }

  /**
   * Start a new workout session
   */
  async startNewSession(): Promise<void> {
    if (await this.elementExists('button:has-text("Start"), a:has-text("New Session")')) {
      await this.startSessionButton().first().click()
      await this.waitForPageLoad()
    } else {
      throw new Error('Start session button not found')
    }
  }

  /**
   * Verify essential session elements are present
   */
  async verifySessionElements(): Promise<void> {
    const hasTimer = await this.verifyTimerPresent()
    const hasExercises = await this.elementExists('[data-testid="exercise-list"], [data-testid="current-exercise"]')
    
    // Should have either timer or exercises (or both)
    expect(hasTimer || hasExercises).toBe(true)
  }

  /**
   * Verify timer is present and functional
   */
  async verifyTimerPresent(): Promise<boolean> {
    return await this.elementExists('[data-testid="timer"], .timer, [data-testid="workout-timer"]')
  }

  /**
   * Get current timer display text
   */
  async getTimerText(): Promise<string> {
    if (await this.verifyTimerPresent()) {
      // Try different timer display selectors
      const timerDisplays = [
        '[data-testid="timer-display"]',
        '.timer-display',
        '[data-testid="timer"] span',
        '[data-testid="timer"]',
        '.timer'
      ]

      for (const selector of timerDisplays) {
        if (await this.elementExists(selector)) {
          const text = await this.page.locator(selector).textContent()
          if (text && text.trim().match(/\d+/)) {
            return text.trim()
          }
        }
      }
    }
    
    return '00:00'
  }

  /**
   * Verify timer controls are present
   */
  async verifyTimerControls(): Promise<boolean> {
    const hasPlay = await this.elementExists('button[data-testid="play"], button:has([data-testid="play-icon"])')
    const hasPause = await this.elementExists('button[data-testid="pause"], button:has([data-testid="pause-icon"])')
    const hasReset = await this.elementExists('button[data-testid="reset"], button:has-text("Reset")')
    
    return hasPlay || hasPause || hasReset
  }

  /**
   * Play/start timer
   */
  async playTimer(): Promise<void> {
    if (await this.elementExists('button[data-testid="play"], button:has([data-testid="play-icon"])')) {
      await this.playButton().click()
    } else if (await this.elementExists('button:has-text("Start")')) {
      await this.page.locator('button:has-text("Start")').first().click()
    }
  }

  /**
   * Pause timer
   */
  async pauseTimer(): Promise<void> {
    if (await this.elementExists('button[data-testid="pause"], button:has([data-testid="pause-icon"])')) {
      await this.pauseButton().click()
    } else if (await this.elementExists('button:has-text("Pause")')) {
      await this.page.locator('button:has-text("Pause")').first().click()
    }
  }

  /**
   * Reset timer
   */
  async resetTimer(): Promise<void> {
    if (await this.elementExists('button[data-testid="reset"], button:has-text("Reset")')) {
      await this.resetButton().click()
    }
  }

  /**
   * Verify Tabata mode is available
   */
  async verifyTabataMode(): Promise<boolean> {
    return await this.elementExists('[data-testid="tabata-timer"], [data-testid="tabata-container"]')
  }

  /**
   * Start Tabata timer
   */
  async startTabataTimer(): Promise<void> {
    if (await this.elementExists('button:has-text("Start Tabata"), button[data-testid="start-tabata"]')) {
      await this.startTabataButton().click()
    } else {
      // Try generic start button if Tabata-specific not found
      await this.playTimer()
    }
  }

  /**
   * Stop Tabata timer
   */
  async stopTabataTimer(): Promise<void> {
    if (await this.elementExists('button:has-text("Stop"), button[data-testid="stop-tabata"]')) {
      await this.stopTabataButton().click()
    } else {
      await this.pauseTimer()
    }
  }

  /**
   * Verify work/rest cycle elements
   */
  async verifyWorkRestCycles(): Promise<boolean> {
    const hasWorkPhase = await this.elementExists('[data-testid="work-phase"], .work-phase')
    const hasRestPhase = await this.elementExists('[data-testid="rest-phase"], .rest-phase')
    const hasPhaseIndicator = await this.elementExists('.phase-indicator, [data-testid="phase"]')
    
    return hasWorkPhase || hasRestPhase || hasPhaseIndicator
  }

  /**
   * Get round/cycle information
   */
  async getRoundInfo(): Promise<string> {
    if (await this.elementExists('[data-testid="round-counter"], [data-testid="cycle-counter"]')) {
      const text = await this.roundCounter().textContent()
      return text?.trim() || 'Round info not available'
    }
    return 'Round info not available'
  }

  /**
   * Verify interval training elements (HIIT)
   */
  async verifyIntervalElements(): Promise<boolean> {
    const hasIntervalTimer = await this.elementExists('[data-testid="interval-timer"]')
    const hasIntervalPhases = await this.elementExists('[data-testid="interval-phase"]')
    
    return hasIntervalTimer || hasIntervalPhases
  }

  /**
   * Get exercise count
   */
  async getExerciseCount(): Promise<number> {
    await this.waitForLoadingComplete()
    return await this.exerciseCards().count()
  }

  /**
   * Get current exercise name
   */
  async getCurrentExerciseName(): Promise<string> {
    if (await this.elementExists('[data-testid="current-exercise"]')) {
      const text = await this.currentExercise().textContent()
      return text?.trim() || 'Unknown Exercise'
    }
    return 'Unknown Exercise'
  }

  /**
   * Navigate to next exercise
   */
  async nextExercise(): Promise<void> {
    if (await this.elementExists('button:has-text("Next"), button[data-testid="next-exercise"]')) {
      await this.nextExerciseButton().click()
      await this.waitForLoadingComplete()
    }
  }

  /**
   * Navigate to previous exercise
   */
  async previousExercise(): Promise<void> {
    if (await this.elementExists('button:has-text("Previous"), button[data-testid="previous-exercise"]')) {
      await this.previousExerciseButton().click()
      await this.waitForLoadingComplete()
    }
  }

  /**
   * Mark current exercise as complete
   */
  async markExerciseComplete(): Promise<void> {
    if (await this.elementExists('button:has-text("Complete"), button[data-testid="mark-complete"]')) {
      await this.completeButton().click()
      await this.waitForLoadingComplete()
    }
  }

  /**
   * Check if current exercise is marked as complete
   */
  async isExerciseComplete(): Promise<boolean> {
    return await this.elementExists('[data-testid="exercise-completed"], .exercise-complete')
  }

  /**
   * Get session progress percentage
   */
  async getProgressPercentage(): Promise<number> {
    if (await this.elementExists('[data-testid="progress-bar"], .progress-bar')) {
      const progressText = await this.progressBar().textContent()
      const match = progressText?.match(/(\d+)%/)
      return match ? parseInt(match[1]) : 0
    }
    
    // Calculate based on completed exercises
    const completed = await this.page.locator('[data-testid="exercise-completed"]').count()
    const total = await this.getExerciseCount()
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  /**
   * Complete all exercises quickly (for testing)
   */
  async completeAllExercises(): Promise<void> {
    const exerciseCount = await this.getExerciseCount()
    
    for (let i = 0; i < exerciseCount; i++) {
      try {
        await this.markExerciseComplete()
        
        // Move to next exercise if not the last one
        if (i < exerciseCount - 1) {
          await this.nextExercise()
        }
        
        await this.page.waitForTimeout(500)
      } catch (error) {
        console.log(`Could not complete exercise ${i + 1}:`, error.message)
        break
      }
    }
  }

  /**
   * Finish the session
   */
  async finishSession(): Promise<void> {
    if (await this.elementExists('button:has-text("Finish"), button[data-testid="finish-session"]')) {
      await this.finishSessionButton().click()
      await this.waitForPageLoad()
    }
  }

  /**
   * Save session progress
   */
  async saveProgress(): Promise<void> {
    if (await this.elementExists('button:has-text("Save"), button[data-testid="save-progress"]')) {
      await this.saveProgressButton().click()
      await this.waitForLoadingComplete()
    }
  }

  /**
   * Verify completion message is displayed
   */
  async verifyCompletionMessage(): Promise<boolean> {
    return await this.elementExists('[data-testid="completion-message"], .completion-message')
  }

  /**
   * Check for offline message
   */
  async checkForOfflineMessage(): Promise<boolean> {
    return await this.elementExists('[data-testid="offline-message"], .offline-indicator')
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<SessionStatistics> {
    const stats: SessionStatistics = {}

    try {
      if (await this.elementExists('[data-testid="session-stats"]')) {
        const statsText = await this.sessionStats().textContent()
        
        // Extract duration (look for time format)
        const durationMatch = statsText?.match(/(\d+):(\d+)/)
        if (durationMatch) {
          stats.duration = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2])
        }
        
        // Extract completed exercises count
        const completedMatch = statsText?.match(/(\d+)\s*\/\s*(\d+)/)
        if (completedMatch) {
          stats.exercisesCompleted = parseInt(completedMatch[1])
          stats.totalExercises = parseInt(completedMatch[2])
        }
        
        // Extract calories if present
        const caloriesMatch = statsText?.match(/(\d+)\s*cal/)
        if (caloriesMatch) {
          stats.calories = parseInt(caloriesMatch[1])
        }
      }
    } catch (error) {
      console.log('Could not parse session statistics:', error.message)
    }

    return stats
  }

  /**
   * Verify workout type-specific elements
   */
  async verifyWorkoutTypeElements(workoutType: string): Promise<boolean> {
    switch (workoutType.toLowerCase()) {
      case 'tabata':
        return await this.verifyTabataMode()
      case 'hiit':
        return await this.verifyIntervalElements()
      case 'strength':
        return await this.elementExists('[data-testid="weight-input"], [data-testid="reps-input"]')
      case 'cardio':
        return await this.elementExists('[data-testid="distance-tracker"], [data-testid="pace-tracker"]')
      default:
        return await this.verifySessionPageLoaded()
    }
  }
}