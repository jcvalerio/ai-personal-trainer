/**
 * Workout System Type Definitions
 * Comprehensive TypeScript types for the workout management system
 */

import { FitnessLevel, SubscriptionTier } from './index'

// Base Types
export type WorkoutStatus = 'draft' | 'active' | 'completed' | 'paused' | 'archived'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled'
export type SessionType = 'workout' | 'assessment' | 'recovery'
export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'sports'
export type ExercisePhase = 'warm_up' | 'main' | 'cool_down'
export type SessionExerciseStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type MeasurementType = 'weight' | 'body_fat' | 'muscle_mass' | 'circumference'
export type AchievementType = 'streak' | 'milestone' | 'pr' | 'consistency'
export type DayScheduleType = 'workout' | 'rest' | 'active_recovery'
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'

// Equipment Types
export interface Equipment {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  subcategory?: string
  manufacturer?: string
  model?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    weight?: number
    unit?: string
  }
  maxUsersSimultaneously: number
  maintenanceIntervalDays: number
  safetyRequirements: string[]
  imageUrl?: string
  instructionManualUrl?: string
  demoVideoUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateEquipmentRequest {
  name: string
  description?: string
  category: string
  subcategory?: string
  manufacturer?: string
  model?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    weight?: number
    unit?: string
  }
  maxUsersSimultaneously?: number
  maintenanceIntervalDays?: number
  safetyRequirements?: string[]
  imageUrl?: string
  instructionManualUrl?: string
  demoVideoUrl?: string
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  [key: string]: any // Allow dynamic property access for sanitization
}

export interface EquipmentFilters {
  category?: string
  subcategory?: string
  manufacturer?: string
  search?: string
}

