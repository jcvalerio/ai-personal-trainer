/**
 * Zod validation schemas for workout-related API endpoints
 * Provides type-safe validation for all workout operations
 */

import { z } from 'zod';

// Base schemas for reusable types
export const fitnessLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);
export const exerciseTypeSchema = z.enum([
  'strength',
  'cardio',
  'flexibility',
  'sports',
]);
export const workoutStatusSchema = z.enum([
  'draft',
  'active',
  'completed',
  'paused',
  'archived',
]);
export const sessionStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'skipped',
  'cancelled',
]);
export const sessionTypeSchema = z.enum(['workout', 'assessment', 'recovery']);
export const exercisePhaseSchema = z.enum(['warm_up', 'main', 'cool_down']);
export const measurementTypeSchema = z.enum([
  'weight',
  'body_fat',
  'muscle_mass',
  'circumference',
]);
export const achievementTypeSchema = z.enum([
  'streak',
  'milestone',
  'pr',
  'consistency',
]);
export const generationStatusSchema = z.enum([
  'pending',
  'generating',
  'completed',
  'failed',
  'cancelled',
]);

// Common pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Equipment schemas
export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(1000).optional(),
  category: z.string().min(2).max(50).trim(),
  subcategory: z.string().max(50).trim().optional(),
  manufacturer: z.string().max(100).trim().optional(),
  model: z.string().max(100).trim().optional(),
  dimensions: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      weight: z.number().positive().optional(),
      unit: z.enum(['cm', 'in', 'mm']).default('cm'),
    })
    .optional(),
  maxUsersSimultaneously: z.number().int().min(1).default(1),
  maintenanceIntervalDays: z.number().int().min(1).default(30),
  safetyRequirements: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  instructionManualUrl: z.string().url().optional(),
  demoVideoUrl: z.string().url().optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const equipmentFiltersSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  manufacturer: z.string().optional(),
  search: z.string().min(2).optional(),
});

// Exercise schemas
const baseExerciseSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().min(10).max(2000),
  instructions: z.string().min(20).max(5000),
  exerciseType: exerciseTypeSchema,
  primaryMuscleGroups: z.array(z.string()).min(1).max(5),
  secondaryMuscleGroups: z.array(z.string()).max(5).default([]),
  difficultyLevel: fitnessLevelSchema.default('beginner'),
  equipmentRequired: z.array(z.string().uuid()).default([]),
  equipmentOptional: z.array(z.string().uuid()).default([]),
  equipmentAlternatives: z.record(z.array(z.string())).default(() => ({})),
  defaultSets: z.number().int().min(1).max(10).optional(),
  defaultRepsMin: z.number().int().min(1).optional(),
  defaultRepsMax: z.number().int().min(1).optional(),
  defaultWeightPercentage: z.number().min(0).max(200).optional(),
  defaultRestSeconds: z.number().int().min(0).max(600).optional(),
  defaultDurationSeconds: z.number().int().min(1).max(7200).optional(),
  demoVideoUrl: z.string().url().optional(),
  demoImageUrl: z.string().url().optional(),
  instructionImages: z.array(z.string().url()).default([]),
  contraindications: z.array(z.string()).default([]),
  modifications: z.record(z.any()).default(() => ({})),
  safetyTips: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
});

export const createExerciseSchema = baseExerciseSchema.refine(
  (data) => {
    if (data.defaultRepsMin && data.defaultRepsMax) {
      return data.defaultRepsMax >= data.defaultRepsMin;
    }
    return true;
  },
  {
    message: 'defaultRepsMax must be greater than or equal to defaultRepsMin',
  }
);

export const updateExerciseSchema = baseExerciseSchema.partial();

