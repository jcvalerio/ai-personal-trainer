import { Page } from '@playwright/test';

export interface TestWorkoutPlan {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: TestExercise[];
}

export interface TestExercise {
  name: string;
  category: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime?: number;
}

export interface TestWorkoutSession {
  planId?: string;
  startTime: Date;
  exercises: TestSessionExercise[];
  notes?: string;
}

export interface TestSessionExercise {
  exerciseId: string;
  sets: TestSet[];
  notes?: string;
}

export interface TestSet {
  reps: number;
  weight?: number;
  duration?: number;
  completed: boolean;
}

/**
 * Test data management utilities
 */
export class TestDataUtils {
  private readonly page: Page;
  private createdData: Set<string> = new Set();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Generate sample workout plans for testing
   */
  generateWorkoutPlans(): TestWorkoutPlan[] {
    return [
      {
        name: 'Beginner Full Body',
        description: 'A complete beginner-friendly full body workout',
        difficulty: 'beginner',
        duration: 45,
        exercises: [
          {
            name: 'Push-ups',
            category: 'chest',
            sets: 3,
            reps: 10,
            restTime: 60,
          },
          {
            name: 'Bodyweight Squats',
            category: 'legs',
            sets: 3,
            reps: 15,
            restTime: 60,
          },
          {
            name: 'Plank',
            category: 'core',
            sets: 3,
            reps: 1,
            duration: 30,
            restTime: 45,
          },
        ],
      },
      {
        name: 'Intermediate Upper Body',
        description: 'Challenging upper body strength workout',
        difficulty: 'intermediate',
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            category: 'chest',
            sets: 4,
            reps: 8,
            weight: 135,
            restTime: 90,
          },
          {
            name: 'Pull-ups',
            category: 'back',
            sets: 4,
            reps: 6,
            restTime: 90,
          },
          {
            name: 'Overhead Press',
            category: 'shoulders',
            sets: 3,
            reps: 10,
            weight: 95,
            restTime: 75,
          },
        ],
      },
      {
        name: 'Advanced HIIT Cardio',
        description: 'High-intensity interval training session',
        difficulty: 'advanced',
        duration: 30,
        exercises: [
          {
            name: 'Burpees',
            category: 'cardio',
            sets: 5,
            reps: 15,
            restTime: 30,
          },
          {
            name: 'Mountain Climbers',
            category: 'cardio',
            sets: 5,
            reps: 20,
            restTime: 30,
          },
          {
            name: 'Jump Squats',
            category: 'legs',
            sets: 5,
            reps: 12,
            restTime: 30,
          },
        ],
      },
    ];
  }

  /**
   * Generate sample exercises for testing
   */
  generateExercises(): TestExercise[] {
    return [
      {
        name: 'Push-ups',
        category: 'chest',
        sets: 3,
        reps: 12,
        restTime: 60,
      },
      {
        name: 'Pull-ups',
        category: 'back',
        sets: 3,
        reps: 8,
        restTime: 90,
      },
      {
        name: 'Squats',
        category: 'legs',
        sets: 4,
        reps: 15,
        weight: 135,
        restTime: 75,
      },
      {
        name: 'Deadlift',
        category: 'back',
        sets: 3,
        reps: 5,
        weight: 225,
        restTime: 120,
      },
      {
        name: 'Bench Press',
        category: 'chest',
        sets: 4,
        reps: 8,
        weight: 155,
        restTime: 90,
      },
      {
        name: 'Overhead Press',
        category: 'shoulders',
        sets: 3,
        reps: 10,
        weight: 95,
        restTime: 75,
      },
      {
        name: 'Plank',
        category: 'core',
        sets: 3,
        reps: 1,
        duration: 60,
        restTime: 45,
      },
      {
        name: 'Burpees',
        category: 'cardio',
        sets: 3,
        reps: 10,
        restTime: 60,
      },
    ];
  }

  /**
   * Generate a sample workout session
   */
  generateWorkoutSession(planId?: string): TestWorkoutSession {
    return {
      planId,
      startTime: new Date(),
      exercises: [
        {
          exerciseId: 'push-ups',
          sets: [
            { reps: 12, completed: true },
            { reps: 10, completed: true },
            { reps: 8, completed: true },
          ],
          notes: 'Good form maintained',
        },
        {
          exerciseId: 'squats',
          sets: [
            { reps: 15, weight: 135, completed: true },
            { reps: 12, weight: 135, completed: true },
            { reps: 10, weight: 135, completed: false },
          ],
        },
      ],
      notes: 'Great workout session!',
    };
  }

  /**
   * Create test workout plan via API
   */
  async createWorkoutPlan(planData: TestWorkoutPlan): Promise<string> {
    const response = await this.page.request.post('/api/workouts/plans', {
      data: planData,
    });

    if (!response.ok()) {
      throw new Error(`Failed to create workout plan: ${response.status()}`);
    }

    const result = await response.json();
    const planId = result.id || result.planId;

    if (planId) {
      this.createdData.add(`plan:${planId}`);
    }

    return planId;
  }

  /**
   * Create test workout session via API
   */
  async createWorkoutSession(sessionData: TestWorkoutSession): Promise<string> {
    const response = await this.page.request.post('/api/workouts/sessions', {
      data: sessionData,
    });

    if (!response.ok()) {
      throw new Error(`Failed to create workout session: ${response.status()}`);
    }

    const result = await response.json();
    const sessionId = result.id || result.sessionId;

    if (sessionId) {
      this.createdData.add(`session:${sessionId}`);
    }

    return sessionId;
  }

  /**
   * Generate realistic user profile data
   */
  generateUserProfile() {
    return {
      firstName: 'Claude',
      lastName: 'Test',
      age: 30,
      fitnessLevel: 'intermediate',
      goals: ['weight_loss', 'muscle_gain'],
      preferences: {
        workoutDuration: 60,
        workoutFrequency: 4,
        equipmentAvailable: ['dumbbells', 'barbell', 'pullup_bar'],
        injuriesLimitations: [],
      },
      measurements: {
        weight: 175,
        height: 70,
        bodyFatPercentage: 15,
      },
    };
  }

  /**
   * Generate AI workout generation parameters
   */
  generateAIWorkoutRequest() {
    return {
      fitnessLevel: 'intermediate',
      goals: ['muscle_gain', 'strength'],
      duration: 60,
      equipment: ['dumbbells', 'barbell'],
      muscleGroups: ['chest', 'back', 'legs'],
      workoutType: 'strength_training',
      difficulty: 'moderate',
    };
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiResponse(url: string, timeout = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`API call to ${url} timed out after ${timeout}ms`));
      }, timeout);

      this.page.on('response', async (response) => {
        if (response.url().includes(url)) {
          clearTimeout(timer);
          try {
            const data = await response.json();
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Clean up test data created during tests
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    const cleanupPromises: Promise<void>[] = [];

    for (const dataId of this.createdData) {
      const [type, id] = dataId.split(':');

      switch (type) {
        case 'plan':
          cleanupPromises.push(this.deleteWorkoutPlan(id));
          break;
        case 'session':
          cleanupPromises.push(this.deleteWorkoutSession(id));
          break;
      }
    }

    try {
      await Promise.allSettled(cleanupPromises);
      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.warn('⚠️ Some test data cleanup failed:', error);
    }

    this.createdData.clear();
  }

  /**
   * Delete workout plan via API
   */
  private async deleteWorkoutPlan(planId: string): Promise<void> {
    try {
      const response = await this.page.request.delete(
        `/api/workouts/plans/${planId}`
      );
      if (!response.ok()) {
        console.warn(
          `Failed to delete workout plan ${planId}: ${response.status()}`
        );
      }
    } catch (error) {
      console.warn(`Error deleting workout plan ${planId}:`, error);
    }
  }

  /**
   * Delete workout session via API
   */
  private async deleteWorkoutSession(sessionId: string): Promise<void> {
    try {
      const response = await this.page.request.delete(
        `/api/workouts/sessions/${sessionId}`
      );
      if (!response.ok()) {
        console.warn(
          `Failed to delete workout session ${sessionId}: ${response.status()}`
        );
      }
    } catch (error) {
      console.warn(`Error deleting workout session ${sessionId}:`, error);
    }
  }

  /**
   * Reset user profile to default test state
   */
  async resetUserProfile(): Promise<void> {
    try {
      const defaultProfile = this.generateUserProfile();
      const response = await this.page.request.put('/api/user/profile', {
        data: defaultProfile,
      });

      if (!response.ok()) {
        console.warn(`Failed to reset user profile: ${response.status()}`);
      }
    } catch (error) {
      console.warn('Error resetting user profile:', error);
    }
  }

  /**
   * Get random test data for forms
   */
  getRandomFormData() {
    const workoutNames = [
      'Morning Strength',
      'Evening Cardio',
      'Quick HIIT',
      'Full Body Blast',
      'Upper Body Power',
      'Leg Day Special',
      'Core Crusher',
      'Flexibility Focus',
    ];

    const descriptions = [
      'A challenging workout to build strength',
      'Perfect for burning calories and improving endurance',
      'Quick and effective training session',
      'Comprehensive workout targeting all muscle groups',
    ];

    return {
      workoutName:
        workoutNames[Math.floor(Math.random() * workoutNames.length)],
      description:
        descriptions[Math.floor(Math.random() * descriptions.length)],
      duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
      sets: Math.floor(Math.random() * 4) + 2, // 2-5 sets
      reps: Math.floor(Math.random() * 10) + 8, // 8-17 reps
      weight: Math.floor(Math.random() * 100) + 50, // 50-149 lbs
    };
  }
}
