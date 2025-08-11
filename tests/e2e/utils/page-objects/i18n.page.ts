import { expect, Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Internationalization page object model for testing language switching and translations
 */
export class I18nPage extends BasePage {
  // Language Control Locators
  private readonly languageSelector = () => this.page.locator('[data-testid="language-selector"], select[name="language"]')
  private readonly languageToggle = () => this.page.locator('[data-testid="language-toggle"], button:has-text("ES"), button:has-text("EN")')
  private readonly langEsButton = () => this.page.locator('button:has-text("ES"), a:has-text("Español")')
  private readonly langEnButton = () => this.page.locator('button:has-text("EN"), a:has-text("English")')

  // Content Locators for Translation Verification
  private readonly pageTitle = () => this.page.locator('h1, [data-testid="page-title"]')
  private readonly navigationItems = () => this.page.locator('nav a, [data-testid="nav-item"]')
  private readonly mainContent = () => this.page.locator('main, [data-testid="main-content"]')
  private readonly buttons = () => this.page.locator('button')
  private readonly formLabels = () => this.page.locator('label')

  // Validation Message Locators
  private readonly validationMessages = () => this.page.locator('.error-message, [data-testid="error"], .field-error')
  private readonly requiredFields = () => this.page.locator('input[required], select[required], textarea[required]')

  // Timer Interface Locators
  private readonly timerControls = () => this.page.locator('[data-testid="timer"] button, .timer-controls button')
  private readonly timerLabels = () => this.page.locator('[data-testid="timer"] span, .timer-display, .phase-label')
  
  // Date/Time Locators
  private readonly dateElements = () => this.page.locator('[data-testid*="date"], .date, time')
  private readonly timeElements = () => this.page.locator('[data-testid*="time"], .timestamp')

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to home page
   */
  async navigate(): Promise<void> {
    await this.goto('/')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.goto('/dashboard')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to workouts page
   */
  async navigateToWorkouts(): Promise<void> {
    await this.goto('/workouts')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to session page
   */
  async navigateToSession(): Promise<void> {
    await this.goto('/workouts/session')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to progress page
   */
  async navigateToProgress(): Promise<void> {
    await this.goto('/progress')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to create workout page
   */
  async navigateToCreateWorkout(): Promise<void> {
    await this.goto('/workouts/create')
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Navigate to a specific page with current language
   */
  async navigateToPage(path: string): Promise<void> {
    const currentLang = await this.getCurrentLanguage()
    const fullPath = currentLang ? `/${currentLang}${path}` : path
    await this.goto(fullPath)
    await this.waitForPageLoad()
    await this.waitForLoadingComplete()
  }

  /**
   * Get current language from URL or page context
   */
  async getCurrentLanguage(): Promise<string> {
    const url = this.page.url()
    
    // Check URL for language prefix
    const langMatch = url.match(/\/([a-z]{2})\//);
    if (langMatch) {
      return langMatch[1]
    }
    
    // Check HTML lang attribute
    const htmlLang = await this.page.getAttribute('html', 'lang')
    if (htmlLang) {
      return htmlLang.substring(0, 2)
    }
    
    // Check for active language selector
    try {
      const activeLanguage = await this.page.locator('[data-testid="active-language"], .active-lang').textContent()
      if (activeLanguage?.toLowerCase().includes('es')) return 'es'
      if (activeLanguage?.toLowerCase().includes('en')) return 'en'
    } catch {}
    
    // Default to English
    return 'en'
  }

  /**
   * Switch to specified language
   */
  async switchLanguage(lang: 'en' | 'es'): Promise<void> {
    try {
      // Method 1: Language selector dropdown
      if (await this.elementExists('[data-testid="language-selector"], select[name="language"]')) {
        await this.languageSelector().selectOption(lang)
        await this.waitForPageLoad()
        return
      }

      // Method 2: Language toggle buttons
      if (lang === 'es' && await this.elementExists('button:has-text("ES"), a:has-text("Español")')) {
        await this.langEsButton().click()
        await this.waitForPageLoad()
        return
      }

      if (lang === 'en' && await this.elementExists('button:has-text("EN"), a:has-text("English")')) {
        await this.langEnButton().click()
        await this.waitForPageLoad()
        return
      }

      // Method 3: Direct URL navigation
      const currentUrl = this.page.url()
      const newUrl = currentUrl.replace(/\/[a-z]{2}\//, `/${lang}/`).replace(/^([^\/]*\/\/[^\/]+)\//, `$1/${lang}/`)
      await this.page.goto(newUrl)
      await this.waitForPageLoad()

    } catch (error) {
      console.log(`Language switch to ${lang} attempted via URL:`, error.message)
      
      // Fallback: Direct navigation
      const currentPath = this.page.url().split('/').slice(3).join('/')
      await this.goto(`/${lang}/${currentPath}`)
    }
  }

  /**
   * Verify content is in the expected language
   */
  async verifyLanguageContent(lang: 'en' | 'es'): Promise<boolean> {
    const allTexts = await this.getAllPageTexts()
    const combinedText = allTexts.join(' ').toLowerCase()
    
    if (lang === 'en') {
      // Check for common English words
      const englishWords = ['dashboard', 'workout', 'exercise', 'progress', 'create', 'generate', 'start', 'complete']
      return englishWords.some(word => combinedText.includes(word))
    } else if (lang === 'es') {
      // Check for common Spanish words
      const spanishWords = ['panel', 'entrenamiento', 'ejercicio', 'progreso', 'crear', 'generar', 'comenzar', 'completar']
      return spanishWords.some(word => combinedText.includes(word))
    }
    
    return false
  }

  /**
   * Get all text content from major page elements
   */
  private async getAllPageTexts(): Promise<string[]> {
    const texts: string[] = []
    
    // Page title
    try {
      const titleText = await this.pageTitle().textContent()
      if (titleText) texts.push(titleText.trim())
    } catch {}

    // Navigation items
    try {
      const navTexts = await this.navigationItems().allTextContents()
      texts.push(...navTexts.filter(text => text.trim()))
    } catch {}

    // Main content
    try {
      const mainText = await this.mainContent().textContent()
      if (mainText) {
        // Split into sentences to avoid huge text blocks
        const sentences = mainText.trim().split('.').slice(0, 10)
        texts.push(...sentences.filter(s => s.trim()))
      }
    } catch {}

    // Button texts
    try {
      const buttonTexts = await this.buttons().allTextContents()
      texts.push(...buttonTexts.filter(text => text.trim()).slice(0, 20))
    } catch {}

    return texts
  }

  /**
   * Get dashboard-specific texts for translation comparison
   */
  async getDashboardTexts(): Promise<string[]> {
    const texts: string[] = []
    
    // Dashboard specific selectors
    const dashboardSelectors = [
      'h1, h2, h3',
      '[data-testid*="dashboard"]',
      '.dashboard-card',
      'nav a',
      'button'
    ]
    
    for (const selector of dashboardSelectors) {
      try {
        const elements = await this.page.locator(selector).all()
        for (const element of elements.slice(0, 10)) { // Limit to prevent overwhelming
          const text = await element.textContent()
          if (text?.trim()) {
            texts.push(text.trim())
          }
        }
      } catch {}
    }
    
    return texts
  }

  /**
   * Get workout-specific terminology for translation verification
   */
  async getWorkoutTerms(): Promise<string[]> {
    const terms: string[] = []
    
    const workoutSelectors = [
      'h1, h2, h3',
      '[data-testid*="workout"]',
      'button',
      'label',
      '.workout-card',
      'form'
    ]
    
    for (const selector of workoutSelectors) {
      try {
        const elements = await this.page.locator(selector).all()
        for (const element of elements.slice(0, 15)) {
          const text = await element.textContent()
          if (text?.trim()) {
            terms.push(text.trim())
          }
        }
      } catch {}
    }
    
    return terms
  }

  /**
   * Get timer interface terminology
   */
  async getTimerTerms(): Promise<string[]> {
    const terms: string[] = []
    
    const timerSelectors = [
      '[data-testid*="timer"] *',
      '.timer *',
      '.timer-controls *',
      '[data-testid*="tabata"] *'
    ]
    
    for (const selector of timerSelectors) {
      try {
        const elements = await this.page.locator(selector).all()
        for (const element of elements.slice(0, 10)) {
          const text = await element.textContent()
          if (text?.trim() && !text.match(/^\d+:\d+$/) && !text.match(/^\d+$/)) { // Skip time displays
            terms.push(text.trim())
          }
        }
      } catch {}
    }
    
    return terms
  }

  /**
   * Get navigation menu items
   */
  async getNavigationItems(): Promise<string[]> {
    const items: string[] = []
    
    try {
      const navElements = await this.navigationItems().all()
      for (const element of navElements) {
        const text = await element.textContent()
        if (text?.trim()) {
          items.push(text.trim())
        }
      }
    } catch {}
    
    return items
  }

  /**
   * Trigger form validation errors for testing validation message translation
   */
  async triggerValidationErrors(): Promise<void> {
    try {
      // Find required fields and leave them empty, then submit
      const requiredInputs = await this.requiredFields().all()
      
      if (requiredInputs.length > 0) {
        // Clear any existing values
        for (const input of requiredInputs.slice(0, 3)) {
          await input.fill('')
        }
        
        // Try to submit form
        const submitButton = this.page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")')
        if (await submitButton.isVisible()) {
          await submitButton.click()
          await this.page.waitForTimeout(1000) // Wait for validation
        }
      }
    } catch (error) {
      console.log('Could not trigger validation errors:', error.message)
    }
  }

  /**
   * Get validation error messages
   */
  async getValidationMessages(): Promise<string[]> {
    const messages: string[] = []
    
    try {
      const validationElements = await this.validationMessages().all()
      for (const element of validationElements) {
        const text = await element.textContent()
        if (text?.trim()) {
          messages.push(text.trim())
        }
      }
    } catch {}
    
    return messages
  }

  /**
   * Get date/time elements for format checking
   */
  async getDateTimeElements(): Promise<string[]> {
    const dateTimeTexts: string[] = []
    
    // Date elements
    try {
      const dateElements = await this.dateElements().all()
      for (const element of dateElements) {
        const text = await element.textContent()
        if (text?.trim()) {
          dateTimeTexts.push(text.trim())
        }
      }
    } catch {}
    
    // Time elements
    try {
      const timeElements = await this.timeElements().all()
      for (const element of timeElements) {
        const text = await element.textContent()
        if (text?.trim()) {
          dateTimeTexts.push(text.trim())
        }
      }
    } catch {}
    
    return dateTimeTexts
  }

  /**
   * Test core functionality in current language
   */
  async testCoreFunctionality(): Promise<void> {
    try {
      // Test navigation
      await this.navigateToWorkouts()
      await this.page.waitForTimeout(1000)
      
      // Test dashboard
      await this.navigateToDashboard()
      await this.page.waitForTimeout(1000)
      
      // Test basic interactions
      const buttons = await this.buttons().all()
      if (buttons.length > 0) {
        // Just verify buttons are clickable, don't actually click
        const isClickable = await buttons[0].isEnabled()
        expect(isClickable).toBe(true)
      }
      
    } catch (error) {
      throw new Error(`Core functionality test failed: ${error.message}`)
    }
  }

  /**
   * Find missing translation keys (keys that weren't translated)
   */
  async findMissingTranslations(): Promise<string[]> {
    const missing: string[] = []
    
    try {
      // Look for text that looks like translation keys
      const allTexts = await this.getAllPageTexts()
      
      for (const text of allTexts) {
        // Check for common patterns of untranslated keys
        if (text.includes('.') && text.length < 50 && !text.includes(' ')) {
          // Looks like a key: "common.button.save"
          missing.push(text)
        } else if (text.startsWith('{{') && text.endsWith('}}')) {
          // Template syntax not resolved
          missing.push(text)
        } else if (text.includes('_') && text.toUpperCase() === text && text.length < 30) {
          // CONSTANT_CASE might be untranslated key
          missing.push(text)
        }
      }
      
    } catch {}
    
    return missing
  }

  /**
   * Test basic navigation functionality
   */
  async testBasicNavigation(): Promise<boolean> {
    try {
      const currentUrl = this.page.url()
      
      // Try to navigate to dashboard
      await this.navigateToDashboard()
      await this.page.waitForTimeout(1000)
      
      // Check if navigation worked
      const dashboardUrl = this.page.url()
      const navigationWorked = dashboardUrl !== currentUrl && dashboardUrl.includes('dashboard')
      
      return navigationWorked
    } catch {
      return false
    }
  }
}