export const exerciseFiltersSchema = z.object({
  exerciseType: exerciseTypeSchema.optional(),
  difficultyLevel: fitnessLevelSchema.optional(),
  muscleGroup: z.string().optional(),
  equipmentRequired: z.array(z.string().uuid()).optional(),
  search: z.string().min(2).optional(),
  isVerified: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Workout plan schemas
export const workoutPlanDataSchema = z.object({
  summary: z.string().max(1000),
  phases: z.array(
    z.object({
      name: z.string().min(2).max(100),
      description: z.string().max(500),
      durationWeeks: z.number().int().min(1).max(52),
      sessions: z.array(z.any()), // Will contain session references
    })
  ),
  progressionStrategy: z.string().max(1000),
  notes: z.string().max(2000).optional(),
  // Allow additional fields for AI-generated data
  templates: z.array(z.any()).optional(), // Session templates
  schedule: z.record(z.any()).optional(), // Weekly schedule
  aiWorkoutData: z.object({
    warmUpExercises: z.array(z.any()).optional(),
    mainExercises: z.array(z.any()).optional(),
    coolDownExercises: z.array(z.any()).optional(),
    sessionData: z.record(z.any()).optional(),
    enhancedProfile: z.object({
      age: z.number().optional(),
      gender: z.string().optional(),
      healthConditions: z.array(z.string()).optional(),
      specificFocus: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const weeklyScheduleSchema = z.record(
  z.array(
    z.object({
      day: z.string(),
      sessionId: z.string().uuid().optional(),
      sessionName: z.string(),
      type: z.enum(['workout', 'rest', 'active_recovery']),
      duration: z.number().int().min(1).max(300),
    })
  )
);

export const createWorkoutPlanSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).optional(),
  durationWeeks: z.number().int().min(1).max(104),
  sessionsPerWeek: z.number().int().min(1).max(14),
  fitnessGoals: z.array(z.string()).min(1).max(10),
  targetFitnessLevel: fitnessLevelSchema.default('beginner'),
  estimatedSessionDuration: z.number().int().min(10).max(300).optional(),
  planData: workoutPlanDataSchema.optional().default(() => ({
    summary: '',
    phases: [],
    progressionStrategy: '',
    notes: '',
  })),
  weeklySchedule: weeklyScheduleSchema.optional().default(() => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })),
  progressionRules: z.record(z.any()).default(() => ({})),
  aiPromptUsed: z.string().max(5000).optional(),
  aiModelVersion: z.string().max(50).optional(),
  aiGenerationId: z.string().uuid().optional(),
  generationParameters: z.record(z.any()).default(() => ({})),
  isTemplate: z.boolean().default(false),
  templateCategory: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
});

export const updateWorkoutPlanSchema = createWorkoutPlanSchema
  .partial()
  .extend({
    status: workoutStatusSchema.optional(),
  });

export const workoutPlanFiltersSchema = z.object({
  status: workoutStatusSchema.optional(),
  isTemplate: z.boolean().optional(),
  targetFitnessLevel: fitnessLevelSchema.optional(),
  search: z.string().min(2).optional(),
});

// Workout session schemas
export const sessionDataSchema = z.object({
  totalExercises: z.number().int().min(0),
  estimatedDuration: z.number().int().min(1),
  targetMuscleGroups: z.array(z.string()),
  equipmentNeeded: z.array(z.string()),
  difficultyLevel: fitnessLevelSchema,
});

export const sessionExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  supersetGroup: z.number().int().min(1).optional(),
  exercisePhase: exercisePhaseSchema.default('main'),
  plannedSets: z.number().int().min(1).optional(),
  plannedReps: z.number().int().min(1).optional(),
  plannedWeightKg: z.number().min(0).optional(),
  plannedDurationSeconds: z.number().int().min(1).optional(),
  plannedDistanceMeters: z.number().min(0).optional(),
  plannedRestSeconds: z.number().int().min(0).optional(),
  equipmentAlternatives: z.array(z.string()).default([]),
});

export const createWorkoutSessionSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  workoutPlanId: z.string().uuid().optional(),
  sessionType: sessionTypeSchema.default('workout'),
  scheduledDate: z.string().datetime().or(z.date()),
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  scheduledDuration: z.number().int().min(1).max(300).optional(),
  sessionData: sessionDataSchema.optional().default(() => ({
    difficultyLevel: 'beginner' as const,
    targetMuscleGroups: [],
    totalExercises: 0,
    estimatedDuration: 0,
    equipmentNeeded: [],
  })),
  warmUpExercises: z.array(sessionExerciseSchema).default([]),
  mainExercises: z.array(sessionExerciseSchema).default([]),
  coolDownExercises: z.array(sessionExerciseSchema).default([]),
});

