import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Workouts page object model
 */
export class WorkoutsPage extends BasePage {
  // Locators
  private readonly workoutsList = () =>
    this.page.locator('[data-testid="workouts-list"]');
  private readonly createWorkoutButton = () =>
    this.page.locator('button:has-text("Create"), a:has-text("New Workout")');
  private readonly searchInput = () =>
    this.page.locator('input[placeholder*="Search" i], input[type="search"]');
  private readonly filterDropdown = () =>
    this.page.locator('select[data-testid="filter"], select:has(option)');
  private readonly workoutCards = () =>
    this.page.locator('[data-testid="workout-card"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workouts page
   */
  async navigate(): Promise<void> {
    await this.goto('/workouts');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/workouts/);

    // Check for key page elements
    const isLoaded = await Promise.race([
      this.elementExists('[data-testid="workouts-content"]'),
      this.elementExists('h1'),
      this.elementExists('[data-testid="workouts-list"]'),
      this.elementExists('main'),
    ]);

    expect(isLoaded).toBe(true);
  }

  /**
   * Get all workout cards
   */
  async getWorkoutCards(): Promise<string[]> {
    await this.waitForLoadingComplete();

    const cards = await this.workoutCards().all();
    const workouts: string[] = [];

    for (const card of cards) {
      const text = await card.textContent();
      if (text?.trim()) {
        workouts.push(text.trim());
      }
    }

    return workouts;
  }

  /**
   * Click on a workout card by index
   */
  async selectWorkout(index: number): Promise<void> {
    const cards = await this.workoutCards().all();

    if (index >= cards.length) {
      throw new Error(
        `Workout index ${index} is out of range. Found ${cards.length} workouts.`
      );
    }

    await cards[index].click();
    await this.waitForPageLoad();
  }