// Exercise Types
export interface Exercise {
  id: string
  name: string
  slug: string
  description: string
  instructions: string
  exerciseType: ExerciseType
  primaryMuscleGroups: string[]
  secondaryMuscleGroups: string[]
  difficultyLevel: FitnessLevel
  equipmentRequired: string[] // Equipment IDs
  equipmentOptional: string[]
  equipmentAlternatives: Record<string, string[]>
  defaultSets?: number
  defaultRepsMin?: number
  defaultRepsMax?: number
  defaultWeightPercentage?: number
  defaultRestSeconds?: number
  defaultDurationSeconds?: number
  demoVideoUrl?: string
  demoImageUrl?: string
  instructionImages: string[]
  contraindications: string[]
  modifications: Record<string, any>
  safetyTips: string[]
  createdBy?: string
  organizationId?: string
  isVerified: boolean
  isPublic: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateExerciseRequest {
  name: string
  description: string
  instructions: string
  exerciseType: ExerciseType
  primaryMuscleGroups: string[]
  secondaryMuscleGroups?: string[]
  difficultyLevel?: FitnessLevel
  equipmentRequired?: string[]
  equipmentOptional?: string[]
  equipmentAlternatives?: Record<string, string[]>
  defaultSets?: number
  defaultRepsMin?: number
  defaultRepsMax?: number
  defaultWeightPercentage?: number
  defaultRestSeconds?: number
  defaultDurationSeconds?: number
  demoVideoUrl?: string
  demoImageUrl?: string
  instructionImages?: string[]
  contraindications?: string[]
  modifications?: Record<string, any>
  safetyTips?: string[]
  isPublic?: boolean
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {
  [key: string]: any // Allow dynamic property access for sanitization
}

export interface ExerciseFilters {
  exerciseType?: ExerciseType
  difficultyLevel?: FitnessLevel
  muscleGroup?: string
  equipmentRequired?: string[]
  search?: string
  isVerified?: boolean
}

// Workout Plan Types
export interface WorkoutPlanData {
  summary: string
  phases: WorkoutPhase[]
  progressionStrategy: string
  notes?: string
}

export interface WorkoutPhase {
  name: string
  description: string
  durationWeeks: number
  sessions: any[] // Session references
}

export interface WeeklySchedule {
  [week: string]: DaySchedule[]
}

export interface DaySchedule {
  day: string
  sessionId?: string
  sessionName: string
  type: DayScheduleType
  duration: number
}

export interface WorkoutPlan {
  id: string
  userId: string
  organizationId?: string
  name: string
  description?: string
  durationWeeks: number
  sessionsPerWeek: number
  fitnessGoals: string[]
  targetFitnessLevel: FitnessLevel
  estimatedSessionDuration?: number
  aiPromptUsed?: string
  aiModelVersion?: string
  aiGenerationId?: string
  generationParameters?: Record<string, any>
  planData: WorkoutPlanData
  weeklySchedule: WeeklySchedule
  progressionRules?: Record<string, any>
  status: WorkoutStatus
  startedAt?: Date
  completedAt?: Date
  version: number
  parentPlanId?: string
  isTemplate: boolean
  templateCategory?: string
  isPublic: boolean
  isFeatured: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkoutPlanRequest {
  name: string
  description?: string
  durationWeeks: number
  sessionsPerWeek: number
  fitnessGoals: string[]
  targetFitnessLevel?: FitnessLevel
  estimatedSessionDuration?: number
  planData?: WorkoutPlanData
  weeklySchedule?: WeeklySchedule
  progressionRules?: Record<string, any>
  aiPromptUsed?: string
  aiModelVersion?: string
  aiGenerationId?: string
  generationParameters?: Record<string, any>
  isTemplate?: boolean
  templateCategory?: string
  isPublic?: boolean
}

export interface UpdateWorkoutPlanRequest extends Partial<CreateWorkoutPlanRequest> {
  status?: WorkoutStatus
  [key: string]: any // Allow dynamic property access for sanitization
}

export interface WorkoutPlanFilters {
  status?: WorkoutStatus
  isTemplate?: boolean
  targetFitnessLevel?: FitnessLevel
  search?: string
}

// Workout Session Types
export interface SessionData {
  totalExercises: number
  estimatedDuration: number
  targetMuscleGroups: string[]
  equipmentNeeded: string[]
  difficultyLevel: FitnessLevel
}

export interface SessionExercise {
  id: string
  sessionId: string
  exerciseId: string
  orderIndex: number
  supersetGroup?: number
  exercisePhase: ExercisePhase
  plannedSets?: number
  plannedReps?: number
  plannedWeightKg?: number
  plannedDurationSeconds?: number
  plannedDistanceMeters?: number
  plannedRestSeconds?: number
  actualSets?: number
  actualReps?: number
  actualWeightKg?: number
  actualDurationSeconds?: number
  actualDistanceMeters?: number
  actualRestSeconds?: number
  setData?: SetPerformanceData[]
  equipmentUsed?: string
  equipmentAlternatives: string[]
  exerciseModifications?: string[]
  perceivedExertion?: number
  formRating?: number
  difficultyRating?: number
  status: SessionExerciseStatus
  completedAt?: Date
  notes?: string
  /** Timer protocol for this exercise */
  timerProtocol?: 'tabata' | 'emom' | 'amrap' | 'strength' | 'custom'
  /** Timer configuration JSON */
  timerConfig?: Record<string, any>
  /** Real-time execution data */
  executionData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface SetPerformanceData {
  setNumber: number
  reps: number
  weight?: number
  duration?: number
  distance?: number
  restSeconds?: number
  perceivedExertion?: number
  formRating?: number
  /** Tempo/speed for the set */
  tempo?: string
  /** Range of motion quality (1-5) */
  rangeOfMotion?: number
  /** Set completion timestamp */
  timestamp?: Date
  /** Additional set-specific notes */
  setNotes?: string
}

export interface WorkoutSession {
  id: string
  userId: string
  organizationId?: string
  workoutPlanId?: string
  name: string
  sessionType: SessionType
  scheduledDate: Date
  scheduledTime?: string
  scheduledDuration?: number
  startedAt?: Date
  completedAt?: Date
  actualDuration?: number
  sessionData: SessionData
  warmUpExercises: any[]
  mainExercises: any[]
  coolDownExercises: any[]
  completionPercentage: number
  effortRating?: number
  energyLevelBefore?: number
  energyLevelAfter?: number
  status: SessionStatus
  equipmentUsed: string[]
  gymLocation?: string
  userNotes?: string
  aiFeedback?: string
  trainerNotes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkoutSessionRequest {
  name: string
  workoutPlanId?: string
  sessionType?: SessionType
  scheduledDate: Date | string
  scheduledTime?: string
  scheduledDuration?: number
  sessionData?: SessionData
  warmUpExercises?: any[]
  mainExercises?: any[]
  coolDownExercises?: any[]
}

export interface UpdateWorkoutSessionRequest extends Partial<CreateWorkoutSessionRequest> {
  status?: SessionStatus
  completionPercentage?: number
  effortRating?: number
  energyLevelBefore?: number
  energyLevelAfter?: number
  equipmentUsed?: string[]
  gymLocation?: string
  userNotes?: string
  trainerNotes?: string
}

export interface WorkoutSessionFilters {
  status?: SessionStatus
  workoutPlanId?: string
  sessionType?: SessionType
  dateFrom?: Date | string
  dateTo?: Date | string
}

export interface CompleteSessionRequest {
  effortRating?: number
  energyLevelAfter?: number
  userNotes?: string
}

export interface UpdateSessionExerciseRequest {
  actualSets?: number
  actualReps?: number
  actualWeightKg?: number
  actualDurationSeconds?: number
  actualDistanceMeters?: number
  actualRestSeconds?: number
  setData?: SetPerformanceData[]
  equipmentUsed?: string
  equipmentAlternatives?: string[]
  exerciseModifications?: string[]
  perceivedExertion?: number
  formRating?: number
  difficultyRating?: number
  notes?: string
}

// Progress Measurement Types
export interface ProgressMeasurement {
  id: string
  userId: string
  organizationId?: string
  measurementType: MeasurementType
  measurementLocation?: string
  value: number
  unit: string
  measuredAt: Date
  measurementMethod?: string
  measurementDevice?: string
  bodyComposition?: Record<string, number>
  notes?: string
  photoUrl?: string
  isVerified: boolean
  verifiedBy?: string
  confidenceScore?: number
  createdAt: Date
}

export interface CreateProgressMeasurementRequest {
  measurementType: MeasurementType
  measurementLocation?: string
  value: number
  unit: string
  measuredAt?: Date | string
  measurementMethod?: string
  measurementDevice?: string
  bodyComposition?: Record<string, number>
  notes?: string
  photoUrl?: string
}

export interface UpdateProgressMeasurementRequest extends Partial<CreateProgressMeasurementRequest> {}

export interface ProgressMeasurementFilters {
  measurementType?: MeasurementType
  measurementLocation?: string
  dateFrom?: Date | string
  dateTo?: Date | string
}

export interface ProgressStats {
  timeframe: 'week' | 'month' | 'quarter' | 'year'
  startDate: Date
  endDate: Date
  measurementSummary: MeasurementSummary[]
  overallTrend: 'improving' | 'declining' | 'stable'
}

export interface MeasurementSummary {
  measurementType: MeasurementType
  unit: string
  count: number
  average: number
  min: number
  max: number
  median: number
  firstMeasurement: Date
  lastMeasurement: Date
  trend: 'improving' | 'declining' | 'stable'
}

// User Achievement Types
export interface UserAchievement {
  id: string
  userId: string
  organizationId?: string
  achievementType: AchievementType
  achievementName: string
  description: string
  value?: number
  unit?: string
  category?: string
  achievedAt: Date
  previousBest?: number
  improvementPercentage?: number
  relatedSessionId?: string
  relatedExerciseId?: string
  badgeIcon?: string
  badgeColor?: string
  isMilestone: boolean
  milestoneLevel?: number
  pointsAwarded: number
  isPublic: boolean
  sharedAt?: Date
  createdAt: Date
}

export interface CreateUserAchievementRequest {
  achievementType: AchievementType
  achievementName: string
  description: string
  value?: number
  unit?: string
  category?: string
  achievedAt?: Date | string
  previousBest?: number
  improvementPercentage?: number
  relatedSessionId?: string
  relatedExerciseId?: string
  badgeIcon?: string
  badgeColor?: string
  isMilestone?: boolean
  milestoneLevel?: number
  pointsAwarded?: number
  isPublic?: boolean
}

export interface UserAchievementFilters {
  achievementType?: AchievementType
  category?: string
  isMilestone?: boolean
  dateFrom?: Date | string
  dateTo?: Date | string
}

// AI Workout Generation Types
export interface WorkoutGenerationJob {
  id: string
  userId: string
  organizationId?: string
  jobType: 'workout_plan' | 'single_session' | 'exercise_recommendation'
  status: GenerationStatus
  generationPrompt: string
  userPreferences: UserPreferences
  fitnessProfile: FitnessProfile
  equipmentAvailable: string[]
  timeConstraints?: TimeConstraints
  aiProvider: string
  aiModel: string
  modelVersion?: string
  generationParameters: Record<string, any>
  resultData?: any
  generatedPlanId?: string
  generatedSessionId?: string
  startedAt?: Date
  completedAt?: Date
  processingDurationMs?: number
  errorMessage?: string
  retryCount: number
  maxRetries: number
  tokensUsed: number
  costCents: number
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  fitnessLevel: FitnessLevel
  fitnessGoals: string[]
  preferredExerciseTypes?: ExerciseType[]
  avoidExercises?: string[]
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
}

export interface FitnessProfile {
  currentLevel: FitnessLevel
  injuries: string[]
  limitations: string[]
  experience: string[]
  preferences: Record<string, any>
}

export interface TimeConstraints {
  maxSessionDuration: number
  preferredTimeSlots: string[]
  daysPerWeek: number
}

export interface WorkoutGenerationRequest {
  jobType: 'workout_plan' | 'single_session' | 'exercise_recommendation'
  generationPrompt: string
  userPreferences: UserPreferences
  fitnessProfile: FitnessProfile
  equipmentAvailable?: string[]
  timeConstraints?: TimeConstraints
  generationParameters?: Record<string, any>
}

export interface WorkoutGenerationJobFilters {
  jobType?: 'workout_plan' | 'single_session' | 'exercise_recommendation'
  status?: GenerationStatus
  dateFrom?: Date | string
  dateTo?: Date | string
}

export interface ExerciseRecommendationRequest {
  targetMuscleGroups: string[]
  excludeMuscleGroups?: string[]
  exerciseTypes?: ExerciseType[]
  difficultyLevel?: FitnessLevel
  equipmentAvailable?: string[]
  sessionDuration: number
  fitnessGoals?: string[]
  limitations?: string[]
  count?: number
}

// API Response Types
export interface WorkoutApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  timestamp: string
  meta?: Record<string, any>
}

export interface PaginatedWorkoutResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
  meta?: Record<string, any>
}

// Service Types
export interface WorkoutServiceContext {
  userId: string
  organizationId?: string
  userRole?: string
}

export interface WorkoutServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  details?: Record<string, any>
}

// Utility Types
export interface WorkoutAnalytics {
  totalWorkouts: number
  totalWorkoutMinutes: number
  averageSessionDuration: number
  completionRate: number
  consistencyScore: number
  strengthProgress: number
  cardioProgress: number
  flexibilityProgress: number
  favoriteExercises: string[]
  challengingExercises: string[]
  weeklyTrends: WeeklyTrend[]
  monthlyStats: MonthlyStats
}

export interface WeeklyTrend {
  week: string
  workouts: number
  duration: number
  averageEffort: number
}

export interface MonthlyStats {
  month: string
  totalSessions: number
  completedSessions: number
  totalDuration: number
  averageEffortRating: number
  improvementAreas: string[]
}

export interface WorkoutRecommendation {
  type: 'exercise' | 'plan' | 'modification'
  title: string
  description: string
  reasoning: string
  confidence: number
  difficulty: FitnessLevel
  estimatedBenefit: number
  implementationSteps: string[]
}

// Custom Plan Creation Types
export interface CustomPlanFormData {
  // Basic Info
  name: string
  description: string
  durationWeeks: number
  sessionsPerWeek: number
  fitnessGoals: string[]
  targetFitnessLevel: FitnessLevel
  estimatedSessionDuration: number

  // Weekly Schedule
  weeklySchedule: WeeklySchedule

  // Session Templates
  sessionTemplates: SessionTemplate[]
  
  // Additional Settings
  isTemplate: boolean
  isPublic: boolean
}

export interface SessionTemplate {
  id: string
  name: string
  description: string
  sessionType: SessionType
  estimatedDuration: number
  targetMuscleGroups: string[]
  exerciseStructure: ExerciseStructure[]
  difficulty: FitnessLevel
  equipmentRequired: string[]
  notes?: string
}

export interface ExerciseStructure {
  id: string
  exerciseId?: string
  exerciseName: string
  exerciseType: ExerciseType
  phase: ExercisePhase
  sets: number
  repsMin: number
  repsMax: number
  weightPercentage?: number
  restSeconds: number
  durationSeconds?: number
  notes?: string
  alternatives: string[]
}

export interface WeekScheduleData {
  [day: string]: DayScheduleData
}

export interface DayScheduleData {
  type: DayScheduleType
  sessionTemplateId?: string
  sessionName?: string
  duration?: number
  notes?: string
}

// Export utility type helpers
export type WorkoutPlanInput = Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>
export type WorkoutSessionInput = Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
export type ExerciseInput = Omit<Exercise, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
export type EquipmentInput = Omit<Equipment, 'id' | 'slug' | 'createdAt' | 'updatedAt'>

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Keys>>
}[Keys]