export const updateWorkoutSessionSchema = createWorkoutSessionSchema
  .partial()
  .extend({
    status: sessionStatusSchema.optional(),
    completionPercentage: z.number().int().min(0).max(100).optional(),
    effortRating: z.number().int().min(1).max(10).optional(),
    energyLevelBefore: z.number().int().min(1).max(10).optional(),
    energyLevelAfter: z.number().int().min(1).max(10).optional(),
    equipmentUsed: z.array(z.string()).optional(),
    gymLocation: z.string().max(200).optional(),
    userNotes: z.string().max(2000).optional(),
    trainerNotes: z.string().max(2000).optional(),
  });

export const workoutSessionFiltersSchema = z.object({
  status: sessionStatusSchema.optional(),
  workoutPlanId: z.string().uuid().optional(),
  sessionType: sessionTypeSchema.optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
});

export const completeSessionSchema = z.object({
  effortRating: z.number().int().min(1).max(10).optional(),
  energyLevelAfter: z.number().int().min(1).max(10).optional(),
  userNotes: z.string().max(2000).optional(),
});

// Session exercise tracking schemas
export const updateSessionExerciseSchema = z.object({
  actualSets: z.number().int().min(1).optional(),
  actualReps: z.number().int().min(1).optional(),
  actualWeightKg: z.number().min(0).optional(),
  actualDurationSeconds: z.number().int().min(1).optional(),
  actualDistanceMeters: z.number().min(0).optional(),
  actualRestSeconds: z.number().int().min(0).optional(),
  setData: z
    .array(
      z.object({
        setNumber: z.number().int().min(1),
        reps: z.number().int().min(0),
        weight: z.number().min(0).optional(),
        duration: z.number().int().min(0).optional(),
        distance: z.number().min(0).optional(),
        restSeconds: z.number().int().min(0).optional(),
        perceivedExertion: z.number().int().min(1).max(10).optional(),
        formRating: z.number().int().min(1).max(5).optional(),
      })
    )
    .default([]),
  equipmentUsed: z.string().max(200).optional(),
  equipmentAlternatives: z.array(z.string()).default([]),
  exerciseModifications: z.array(z.string()).default([]),
  perceivedExertion: z.number().int().min(1).max(10).optional(),
  formRating: z.number().int().min(1).max(5).optional(),
  difficultyRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
});

// Progress measurement schemas
export const createProgressMeasurementSchema = z
  .object({
    measurementType: measurementTypeSchema,
    measurementLocation: z.string().max(100).optional(),
    value: z.number().positive(),
    unit: z.string().min(1).max(20),
    measuredAt: z.string().datetime().or(z.date()).optional(),
    measurementMethod: z.string().max(100).optional(),
    measurementDevice: z.string().max(100).optional(),
    bodyComposition: z.record(z.number()).default(() => ({})),
    notes: z.string().max(1000).optional(),
    photoUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // Circumference measurements require a location
      if (data.measurementType === 'circumference') {
        return (
          data.measurementLocation && data.measurementLocation.trim().length > 0
        );
      }
      return true;
    },
    {
      message: 'measurementLocation is required for circumference measurements',
    }
  );

// Create base schema without refinement for partial updates
const baseProgressMeasurementSchema = z.object({
  measurementType: measurementTypeSchema,
  measurementLocation: z.string().max(100).optional(),
  value: z.number().positive(),
  unit: z.string().min(1).max(20),
  measuredAt: z.string().datetime().or(z.date()).optional(),
  measurementMethod: z.string().max(100).optional(),
  measurementDevice: z.string().max(100).optional(),
  bodyComposition: z.record(z.number()).default(() => ({})),
  notes: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
});

export const updateProgressMeasurementSchema =
  baseProgressMeasurementSchema.partial();

export const progressMeasurementFiltersSchema = z.object({
  measurementType: measurementTypeSchema.optional(),
  measurementLocation: z.string().optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
});

export const progressStatsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

// User achievement schemas
export const createUserAchievementSchema = z.object({
  achievementType: achievementTypeSchema,
  achievementName: z.string().min(2).max(200).trim(),
  description: z.string().min(10).max(1000),
  value: z.number().optional(),
  unit: z.string().max(20).optional(),
  category: z.string().max(100).optional(),
  achievedAt: z.string().datetime().or(z.date()).optional(),
  previousBest: z.number().optional(),
  improvementPercentage: z.number().min(0).optional(),
  relatedSessionId: z.string().uuid().optional(),
  relatedExerciseId: z.string().uuid().optional(),
  badgeIcon: z.string().max(100).optional(),
  badgeColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
  isMilestone: z.boolean().default(false),
  milestoneLevel: z.number().int().min(1).optional(),
  pointsAwarded: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(false),
});