  /**
   * Click on a workout card by name
   */
  async selectWorkoutByName(name: string): Promise<void> {
    const workoutCard = this.page.locator(
      `[data-testid="workout-card"]:has-text("${name}")`
    );

    if (!(await workoutCard.isVisible())) {
      throw new Error(`Workout "${name}" not found`);
    }

    await workoutCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Create new workout
   */
  async createNewWorkout(): Promise<void> {
    if (
      await this.elementExists(
        'button:has-text("Create"), a:has-text("New Workout")'
      )
    ) {
      await this.createWorkoutButton().first().click();
      await this.waitForPageLoad();
    } else {
      throw new Error('Create workout button not found');
    }
  }

  /**
   * Search for workouts
   */
  async searchWorkouts(query: string): Promise<void> {
    if (
      await this.elementExists(
        'input[placeholder*="Search" i], input[type="search"]'
      )
    ) {
      await this.searchInput().fill(query);
      await this.page.waitForTimeout(1000); // Wait for search results
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Filter workouts by category
   */
  async filterByCategory(category: string): Promise<void> {
    if (
      await this.elementExists(
        'select[data-testid="filter"], select:has(option)'
      )
    ) {
      await this.filterDropdown().selectOption(category);
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Get workout count
   */
  async getWorkoutCount(): Promise<number> {
    await this.waitForLoadingComplete();
    return await this.workoutCards().count();
  }

  /**
   * Verify workouts are displayed
   */
  async verifyWorkoutsDisplayed(): Promise<void> {
    await this.waitForLoadingComplete();

    const hasWorkouts = await this.elementExists(
      '[data-testid="workout-card"]'
    );
    const hasEmptyState = await this.elementExists(
      '[data-testid="empty-state"], .empty-state'
    );

    // Either should have workouts or empty state
    expect(hasWorkouts || hasEmptyState).toBe(true);
  }
}

/**
 * Workout Plans page object model
 */
export class WorkoutPlansPage extends BasePage {
  // Locators
  private readonly plansList = () =>
    this.page.locator('[data-testid="plans-list"]');
  private readonly createPlanButton = () =>
    this.page.locator('button:has-text("Create Plan"), a:has-text("New Plan")');
  private readonly planCards = () =>
    this.page.locator('[data-testid="plan-card"]');
  private readonly searchInput = () =>
    this.page.locator('input[placeholder*="Search" i], input[type="search"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workout plans page
   */
  async navigate(): Promise<void> {
    await this.goto('/workouts/plans');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/workouts\/plans/);

    const isLoaded = await Promise.race([
      this.elementExists('[data-testid="plans-content"]'),
      this.elementExists('h1'),
      this.elementExists('[data-testid="plans-list"]'),
      this.elementExists('main'),
    ]);

    expect(isLoaded).toBe(true);
  }

  /**
   * Get all workout plan cards
   */
  async getPlanCards(): Promise<string[]> {
    await this.waitForLoadingComplete();

    const cards = await this.planCards().all();
    const plans: string[] = [];

    for (const card of cards) {
      const text = await card.textContent();
      if (text?.trim()) {
        plans.push(text.trim());
      }
    }

    return plans;
  }

  /**
   * Select a plan by index
   */
  async selectPlan(index: number): Promise<void> {
    const cards = await this.planCards().all();

    if (index >= cards.length) {
      throw new Error(
        `Plan index ${index} is out of range. Found ${cards.length} plans.`
      );
    }

    await cards[index].click();
    await this.waitForPageLoad();
  }

  /**
   * Select a plan by name
   */
  async selectPlanByName(name: string): Promise<void> {
    const planCard = this.page.locator(
      `[data-testid="plan-card"]:has-text("${name}")`
    );

    if (!(await planCard.isVisible())) {
      throw new Error(`Plan "${name}" not found`);
    }

    await planCard.click();
    await this.waitForPageLoad();
  }

  /**
   * Create new workout plan
   */
  async createNewPlan(): Promise<void> {
    if (
      await this.elementExists(
        'button:has-text("Create Plan"), a:has-text("New Plan")'
      )
    ) {
      await this.createPlanButton().first().click();
      await this.waitForPageLoad();
    } else {
      throw new Error('Create plan button not found');
    }
  }

  /**
   * Search for plans
   */
  async searchPlans(query: string): Promise<void> {
    if (
      await this.elementExists(
        'input[placeholder*="Search" i], input[type="search"]'
      )
    ) {
      await this.searchInput().fill(query);
      await this.page.waitForTimeout(1000);
      await this.waitForLoadingComplete();
    }
  }

  /**
   * Get plan count
   */
  async getPlanCount(): Promise<number> {
    await this.waitForLoadingComplete();
    return await this.planCards().count();
  }
}

/**
 * Workout Generation page object model
 */
export class WorkoutGenerationPage extends BasePage {
  // Locators
  private readonly fitnessLevelSelect = () =>
    this.page.locator(
      'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
    );
  private readonly durationInput = () =>
    this.page.locator('input[name="duration"], input[data-testid="duration"]');
  private readonly equipmentCheckboxes = () =>
    this.page.locator('input[type="checkbox"][name*="equipment"]');
  private readonly muscleGroupsSelect = () =>
    this.page.locator(
      'select[name="muscleGroups"], [data-testid="muscle-groups"]'
    );
  private readonly generateButton = () =>
    this.page.locator('button:has-text("Generate"), button[type="submit"]');
  private readonly generatedWorkout = () =>
    this.page.locator('[data-testid="generated-workout"]');
  private readonly saveButton = () =>
    this.page.locator('button:has-text("Save")');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to workout generation page
   */
  async navigate(): Promise<void> {
    await this.goto('/workouts/generate');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/workouts\/generate/);

    const isLoaded = await Promise.race([
      this.elementExists('form'),
      this.elementExists('[data-testid="generation-form"]'),
      this.elementExists('h1'),
      this.elementExists('main'),
    ]);

    expect(isLoaded).toBe(true);
  }

  /**
   * Fill workout generation form
   */
  async fillGenerationForm(options: {
    fitnessLevel?: string;
    duration?: number;
    equipment?: string[];
    muscleGroups?: string[];
    goals?: string[];
  }): Promise<void> {
    // Set fitness level
    if (
      options.fitnessLevel &&
      (await this.elementExists(
        'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
      ))
    ) {
      await this.fitnessLevelSelect().selectOption(options.fitnessLevel);
    }

    // Set duration
    if (
      options.duration &&
      (await this.elementExists(
        'input[name="duration"], input[data-testid="duration"]'
      ))
    ) {
      await this.durationInput().fill(options.duration.toString());
    }

    // Select equipment
    if (options.equipment && options.equipment.length > 0) {
      const equipmentCheckboxes = await this.equipmentCheckboxes().all();

      for (const checkbox of equipmentCheckboxes) {
        const value = await checkbox.getAttribute('value');
        if (value && options.equipment.includes(value)) {
          await checkbox.check();
        }
      }
    }

    // Select muscle groups
    if (options.muscleGroups && options.muscleGroups.length > 0) {
      // Handle different types of muscle group selectors
      if (await this.elementExists('select[name="muscleGroups"]')) {
        for (const group of options.muscleGroups) {
          await this.muscleGroupsSelect().selectOption(group);
        }
      } else if (
        await this.elementExists('input[type="checkbox"][name*="muscle"]')
      ) {
        const muscleCheckboxes = this.page.locator(
          'input[type="checkbox"][name*="muscle"]'
        );
        const checkboxes = await muscleCheckboxes.all();

        for (const checkbox of checkboxes) {
          const value = await checkbox.getAttribute('value');
          if (value && options.muscleGroups.includes(value)) {
            await checkbox.check();
          }
        }
      }
    }
  }

  /**
   * Generate workout
   */
  async generateWorkout(): Promise<void> {
    await this.generateButton().click();

    // Wait for generation to complete
    await this.waitForLoadingComplete();
    await this.waitForElement(
      '[data-testid="generated-workout"], .workout-result',
      30000
    );
  }

  /**
   * Complete workout generation flow
   */
  async completeWorkoutGeneration(
    options: {
      fitnessLevel?: string;
      duration?: number;
      equipment?: string[];
      muscleGroups?: string[];
      goals?: string[];
    } = {}
  ): Promise<void> {
    const defaultOptions = {
      fitnessLevel: 'intermediate',
      duration: 45,
      equipment: ['bodyweight'],
      muscleGroups: ['chest', 'legs'],
      ...options,
    };

    await this.fillGenerationForm(defaultOptions);
    await this.generateWorkout();
  }

  /**
   * Check if workout was generated
   */
  async isWorkoutGenerated(): Promise<boolean> {
    return await this.elementExists(
      '[data-testid="generated-workout"], .workout-result'
    );
  }

  /**
   * Get generated workout content
   */
  async getGeneratedWorkoutContent(): Promise<string> {
    if (await this.isWorkoutGenerated()) {
      const content = await this.generatedWorkout().textContent();
      return content?.trim() || '';
    }
    return '';
  }

  /**
   * Save generated workout
   */
  async saveGeneratedWorkout(): Promise<void> {
    if (!(await this.isWorkoutGenerated())) {
      throw new Error('No workout generated to save');
    }

    if (await this.elementExists('button:has-text("Save")')) {
      await this.saveButton().click();
      await this.waitForPageLoad();
    } else {
      throw new Error('Save button not found');
    }
  }

  /**
   * Get available equipment options
   */
  async getAvailableEquipment(): Promise<string[]> {
    const equipmentOptions: string[] = [];
    const checkboxes = await this.equipmentCheckboxes().all();

    for (const checkbox of checkboxes) {
      const value = await checkbox.getAttribute('value');
      if (value) {
        equipmentOptions.push(value);
      }
    }

    return equipmentOptions;
  }

  /**
   * Verify generation form is functional
   */
  async verifyGenerationForm(): Promise<void> {
    // At least some form elements should be present
    const hasFormElements = await Promise.race([
      this.elementExists(
        'select[name="fitnessLevel"], select[data-testid="fitness-level"]'
      ),
      this.elementExists(
        'input[name="duration"], input[data-testid="duration"]'
      ),
      this.elementExists('input[type="checkbox"]'),
      this.elementExists('button:has-text("Generate"), button[type="submit"]'),
    ]);

    expect(hasFormElements).toBe(true);

    // Generate button should be present
    await expect(this.generateButton()).toBeVisible();
  }
}