export const userAchievementFiltersSchema = z.object({
  achievementType: achievementTypeSchema.optional(),
  category: z.string().optional(),
  isMilestone: z.boolean().optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
});

// Workout generation schemas
export const workoutGenerationRequestSchema = z.object({
  jobType: z.enum([
    'workout_plan',
    'single_session',
    'exercise_recommendation',
  ]),
  generationPrompt: z.string().min(10).max(5000),
  userPreferences: z.object({
    fitnessLevel: fitnessLevelSchema,
    fitnessGoals: z.array(z.string()).min(1).max(10),
    preferredExerciseTypes: z.array(exerciseTypeSchema).default([]),
    avoidExercises: z.array(z.string()).default([]),
    trainingDaysPerWeek: z.number().int().min(1).max(7),
    sessionDurationMinutes: z.number().int().min(15).max(180),
  }),
  fitnessProfile: z.object({
    currentLevel: fitnessLevelSchema,
    injuries: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([]),
    experience: z.array(z.string()).default([]),
    preferences: z.record(z.any()).default(() => ({})),
  }),
  equipmentAvailable: z.array(z.string().uuid()).default([]),
  timeConstraints: z
    .object({
      maxSessionDuration: z.number().int().min(15).max(180),
      preferredTimeSlots: z.array(z.string()).default([]),
      daysPerWeek: z.number().int().min(1).max(7),
    })
    .optional(),
  generationParameters: z.record(z.any()).default(() => ({})),
});

export const workoutGenerationJobFiltersSchema = z.object({
  jobType: z
    .enum(['workout_plan', 'single_session', 'exercise_recommendation'])
    .optional(),
  status: generationStatusSchema.optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
});

// Exercise recommendation schemas
export const exerciseRecommendationRequestSchema = z.object({
  targetMuscleGroups: z.array(z.string()).min(1),
  excludeMuscleGroups: z.array(z.string()).default([]),
  exerciseTypes: z.array(exerciseTypeSchema).default([]),
  difficultyLevel: fitnessLevelSchema.optional(),
  equipmentAvailable: z.array(z.string().uuid()).default([]),
  sessionDuration: z.number().int().min(15).max(180),
  fitnessGoals: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  count: z.number().int().min(1).max(50).default(10),
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
  meta: z.record(z.any()).optional(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  timestamp: z.string().datetime(),
  meta: z.record(z.any()).optional(),
});

// Export all schema types
export type CreateEquipmentRequest = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentRequest = z.infer<typeof updateEquipmentSchema>;
export type EquipmentFilters = z.infer<typeof equipmentFiltersSchema>;

export type CreateExerciseRequest = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseRequest = z.infer<typeof updateExerciseSchema>;
export type ExerciseFilters = z.infer<typeof exerciseFiltersSchema>;

export type CreateWorkoutPlanRequest = z.infer<typeof createWorkoutPlanSchema>;
export type UpdateWorkoutPlanRequest = z.infer<typeof updateWorkoutPlanSchema>;
export type WorkoutPlanFilters = z.infer<typeof workoutPlanFiltersSchema>;

export type CreateWorkoutSessionRequest = z.infer<
  typeof createWorkoutSessionSchema
>;
export type UpdateWorkoutSessionRequest = z.infer<
  typeof updateWorkoutSessionSchema
>;
export type WorkoutSessionFilters = z.infer<typeof workoutSessionFiltersSchema>;
export type CompleteSessionRequest = z.infer<typeof completeSessionSchema>;

export type UpdateSessionExerciseRequest = z.infer<
  typeof updateSessionExerciseSchema
>;

export type CreateProgressMeasurementRequest = z.infer<
  typeof createProgressMeasurementSchema
>;
export type UpdateProgressMeasurementRequest = z.infer<
  typeof updateProgressMeasurementSchema
>;
export type ProgressMeasurementFilters = z.infer<
  typeof progressMeasurementFiltersSchema
>;
export type ProgressStatsRequest = z.infer<typeof progressStatsSchema>;

export type CreateUserAchievementRequest = z.infer<
  typeof createUserAchievementSchema
>;
export type UserAchievementFilters = z.infer<
  typeof userAchievementFiltersSchema
>;

export type WorkoutGenerationRequest = z.infer<
  typeof workoutGenerationRequestSchema
>;
export type WorkoutGenerationJobFilters = z.infer<
  typeof workoutGenerationJobFiltersSchema
>;
export type ExerciseRecommendationRequest = z.infer<
  typeof exerciseRecommendationRequestSchema
>;

// AI Recommendations schemas
export const recommendationContextSchema = z.object({
  currentExerciseId: z.string().uuid().optional(),
  perceivedExertion: z.number().min(1).max(10).optional(),
  formRating: z.number().min(1).max(5).optional(),
  availableEquipment: z.array(z.string()).optional(),
  timeConstraint: z.number().min(1).optional(), // minutes remaining
  energyLevel: z.number().min(1).max(10).optional(),
  previousInjuries: z.array(z.string()).optional(),
  preferences: z.object({
    focusAreas: z.array(z.string()).optional(),
    avoidedMovements: z.array(z.string()).optional(),
    intensityPreference: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),
});

export const recommendationRequestSchema = z.object({
  type: z.enum([
    'exercise_substitute',
    'rest_time',
    'intensity_adjustment',
    'form_improvement',
    'progression',
    'recovery'
  ]),
  context: recommendationContextSchema,
  userFeedback: z.string().max(500).optional(),
});

export const recommendationResponseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  priority: z.enum(['high', 'medium', 'low']),
  actionable: z.boolean(),
  action: z.record(z.any()).optional(),
  reason: z.string().max(500).optional(),
});

// Session Analytics schemas
export const sessionAnalyticsQuerySchema = z.object({
  includePerformanceMetrics: z.boolean().default(true),
  includeProgressComparison: z.boolean().default(true),
  includeMuscleGroupAnalysis: z.boolean().default(false),
  includeCalorieEstimation: z.boolean().default(true),
  timeframe: z.enum(['session', 'week', 'month']).default('session'),
});

export const sessionPerformanceMetricsSchema = z.object({
  strengthGain: z.number().min(0).max(100).optional(),
  enduranceImprovement: z.number().min(0).max(100).optional(),
  consistency: z.number().min(0).max(100).optional(),
  intensityScore: z.number().min(0).max(100).optional(),
});

export const sessionAnalyticsResponseSchema = z.object({
  sessionId: z.string().uuid(),
  completionStats: z.object({
    exercisesCompleted: z.number().int().min(0),
    totalExercises: z.number().int().min(0),
    completionPercentage: z.number().min(0).max(100),
  }),
  performanceMetrics: sessionPerformanceMetricsSchema.optional(),
  effortAnalysis: z.object({
    averagePerceivedExertion: z.number().min(1).max(10).optional(),
    averageFormRating: z.number().min(1).max(5).optional(),
    effortDistribution: z.record(z.number()).optional(),
  }),
  timeAnalysis: z.object({
    totalDuration: z.number().int().min(0), // seconds
    actualRestTime: z.number().int().min(0).optional(),
    exerciseTime: z.number().int().min(0).optional(),
    efficiencyScore: z.number().min(0).max(100).optional(),
  }),
  calorieEstimation: z.object({
    estimated: z.number().min(0),
    method: z.string().max(100),
    factors: z.array(z.string()).optional(),
  }).optional(),
  progressComparison: z.object({
    previousSessionId: z.string().uuid().optional(),
    improvements: z.array(z.string()).optional(),
    regressions: z.array(z.string()).optional(),
    overallTrend: z.enum(['improving', 'stable', 'declining']).optional(),
  }).optional(),
});

// Dashboard Stats schemas
export const dashboardStatsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  includeGoalProgress: z.boolean().default(true),
  includeStreakInfo: z.boolean().default(true),
  includeRecentActivity: z.boolean().default(false),
});

export const dashboardStatsResponseSchema = z.object({
  workoutsThisWeek: z.number().int().min(0),
  totalCompletedWorkouts: z.number().int().min(0),
  activeWorkoutPlans: z.number().int().min(0),
  totalWorkoutHours: z.number().min(0),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0).optional(),
  goalProgress: z.object({
    weeklyGoal: z.number().int().min(0).optional(),
    monthlyGoal: z.number().int().min(0).optional(),
    weeklyProgress: z.number().min(0).max(100).optional(),
    monthlyProgress: z.number().min(0).max(100).optional(),
  }).optional(),
  recentAchievements: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    achievedAt: z.string().datetime(),
    category: z.string(),
  })).optional(),
});

// Progress Stats schemas
export const progressStatsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  measurementTypes: z.array(measurementTypeSchema).optional(),
  includeGoalTracking: z.boolean().default(false),
  includeProjections: z.boolean().default(false),
});

export const progressStatsResponseSchema = z.object({
  measurementSummary: z.record(z.object({
    current: z.number().optional(),
    previous: z.number().optional(),
    change: z.number().optional(),
    changePercentage: z.number().optional(),
    trend: z.enum(['up', 'down', 'stable']).optional(),
    unit: z.string(),
  })),
  goalTracking: z.object({
    activeGoals: z.number().int().min(0),
    goalsAchieved: z.number().int().min(0),
    goalsInProgress: z.number().int().min(0),
    averageProgress: z.number().min(0).max(100),
  }).optional(),
  trends: z.object({
    weightTrend: z.enum(['gaining', 'losing', 'maintaining']).optional(),
    bodyCompositionTrend: z.enum(['improving', 'stable', 'declining']).optional(),
    performanceTrend: z.enum(['improving', 'stable', 'declining']).optional(),
  }).optional(),
  projections: z.object({
    nextMilestone: z.object({
      type: z.string(),
      value: z.number(),
      estimatedDate: z.string().datetime(),
      confidence: z.number().min(0).max(100),
    }).optional(),
  }).optional(),
});

// Recent Activity schemas
export const recentActivityQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  includeWorkouts: z.boolean().default(true),
  includeMeasurements: z.boolean().default(true),
  includeAchievements: z.boolean().default(true),
  dateFrom: z.string().datetime().optional(),
});

export const activityItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['workout', 'measurement', 'achievement', 'goal']),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export const recentActivityResponseSchema = z.object({
  activities: z.array(activityItemSchema),
  totalCount: z.number().int().min(0),
  hasMore: z.boolean(),
});

// Workout Stats schemas  
export const workoutStatsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
  includeExerciseBreakdown: z.boolean().default(false),
  includeMuscleGroupAnalysis: z.boolean().default(false),
});

export const workoutStatsResponseSchema = z.object({
  totalWorkouts: z.number().int().min(0),
  totalDuration: z.number().int().min(0), // minutes
  averageDuration: z.number().min(0),
  completionRate: z.number().min(0).max(100),
  frequencyData: z.array(z.object({
    period: z.string(),
    count: z.number().int().min(0),
    duration: z.number().min(0),
  })),
  exerciseBreakdown: z.object({
    mostPerformed: z.array(z.object({
      exerciseName: z.string(),
      count: z.number().int().min(0),
      totalVolume: z.number().min(0).optional(),
    })),
    muscleGroupDistribution: z.record(z.number().min(0)),
    equipmentUsage: z.record(z.number().int().min(0)),
  }).optional(),
  performanceMetrics: z.object({
    averageIntensity: z.number().min(0).max(10),
    progressionRate: z.number().min(-100).max(100),
    consistencyScore: z.number().min(0).max(100),
  }).optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Export new schema types
export type RecommendationContext = z.infer<typeof recommendationContextSchema>;
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;

export type SessionAnalyticsQuery = z.infer<typeof sessionAnalyticsQuerySchema>;
export type SessionPerformanceMetrics = z.infer<typeof sessionPerformanceMetricsSchema>;
export type SessionAnalyticsResponse = z.infer<typeof sessionAnalyticsResponseSchema>;

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;
export type DashboardStatsResponse = z.infer<typeof dashboardStatsResponseSchema>;

export type ProgressStatsQuery = z.infer<typeof progressStatsQuerySchema>;
export type ProgressStatsResponse = z.infer<typeof progressStatsResponseSchema>;

export type RecentActivityQuery = z.infer<typeof recentActivityQuerySchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
export type RecentActivityResponse = z.infer<typeof recentActivityResponseSchema>;

export type WorkoutStatsQuery = z.infer<typeof workoutStatsQuerySchema>;
export type WorkoutStatsResponse = z.infer<typeof workoutStatsResponseSchema>;
