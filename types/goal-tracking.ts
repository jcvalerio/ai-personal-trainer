/**
 * Goal Tracking and Achievement System Type Definitions
 * Phase 3: Comprehensive goal tracking, achievement system, real-time progress monitoring,
 * and intelligent goal suggestions for the AI Personal Trainer application
 */

import { FitnessLevel } from './index'
import { 
  MeasurementType, 
  AchievementType,
  ExerciseType,
  WorkoutPlan,
  UserAchievement
} from './workouts'
import { AnalyticsPeriod, TrendDirection } from './progress-analytics'

// ================================
// Core Goal Types
// ================================

/**
 * Goal Categories
 */
export type GoalCategory = 
  | 'fitness'           // Overall fitness improvement
  | 'strength'          // Strength-based goals
  | 'endurance'         // Cardiovascular/endurance goals
  | 'weight_management' // Weight loss/gain goals
  | 'body_composition'  // Body composition changes
  | 'performance'       // Athletic performance goals
  | 'habit_formation'   // Consistency and habit goals
  | 'health_metrics'    // Health-related metrics
  | 'skill_development' // Skill-based goals
  | 'lifestyle'         // Lifestyle and wellness goals
  | 'competition'       // Competition-related goals
  | 'rehabilitation'    // Recovery and rehabilitation goals

/**
 * Goal Types
 */
export type GoalType = 
  | 'target'           // Reach a specific target value
  | 'increase'         // Increase by a certain amount
  | 'decrease'         // Decrease by a certain amount
  | 'maintain'         // Maintain current level
  | 'streak'           // Maintain a streak
  | 'frequency'        // Achieve frequency target
  | 'duration'         // Complete for a duration
  | 'milestone'        // Reach specific milestones
  | 'range'            // Stay within a range
  | 'progression'      // Follow a progression path

/**
 * Goal Status
 */
export type GoalStatus = 
  | 'draft'            // Goal being created
  | 'active'           // Currently pursuing
  | 'paused'           // Temporarily paused
  | 'completed'        // Successfully achieved
  | 'failed'           // Not achieved within timeframe
  | 'cancelled'        // User cancelled
  | 'expired'          // Expired without completion
  | 'archived'         // Archived for reference

/**
 * Goal Priority
 */
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Goal Difficulty
 */
export type GoalDifficulty = 'easy' | 'moderate' | 'challenging' | 'extreme'

/**
 * Progress Status
 */
export type ProgressStatus = 
  | 'not_started'      // No progress yet
  | 'on_track'         // Progressing as expected
  | 'ahead'            // Ahead of schedule
  | 'behind'           // Behind schedule
  | 'at_risk'          // Risk of not achieving
  | 'stalled'          // No progress recently
  | 'accelerating'     // Progress is accelerating
  | 'decelerating'     // Progress is slowing

// ================================
// Goal Definition Types
// ================================

/**
 * Fitness Goal
 */
export interface FitnessGoal {
  /** Goal ID */
  id: string
  /** User ID */
  userId: string
  /** Organization ID */
  organizationId?: string
  /** Goal name */
  name: string
  /** Goal description */
  description: string
  /** Goal category */
  category: GoalCategory
  /** Goal type */
  type: GoalType
  /** Goal priority */
  priority: GoalPriority
  /** Goal difficulty */
  difficulty: GoalDifficulty
  /** Goal status */
  status: GoalStatus
  /** Goal configuration */
  config: GoalConfiguration
  /** Target specification */
  target: GoalTarget
  /** Progress tracking */
  progress: GoalProgress
  /** Timeline information */
  timeline: GoalTimeline
  /** Motivation and context */
  motivation: GoalMotivation
  /** Related entities */
  relationships: GoalRelationships
  /** Goal metadata */
  metadata: GoalMetadata
}

/**
 * Goal Configuration
 */
export interface GoalConfiguration {
  /** Metric being tracked */
  metric: GoalMetric
  /** Measurement unit */
  unit: string
  /** Tracking frequency */
  trackingFrequency: TrackingFrequency
  /** Auto-tracking enabled */
  autoTracking: boolean
  /** Validation rules */
  validation: ValidationRule[]
  /** Reminder settings */
  reminders: ReminderSettings
  /** Privacy settings */
  privacy: GoalPrivacySettings
}

/**
 * Goal Metric
 */
export interface GoalMetric {
  /** Metric type */
  type: MetricType
  /** Metric name */
  name: string
  /** Metric source */
  source: MetricSource
  /** Metric calculation */
  calculation?: MetricCalculation
  /** Baseline value */
  baseline?: number
  /** Metric constraints */
  constraints: MetricConstraints
}

/**
 * Metric Types
 */
export type MetricType = 
  | 'body_weight'
  | 'body_fat_percentage'
  | 'muscle_mass'
  | 'max_reps'
  | 'max_weight'
  | 'total_volume'
  | 'workout_frequency'
  | 'workout_duration'
  | 'calories_burned'
  | 'distance_covered'
  | 'time_duration'
  | 'heart_rate'
  | 'blood_pressure'
  | 'flexibility_score'
  | 'balance_score'
  | 'endurance_time'
  | 'recovery_time'
  | 'sleep_quality'
  | 'stress_level'
  | 'custom_metric'

/**
 * Metric Source
 */
export interface MetricSource {
  /** Source type */
  type: MetricSourceType
  /** Source identifier */
  sourceId: string
  /** Source configuration */
  config: SourceConfiguration
  /** Data quality settings */
  quality: DataQualitySettings
}

/**
 * Metric Source Types
 */
export type MetricSourceType = 
  | 'manual_entry'       // User manual input
  | 'workout_session'    // From workout sessions
  | 'body_measurement'   // From body measurements
  | 'wearable_device'    // From connected devices
  | 'smart_scale'        // From smart scales
  | 'fitness_app'        // From other fitness apps
  | 'calculated'         // Calculated from other metrics
  | 'imported'           // Imported from external sources

/**
 * Source Configuration
 */
export interface SourceConfiguration {
  /** Configuration parameters */
  parameters: Record<string, any>
  /** Update frequency */
  updateFrequency: 'real_time' | 'daily' | 'weekly' | 'manual'
  /** Synchronization settings */
  sync: SyncSettings
  /** Fallback sources */
  fallbacks: string[]
}

/**
 * Sync Settings
 */
export interface SyncSettings {
  /** Auto-sync enabled */
  enabled: boolean
  /** Sync interval (minutes) */
  interval: number
  /** Last sync timestamp */
  lastSync?: Date
  /** Sync conflicts handling */
  conflictResolution: 'latest_wins' | 'manual_review' | 'average'
}

/**
 * Data Quality Settings
 */
export interface DataQualitySettings {
  /** Outlier detection */
  outlierDetection: boolean
  /** Smoothing algorithm */
  smoothing?: SmoothingAlgorithm
  /** Validation thresholds */
  thresholds: QualityThreshold[]
  /** Missing data handling */
  missingDataHandling: 'ignore' | 'interpolate' | 'use_default'
}

/**
 * Smoothing Algorithm
 */
export interface SmoothingAlgorithm {
  /** Algorithm type */
  type: 'moving_average' | 'exponential' | 'gaussian' | 'median_filter'
  /** Algorithm parameters */
  parameters: Record<string, number>
  /** Window size */
  windowSize: number
}

/**
 * Quality Threshold
 */
export interface QualityThreshold {
  /** Threshold type */
  type: 'min' | 'max' | 'change_rate' | 'variance'
  /** Threshold value */
  value: number
  /** Action on breach */
  action: 'flag' | 'reject' | 'manual_review'
}

/**
 * Metric Calculation
 */
export interface MetricCalculation {
  /** Calculation formula */
  formula: string
  /** Input metrics */
  inputs: string[]
  /** Calculation frequency */
  frequency: 'on_demand' | 'daily' | 'weekly' | 'monthly'
  /** Calculation dependencies */
  dependencies: string[]
}

/**
 * Metric Constraints
 */
export interface MetricConstraints {
  /** Minimum valid value */
  minValue?: number
  /** Maximum valid value */
  maxValue?: number
  /** Valid value range */
  validRange?: { min: number; max: number }
  /** Decimal places */
  decimalPlaces: number
  /** Required precision */
  precision?: number
}

/**
 * Tracking Frequency
 */
export interface TrackingFrequency {
  /** Frequency type */
  type: 'daily' | 'weekly' | 'monthly' | 'per_workout' | 'custom'
  /** Frequency value */
  value?: number
  /** Frequency unit */
  unit?: 'days' | 'weeks' | 'months' | 'workouts'
  /** Preferred times */
  preferredTimes?: string[]
  /** Flexible scheduling */
  flexible: boolean
}

/**
 * Validation Rule
 */
export interface ValidationRule {
  /** Rule ID */
  id: string
  /** Rule type */
  type: ValidationType
  /** Rule parameters */
  parameters: any
  /** Rule message */
  message: string
  /** Rule severity */
  severity: 'error' | 'warning' | 'info'
}

/**
 * Validation Types
 */
export type ValidationType = 
  | 'range_check'
  | 'trend_validation'
  | 'consistency_check'
  | 'completeness_check'
  | 'correlation_check'
  | 'outlier_detection'
  | 'custom_validation'

/**
 * Reminder Settings
 */
export interface ReminderSettings {
  /** Reminders enabled */
  enabled: boolean
  /** Reminder types */
  types: ReminderType[]
  /** Reminder frequency */
  frequency: ReminderFrequency
  /** Reminder timing */
  timing: ReminderTiming
  /** Reminder methods */
  methods: ReminderMethod[]
  /** Reminder content */
  content: ReminderContent
}

/**
 * Reminder Types
 */
export type ReminderType = 
  | 'progress_update'    // Regular progress updates
  | 'milestone_check'    // Milestone checkpoints
  | 'motivation_boost'   // Motivational reminders
  | 'course_correction'  // When off track
  | 'achievement_ready'  // When close to achievement
  | 'deadline_approach'  // Approaching deadline

/**
 * Reminder Frequency
 */
export interface ReminderFrequency {
  /** Base frequency */
  base: 'daily' | 'weekly' | 'monthly' | 'custom'
  /** Adaptive frequency */
  adaptive: boolean
  /** Frequency modifiers */
  modifiers: FrequencyModifier[]
}

/**
 * Frequency Modifier
 */
export interface FrequencyModifier {
  /** Condition */
  condition: 'behind_schedule' | 'ahead_schedule' | 'stalled' | 'accelerating'
  /** Frequency multiplier */
  multiplier: number
  /** Duration of modifier */
  duration?: number
}

/**
 * Reminder Timing
 */
export interface ReminderTiming {
  /** Preferred times of day */
  preferredTimes: string[]
  /** Time zone */
  timezone: string
  /** Respect quiet hours */
  respectQuietHours: boolean
  /** Quiet hours */
  quietHours?: { start: string; end: string }
}

/**
 * Reminder Methods
 */
export type ReminderMethod = 'push' | 'email' | 'sms' | 'in_app' | 'calendar' | 'widget'

/**
 * Reminder Content
 */
export interface ReminderContent {
  /** Content personalization */
  personalized: boolean
  /** Message templates */
  templates: MessageTemplate[]
  /** Include progress data */
  includeProgress: boolean
  /** Include motivational quotes */
  includeQuotes: boolean
  /** Content language */
  language: string
}

/**
 * Message Template
 */
export interface MessageTemplate {
  /** Template type */
  type: ReminderType
  /** Template content */
  content: string
  /** Template variables */
  variables: string[]
  /** Template conditions */
  conditions?: TemplateCondition[]
}

/**
 * Template Condition
 */
export interface TemplateCondition {
  /** Condition field */
  field: string
  /** Condition operator */
  operator: 'equals' | 'greater_than' | 'less_than' | 'between'
  /** Condition value */
  value: any
}

/**
 * Goal Privacy Settings
 */
export interface GoalPrivacySettings {
  /** Goal visibility */
  visibility: 'private' | 'friends' | 'public' | 'organization'
  /** Share progress updates */
  shareProgress: boolean
  /** Share achievements */
  shareAchievements: boolean
  /** Allow encouragement */
  allowEncouragement: boolean
  /** Data sharing permissions */
  dataSharing: DataSharingPermissions
}

/**
 * Data Sharing Permissions
 */
export interface DataSharingPermissions {
  /** Share with trainers */
  trainers: boolean
  /** Share with healthcare providers */
  healthcare: boolean
  /** Share with researchers */
  research: boolean
  /** Share with family */
  family: boolean
  /** Share anonymized data */
  anonymized: boolean
}

/**
 * Goal Target
 */
export interface GoalTarget {
  /** Target type */
  type: GoalType
  /** Target value */
  value: TargetValue
  /** Target conditions */
  conditions: TargetCondition[]
  /** Target milestones */
  milestones: Milestone[]
  /** Success criteria */
  successCriteria: SuccessCriteria
}

/**
 * Target Value
 */
export type TargetValue = 
  | SingleTarget
  | RangeTarget
  | ProgressionTarget
  | FrequencyTarget
  | DurationTarget
  | StreakTarget

/**
 * Single Target
 */
export interface SingleTarget {
  /** Target type */
  type: 'single'
  /** Target value */
  value: number
  /** Target tolerance */
  tolerance?: number
  /** Target direction */
  direction?: 'increase' | 'decrease' | 'maintain'
}

/**
 * Range Target
 */
export interface RangeTarget {
  /** Target type */
  type: 'range'
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Preferred value within range */
  preferred?: number
}

/**
 * Progression Target
 */
export interface ProgressionTarget {
  /** Target type */
  type: 'progression'
  /** Starting value */
  start: number
  /** Ending value */
  end: number
  /** Progression steps */
  steps: ProgressionStep[]
  /** Progression rate */
  rate: ProgressionRate
}

/**
 * Progression Step
 */
export interface ProgressionStep {
  /** Step number */
  step: number
  /** Step target value */
  value: number
  /** Step date */
  date?: Date
  /** Step completed */
  completed: boolean
  /** Step notes */
  notes?: string
}

/**
 * Progression Rate
 */
export interface ProgressionRate {
  /** Rate type */
  type: 'linear' | 'exponential' | 'logarithmic' | 'custom'
  /** Rate parameters */
  parameters: Record<string, number>
  /** Rate adjustments */
  adjustments: RateAdjustment[]
}

/**
 * Rate Adjustment
 */
export interface RateAdjustment {
  /** Adjustment condition */
  condition: string
  /** Adjustment factor */
  factor: number
  /** Adjustment duration */
  duration?: number
}

/**
 * Frequency Target
 */
export interface FrequencyTarget {
  /** Target type */
  type: 'frequency'
  /** Target frequency */
  frequency: number
  /** Frequency period */
  period: 'daily' | 'weekly' | 'monthly'
  /** Minimum frequency */
  minFrequency?: number
  /** Allow makeup sessions */
  allowMakeup: boolean
}

/**
 * Duration Target
 */
export interface DurationTarget {
  /** Target type */
  type: 'duration'
  /** Total duration */
  totalDuration: number
  /** Duration unit */
  unit: 'days' | 'weeks' | 'months' | 'years'
  /** Continuous requirement */
  continuous: boolean
}

/**
 * Streak Target
 */
export interface StreakTarget {
  /** Target type */
  type: 'streak'
  /** Target streak length */
  length: number
  /** Streak unit */
  unit: 'days' | 'weeks' | 'workouts'
  /** Allow breaks */
  allowBreaks: boolean
  /** Maximum break length */
  maxBreakLength?: number
}

/**
 * Target Condition
 */
export interface TargetCondition {
  /** Condition ID */
  id: string
  /** Condition description */
  description: string
  /** Condition type */
  type: ConditionType
  /** Condition parameters */
  parameters: Record<string, any>
  /** Condition weight */
  weight: number
}

/**
 * Condition Types
 */
export type ConditionType = 
  | 'time_based'         // Must be achieved by certain time
  | 'context_based'      // Depends on other conditions
  | 'performance_based'  // Based on performance metrics
  | 'consistency_based'  // Based on consistency
  | 'seasonal'           // Seasonal conditions
  | 'health_based'       // Health status dependent

/**
 * Milestone
 */
export interface Milestone {
  /** Milestone ID */
  id: string
  /** Milestone name */
  name: string
  /** Milestone description */
  description: string
  /** Milestone value */
  value: number
  /** Milestone percentage */
  percentage: number
  /** Milestone date */
  targetDate?: Date
  /** Milestone achieved */
  achieved: boolean
  /** Achievement date */
  achievedDate?: Date
  /** Milestone reward */
  reward?: MilestoneReward
  /** Milestone celebration */
  celebration?: CelebrationSettings
}

/**
 * Milestone Reward
 */
export interface MilestoneReward {
  /** Reward type */
  type: 'badge' | 'points' | 'discount' | 'unlock_feature' | 'custom'
  /** Reward description */
  description: string
  /** Reward value */
  value?: string | number
  /** Reward expiration */
  expiresAt?: Date
}

/**
 * Celebration Settings
 */
export interface CelebrationSettings {
  /** Show celebration animation */
  animation: boolean
  /** Share achievement */
  share: boolean
  /** Send notifications */
  notify: boolean
  /** Custom message */
  customMessage?: string
}

/**
 * Success Criteria
 */
export interface SuccessCriteria {
  /** Primary criteria */
  primary: SuccessCriterion
  /** Secondary criteria */
  secondary: SuccessCriterion[]
  /** Criteria combination */
  combination: 'all' | 'any' | 'majority'
  /** Grace period */
  gracePeriod?: number
}

/**
 * Success Criterion
 */
export interface SuccessCriterion {
  /** Criterion ID */
  id: string
  /** Criterion description */
  description: string
  /** Criterion metric */
  metric: string
  /** Criterion threshold */
  threshold: number
  /** Criterion operator */
  operator: 'greater_than' | 'less_than' | 'equals' | 'between'
  /** Criterion weight */
  weight: number
}

// ================================
// Progress Tracking Types
// ================================

/**
 * Goal Progress
 */
export interface GoalProgress {
  /** Current progress */
  current: CurrentProgress
  /** Progress history */
  history: ProgressHistory[]
  /** Progress trends */
  trends: ProgressTrends
  /** Progress predictions */
  predictions: ProgressPredictions
  /** Progress insights */
  insights: ProgressInsight[]
}

/**
 * Current Progress
 */
export interface CurrentProgress {
  /** Current value */
  value: number
  /** Progress percentage */
  percentage: number
  /** Progress status */
  status: ProgressStatus
  /** Days remaining */
  daysRemaining: number
  /** Expected completion date */
  expectedCompletion: Date
  /** Last updated */
  lastUpdated: Date
  /** Velocity */
  velocity: ProgressVelocity
}

/**
 * Progress Velocity
 */
export interface ProgressVelocity {
  /** Current velocity */
  current: number
  /** Average velocity */
  average: number
  /** Velocity trend */
  trend: TrendDirection
  /** Velocity unit */
  unit: string
  /** Velocity period */
  period: AnalyticsPeriod
}

/**
 * Progress History
 */
export interface ProgressHistory {
  /** Record ID */
  id: string
  /** Record date */
  date: Date
  /** Record value */
  value: number
  /** Progress percentage at this point */
  percentage: number
  /** Data source */
  source: string
  /** Data quality */
  quality: number
  /** Notes */
  notes?: string
  /** Context */
  context?: ProgressContext
}

/**
 * Progress Context
 */
export interface ProgressContext {
  /** Associated workout */
  workoutId?: string
  /** Associated measurement */
  measurementId?: string
  /** Environmental factors */
  environment?: EnvironmentalFactors
  /** User state */
  userState?: UserStateFactors
}

/**
 * Environmental Factors
 */
export interface EnvironmentalFactors {
  /** Weather conditions */
  weather?: string
  /** Location */
  location?: string
  /** Equipment used */
  equipment?: string[]
  /** Time of day */
  timeOfDay?: string
}

/**
 * User State Factors
 */
export interface UserStateFactors {
  /** Energy level */
  energyLevel?: number
  /** Stress level */
  stressLevel?: number
  /** Sleep quality */
  sleepQuality?: number
  /** Nutrition state */
  nutritionState?: string
  /** Hydration level */
  hydrationLevel?: number
}

/**
 * Progress Trends
 */
export interface ProgressTrends {
  /** Short-term trend */
  shortTerm: TrendAnalysis
  /** Long-term trend */
  longTerm: TrendAnalysis
  /** Velocity trend */
  velocity: VelocityTrend
  /** Consistency trend */
  consistency: ConsistencyTrend
}

/**
 * Trend Analysis
 */
export interface TrendAnalysis {
  /** Trend direction */
  direction: TrendDirection
  /** Trend strength */
  strength: number
  /** Trend confidence */
  confidence: number
  /** Trend start date */
  startDate: Date
  /** Trend duration */
  duration: number
  /** Trend significance */
  significance: number
}

/**
 * Velocity Trend
 */
export interface VelocityTrend {
  /** Velocity direction */
  direction: 'accelerating' | 'decelerating' | 'constant'
  /** Velocity change rate */
  changeRate: number
  /** Velocity consistency */
  consistency: number
}

/**
 * Consistency Trend
 */
export interface ConsistencyTrend {
  /** Consistency score */
  score: number
  /** Consistency trend */
  trend: TrendDirection
  /** Miss frequency */
  missFrequency: number
  /** Longest streak */
  longestStreak: number
  /** Current streak */
  currentStreak: number
}

/**
 * Progress Predictions
 */
export interface ProgressPredictions {
  /** Completion prediction */
  completion: CompletionPrediction
  /** Milestone predictions */
  milestones: MilestonePrediction[]
  /** Risk assessment */
  risks: RiskAssessment[]
  /** Opportunity assessment */
  opportunities: OpportunityAssessment[]
}

/**
 * Completion Prediction
 */
export interface CompletionPrediction {
  /** Predicted completion date */
  predictedDate: Date
  /** Prediction confidence */
  confidence: number
  /** Completion probability */
  probability: number
  /** Prediction scenarios */
  scenarios: PredictionScenario[]
  /** Prediction method */
  method: string
}

/**
 * Prediction Scenario
 */
export interface PredictionScenario {
  /** Scenario name */
  name: string
  /** Scenario probability */
  probability: number
  /** Scenario completion date */
  completionDate: Date
  /** Scenario assumptions */
  assumptions: string[]
  /** Scenario actions */
  recommendedActions: string[]
}

/**
 * Milestone Prediction
 */
export interface MilestonePrediction {
  /** Milestone ID */
  milestoneId: string
  /** Predicted achievement date */
  predictedDate: Date
  /** Achievement probability */
  probability: number
  /** Prediction confidence */
  confidence: number
}

/**
 * Risk Assessment
 */
export interface RiskAssessment {
  /** Risk type */
  type: RiskType
  /** Risk level */
  level: 'low' | 'medium' | 'high' | 'critical'
  /** Risk probability */
  probability: number
  /** Risk impact */
  impact: number
  /** Risk description */
  description: string
  /** Mitigation strategies */
  mitigation: string[]
}

/**
 * Risk Types
 */
export type RiskType = 
  | 'timeline_risk'      // Risk of not meeting timeline
  | 'motivation_risk'    // Risk of losing motivation
  | 'consistency_risk'   // Risk of inconsistent progress
  | 'plateau_risk'       // Risk of hitting plateau
  | 'injury_risk'        // Risk of injury
  | 'burnout_risk'       // Risk of burnout
  | 'resource_risk'      // Risk of resource constraints

/**
 * Opportunity Assessment
 */
export interface OpportunityAssessment {
  /** Opportunity type */
  type: OpportunityType
  /** Opportunity impact */
  impact: 'low' | 'medium' | 'high'
  /** Opportunity feasibility */
  feasibility: number
  /** Opportunity description */
  description: string
  /** Implementation suggestions */
  implementation: string[]
}

/**
 * Opportunity Types
 */
export type OpportunityType = 
  | 'acceleration_opportunity'  // Opportunity to accelerate progress
  | 'efficiency_opportunity'    // Opportunity to improve efficiency
  | 'synergy_opportunity'       // Opportunity to leverage synergies
  | 'motivation_opportunity'    // Opportunity to boost motivation
  | 'skill_opportunity'         // Opportunity to develop skills
  | 'social_opportunity'        // Opportunity for social support

/**
 * Progress Insight
 */
export interface ProgressInsight {
  /** Insight ID */
  id: string
  /** Insight type */
  type: ProgressInsightType
  /** Insight title */
  title: string
  /** Insight description */
  description: string
  /** Insight importance */
  importance: 'low' | 'medium' | 'high' | 'critical'
  /** Insight confidence */
  confidence: number
  /** Supporting data */
  supportingData: any
  /** Recommended actions */
  actions: string[]
  /** Insight created date */
  createdAt: Date
}

/**
 * Progress Insight Types
 */
export type ProgressInsightType = 
  | 'pattern_detected'       // Pattern in progress detected
  | 'anomaly_detected'       // Unusual progress detected
  | 'milestone_approaching'  // Milestone is near
  | 'trend_change'          // Trend has changed
  | 'plateau_detected'       // Progress plateau detected
  | 'acceleration_detected'  // Progress acceleration detected
  | 'correlation_found'      // Correlation with other factors
  | 'optimization_suggested' // Optimization opportunity

// ================================
// Timeline and Scheduling
// ================================

/**
 * Goal Timeline
 */
export interface GoalTimeline {
  /** Start date */
  startDate: Date
  /** Target end date */
  targetEndDate: Date
  /** Actual end date */
  actualEndDate?: Date
  /** Timeline phases */
  phases: TimelinePhase[]
  /** Timeline flexibility */
  flexibility: TimelineFlexibility
  /** Timeline adjustments */
  adjustments: TimelineAdjustment[]
}

/**
 * Timeline Phase
 */
export interface TimelinePhase {
  /** Phase ID */
  id: string
  /** Phase name */
  name: string
  /** Phase description */
  description: string
  /** Phase start date */
  startDate: Date
  /** Phase end date */
  endDate: Date
  /** Phase objectives */
  objectives: string[]
  /** Phase milestones */
  milestones: string[]
  /** Phase completed */
  completed: boolean
  /** Phase progress */
  progress: number
}

/**
 * Timeline Flexibility
 */
export interface TimelineFlexibility {
  /** Allow date adjustments */
  allowAdjustments: boolean
  /** Maximum delay (days) */
  maxDelay: number
  /** Adjustment penalties */
  adjustmentPenalties: AdjustmentPenalty[]
  /** Auto-adjustment rules */
  autoAdjustment: AutoAdjustmentRule[]
}

/**
 * Adjustment Penalty
 */
export interface AdjustmentPenalty {
  /** Penalty type */
  type: 'deadline_extension' | 'target_reduction' | 'difficulty_increase'
  /** Penalty value */
  value: number
  /** Penalty description */
  description: string
}

/**
 * Auto Adjustment Rule
 */
export interface AutoAdjustmentRule {
  /** Rule condition */
  condition: string
  /** Adjustment type */
  adjustmentType: 'extend_deadline' | 'reduce_target' | 'increase_frequency'
  /** Adjustment amount */
  amount: number
  /** Rule active */
  active: boolean
}

/**
 * Timeline Adjustment
 */
export interface TimelineAdjustment {
  /** Adjustment ID */
  id: string
  /** Adjustment date */
  date: Date
  /** Adjustment type */
  type: 'extension' | 'acceleration' | 'target_change' | 'phase_modification'
  /** Adjustment reason */
  reason: string
  /** Previous timeline */
  previousTimeline: TimelineSnapshot
  /** New timeline */
  newTimeline: TimelineSnapshot
  /** Adjustment impact */
  impact: AdjustmentImpact
}

/**
 * Timeline Snapshot
 */
export interface TimelineSnapshot {
  /** Snapshot date */
  date: Date
  /** Timeline configuration */
  config: GoalTimeline
  /** Progress at snapshot */
  progress: number
}

/**
 * Adjustment Impact
 */
export interface AdjustmentImpact {
  /** Impact on completion date */
  completionDate: number // days change
  /** Impact on difficulty */
  difficulty: number // difficulty change
  /** Impact on success probability */
  successProbability: number // probability change
  /** Impact description */
  description: string
}

// ================================
// Motivation and Engagement
// ================================

/**
 * Goal Motivation
 */
export interface GoalMotivation {
  /** Motivation sources */
  sources: MotivationSource[]
  /** Motivation level */
  level: MotivationLevel
  /** Motivation tracking */
  tracking: MotivationTracking
  /** Motivational content */
  content: MotivationalContent
  /** Engagement strategies */
  engagement: EngagementStrategy[]
}

/**
 * Motivation Source
 */
export interface MotivationSource {
  /** Source type */
  type: MotivationSourceType
  /** Source description */
  description: string
  /** Source strength */
  strength: number
  /** Source active */
  active: boolean
  /** Source personalization */
  personalization: SourcePersonalization
}

/**
 * Motivation Source Types
 */
export type MotivationSourceType = 
  | 'health_improvement'   // Health benefits
  | 'appearance'          // Physical appearance
  | 'performance'         // Athletic performance
  | 'social'              // Social factors
  | 'challenge'           // Personal challenge
  | 'habit_formation'     // Building good habits
  | 'competition'         // Competitive motivation
  | 'role_model'          // Following role models
  | 'life_event'          // Life event motivation
  | 'intrinsic'           // Internal satisfaction

/**
 * Source Personalization
 */
export interface SourcePersonalization {
  /** Personal significance */
  significance: number
  /** Emotional connection */
  emotionalConnection: number
  /** Visual associations */
  visualAssociations: string[]
  /** Personal stories */
  personalStories: string[]
}

/**
 * Motivation Level
 */
export interface MotivationLevel {
  /** Current level */
  current: number
  /** Average level */
  average: number
  /** Level trend */
  trend: TrendDirection
  /** Level history */
  history: MotivationHistory[]
  /** Level factors */
  factors: MotivationFactor[]
}

/**
 * Motivation History
 */
export interface MotivationHistory {
  /** Date */
  date: Date
  /** Motivation level */
  level: number
  /** Contributing factors */
  factors: string[]
  /** Context */
  context?: string
  /** Notes */
  notes?: string
}

/**
 * Motivation Factor
 */
export interface MotivationFactor {
  /** Factor name */
  name: string
  /** Factor impact */
  impact: number
  /** Factor trend */
  trend: TrendDirection
  /** Factor controllability */
  controllable: boolean
}

/**
 * Motivation Tracking
 */
export interface MotivationTracking {
  /** Tracking enabled */
  enabled: boolean
  /** Tracking frequency */
  frequency: 'daily' | 'weekly' | 'after_workout' | 'when_prompted'
  /** Tracking method */
  method: 'scale' | 'survey' | 'behavioral' | 'biometric'
  /** Tracking metrics */
  metrics: MotivationMetric[]
}

/**
 * Motivation Metric
 */
export interface MotivationMetric {
  /** Metric name */
  name: string
  /** Metric type */
  type: 'subjective' | 'objective' | 'behavioral'
  /** Metric scale */
  scale: MetricScale
  /** Metric weight */
  weight: number
}

/**
 * Metric Scale
 */
export interface MetricScale {
  /** Scale type */
  type: 'numeric' | 'likert' | 'binary' | 'categorical'
  /** Scale range */
  range: { min: number; max: number }
  /** Scale labels */
  labels: string[]
}

/**
 * Motivational Content
 */
export interface MotivationalContent {
  /** Content library */
  library: ContentLibrary
  /** Personalization engine */
  personalization: ContentPersonalization
  /** Delivery settings */
  delivery: ContentDelivery
  /** Content effectiveness */
  effectiveness: ContentEffectiveness
}

/**
 * Content Library
 */
export interface ContentLibrary {
  /** Motivational quotes */
  quotes: MotivationalQuote[]
  /** Success stories */
  stories: SuccessStory[]
  /** Visual content */
  visuals: VisualContent[]
  /** Audio content */
  audio: AudioContent[]
  /** Interactive content */
  interactive: InteractiveContent[]
}

/**
 * Motivational Quote
 */
export interface MotivationalQuote {
  /** Quote ID */
  id: string
  /** Quote text */
  text: string
  /** Quote author */
  author?: string
  /** Quote category */
  category: string
  /** Quote relevance score */
  relevance: number
  /** Quote usage count */
  usageCount: number
  /** User rating */
  userRating?: number
}

/**
 * Success Story
 */
export interface SuccessStory {
  /** Story ID */
  id: string
  /** Story title */
  title: string
  /** Story content */
  content: string
  /** Story author */
  author: string
  /** Story category */
  category: string
  /** Story similarity score */
  similarity: number
  /** Story verification */
  verified: boolean
}

/**
 * Visual Content
 */
export interface VisualContent {
  /** Content ID */
  id: string
  /** Content type */
  type: 'image' | 'gif' | 'video' | 'infographic'
  /** Content URL */
  url: string
  /** Content description */
  description: string
  /** Content tags */
  tags: string[]
  /** Content effectiveness */
  effectiveness: number
}

/**
 * Audio Content
 */
export interface AudioContent {
  /** Content ID */
  id: string
  /** Content type */
  type: 'music' | 'podcast' | 'meditation' | 'affirmation'
  /** Content URL */
  url: string
  /** Content duration */
  duration: number
  /** Content description */
  description: string
  /** Content mood */
  mood: string
  /** Content effectiveness */
  effectiveness: number
}

/**
 * Interactive Content
 */
export interface InteractiveContent {
  /** Content ID */
  id: string
  /** Content type */
  type: 'quiz' | 'game' | 'challenge' | 'visualization'
  /** Content configuration */
  config: any
  /** Content description */
  description: string
  /** Engagement score */
  engagement: number
}

/**
 * Content Personalization
 */
export interface ContentPersonalization {
  /** Personalization enabled */
  enabled: boolean
  /** User preferences */
  preferences: ContentPreferences
  /** Learning algorithm */
  algorithm: PersonalizationAlgorithm
  /** Content scoring */
  scoring: ContentScoring
}

/**
 * Content Preferences
 */
export interface ContentPreferences {
  /** Preferred content types */
  types: string[]
  /** Preferred moods */
  moods: string[]
  /** Preferred authors */
  authors: string[]
  /** Content frequency */
  frequency: number
  /** Content timing */
  timing: string[]
}

/**
 * Personalization Algorithm
 */
export interface PersonalizationAlgorithm {
  /** Algorithm type */
  type: 'collaborative_filtering' | 'content_based' | 'hybrid'
  /** Algorithm parameters */
  parameters: Record<string, any>
  /** Learning rate */
  learningRate: number
  /** Feedback weight */
  feedbackWeight: number
}

/**
 * Content Scoring
 */
export interface ContentScoring {
  /** Relevance score */
  relevance: number
  /** Effectiveness score */
  effectiveness: number
  /** Novelty score */
  novelty: number
  /** User preference score */
  preference: number
  /** Overall score */
  overall: number
}

/**
 * Content Delivery
 */
export interface ContentDelivery {
  /** Delivery channels */
  channels: DeliveryChannel[]
  /** Delivery timing */
  timing: DeliveryTiming
  /** Delivery frequency */
  frequency: DeliveryFrequency
  /** Delivery personalization */
  personalization: DeliveryPersonalization
}

/**
 * Delivery Channel
 */
export interface DeliveryChannel {
  /** Channel type */
  type: 'push' | 'email' | 'in_app' | 'widget' | 'social'
  /** Channel enabled */
  enabled: boolean
  /** Channel priority */
  priority: number
  /** Channel configuration */
  config: ChannelConfig
}

/**
 * Channel Configuration
 */
export interface ChannelConfig {
  /** Channel parameters */
  parameters: Record<string, any>
  /** Rate limiting */
  rateLimiting: RateLimiting
  /** Content formatting */
  formatting: ContentFormatting
}

/**
 * Rate Limiting
 */
export interface RateLimiting {
  /** Maximum per day */
  maxPerDay: number
  /** Maximum per week */
  maxPerWeek: number
  /** Minimum interval (minutes) */
  minInterval: number
}

/**
 * Content Formatting
 */
export interface ContentFormatting {
  /** Text length limit */
  textLength: number
  /** Include images */
  includeImages: boolean
  /** Include links */
  includeLinks: boolean
  /** Formatting style */
  style: string
}

/**
 * Delivery Timing
 */
export interface DeliveryTiming {
  /** Optimal times */
  optimalTimes: string[]
  /** Time zone */
  timezone: string
  /** Avoid times */
  avoidTimes: string[]
  /** Smart timing */
  smartTiming: boolean
}

/**
 * Delivery Frequency
 */
export interface DeliveryFrequency {
  /** Base frequency */
  base: number
  /** Adaptive frequency */
  adaptive: boolean
  /** Frequency factors */
  factors: FrequencyFactor[]
}

/**
 * Frequency Factor
 */
export interface FrequencyFactor {
  /** Factor name */
  factor: string
  /** Factor impact */
  impact: number
  /** Factor weight */
  weight: number
}

/**
 * Delivery Personalization
 */
export interface DeliveryPersonalization {
  /** Personalization level */
  level: 'none' | 'basic' | 'advanced'
  /** User context awareness */
  contextAware: boolean
  /** Behavioral targeting */
  behavioralTargeting: boolean
  /** Dynamic optimization */
  dynamicOptimization: boolean
}

/**
 * Content Effectiveness
 */
export interface ContentEffectiveness {
  /** Effectiveness metrics */
  metrics: EffectivenessMetric[]
  /** A/B testing */
  abTesting: ABTestConfig
  /** Feedback collection */
  feedbackCollection: FeedbackCollectionConfig
  /** Performance tracking */
  performanceTracking: PerformanceTrackingConfig
}

/**
 * Effectiveness Metric
 */
export interface EffectivenessMetric {
  /** Metric name */
  name: string
  /** Metric value */
  value: number
  /** Metric trend */
  trend: TrendDirection
  /** Metric target */
  target: number
}

/**
 * A/B Test Configuration
 */
export interface ABTestConfig {
  /** Testing enabled */
  enabled: boolean
  /** Test variants */
  variants: TestVariant[]
  /** Traffic split */
  trafficSplit: number[]
  /** Test duration */
  duration: number
  /** Success metrics */
  successMetrics: string[]
}

/**
 * Test Variant
 */
export interface TestVariant {
  /** Variant ID */
  id: string
  /** Variant name */
  name: string
  /** Variant configuration */
  config: any
  /** Variant performance */
  performance: VariantPerformance
}

/**
 * Variant Performance
 */
export interface VariantPerformance {
  /** Conversion rate */
  conversionRate: number
  /** Engagement rate */
  engagementRate: number
  /** User satisfaction */
  satisfaction: number
  /** Statistical significance */
  significance: number
}

/**
 * Feedback Collection Configuration
 */
export interface FeedbackCollectionConfig {
  /** Collection enabled */
  enabled: boolean
  /** Collection methods */
  methods: FeedbackMethod[]
  /** Collection frequency */
  frequency: 'immediate' | 'periodic' | 'triggered'
  /** Collection incentives */
  incentives: FeedbackIncentive[]
}

/**
 * Feedback Method
 */
export interface FeedbackMethod {
  /** Method type */
  type: 'rating' | 'survey' | 'implicit' | 'behavioral'
  /** Method configuration */
  config: any
  /** Method weight */
  weight: number
}

/**
 * Feedback Incentive
 */
export interface FeedbackIncentive {
  /** Incentive type */
  type: 'points' | 'badge' | 'discount' | 'content_unlock'
  /** Incentive value */
  value: any
  /** Incentive description */
  description: string
}

/**
 * Performance Tracking Configuration
 */
export interface PerformanceTrackingConfig {
  /** Tracking enabled */
  enabled: boolean
  /** Tracking metrics */
  metrics: string[]
  /** Tracking frequency */
  frequency: 'real_time' | 'hourly' | 'daily'
  /** Alerting thresholds */
  thresholds: PerformanceThreshold[]
}

/**
 * Performance Threshold
 */
export interface PerformanceThreshold {
  /** Metric name */
  metric: string
  /** Threshold value */
  value: number
  /** Threshold type */
  type: 'min' | 'max' | 'range'
  /** Alert action */
  action: string
}

/**
 * Engagement Strategy
 */
export interface EngagementStrategy {
  /** Strategy ID */
  id: string
  /** Strategy name */
  name: string
  /** Strategy type */
  type: EngagementStrategyType
  /** Strategy configuration */
  config: EngagementConfig
  /** Strategy effectiveness */
  effectiveness: StrategyEffectiveness
  /** Strategy active */
  active: boolean
}

/**
 * Engagement Strategy Types
 */
export type EngagementStrategyType = 
  | 'gamification'       // Game-like elements
  | 'social_support'     // Social connections
  | 'progress_sharing'   // Progress visibility
  | 'challenges'         // Periodic challenges
  | 'rewards'            // Reward system
  | 'coaching'           // AI coaching
  | 'community'          // Community features
  | 'personalization'    // Personal touch

/**
 * Engagement Configuration
 */
export interface EngagementConfig {
  /** Configuration parameters */
  parameters: Record<string, any>
  /** Target audience */
  targetAudience: AudienceSegment[]
  /** Timing rules */
  timing: EngagementTiming
  /** Success criteria */
  successCriteria: SuccessCriteria
}

/**
 * Audience Segment
 */
export interface AudienceSegment {
  /** Segment name */
  name: string
  /** Segment criteria */
  criteria: SegmentCriteria[]
  /** Segment size */
  size: number
  /** Segment engagement */
  engagement: number
}

/**
 * Segment Criteria
 */
export interface SegmentCriteria {
  /** Criteria field */
  field: string
  /** Criteria operator */
  operator: string
  /** Criteria value */
  value: any
  /** Criteria weight */
  weight: number
}

/**
 * Engagement Timing
 */
export interface EngagementTiming {
  /** Timing triggers */
  triggers: TimingTrigger[]
  /** Timing constraints */
  constraints: TimingConstraint[]
  /** Timing optimization */
  optimization: TimingOptimization
}

/**
 * Timing Trigger
 */
export interface TimingTrigger {
  /** Trigger type */
  type: 'time_based' | 'event_based' | 'behavior_based' | 'context_based'
  /** Trigger condition */
  condition: any
  /** Trigger priority */
  priority: number
}

/**
 * Timing Constraint
 */
export interface TimingConstraint {
  /** Constraint type */
  type: 'frequency_limit' | 'time_window' | 'user_state' | 'context_filter'
  /** Constraint parameters */
  parameters: any
}

/**
 * Timing Optimization
 */
export interface TimingOptimization {
  /** Optimization enabled */
  enabled: boolean
  /** Optimization algorithm */
  algorithm: string
  /** Optimization objectives */
  objectives: string[]
  /** Learning parameters */
  learningParams: Record<string, any>
}

/**
 * Strategy Effectiveness
 */
export interface StrategyEffectiveness {
  /** Overall effectiveness score */
  overall: number
  /** Effectiveness by segment */
  bySegment: Record<string, number>
  /** Key performance indicators */
  kpis: EffectivenessKPI[]
  /** Effectiveness trends */
  trends: EffectivenessTrend[]
}

/**
 * Effectiveness KPI
 */
export interface EffectivenessKPI {
  /** KPI name */
  name: string
  /** KPI value */
  value: number
  /** KPI target */
  target: number
  /** KPI trend */
  trend: TrendDirection
}

/**
 * Effectiveness Trend
 */
export interface EffectivenessTrend {
  /** Trend period */
  period: AnalyticsPeriod
  /** Trend direction */
  direction: TrendDirection
  /** Trend magnitude */
  magnitude: number
  /** Trend significance */
  significance: number
}

// ================================
// Goal Relationships
// ================================

/**
 * Goal Relationships
 */
export interface GoalRelationships {
  /** Parent goals */
  parents: GoalRelationship[]
  /** Child goals */
  children: GoalRelationship[]
  /** Related goals */
  related: GoalRelationship[]
  /** Prerequisite goals */
  prerequisites: GoalRelationship[]
  /** Dependent goals */
  dependents: GoalRelationship[]
  /** Conflicting goals */
  conflicts: GoalConflict[]
}

/**
 * Goal Relationship
 */
export interface GoalRelationship {
  /** Related goal ID */
  goalId: string
  /** Relationship type */
  type: RelationshipType
  /** Relationship strength */
  strength: number
  /** Relationship description */
  description: string
  /** Relationship impact */
  impact: RelationshipImpact
  /** Relationship active */
  active: boolean
}

/**
 * Relationship Types
 */
export type RelationshipType = 
  | 'parent_child'       // Hierarchical relationship
  | 'prerequisite'       // Must complete before
  | 'dependent'          // Depends on this goal
  | 'complementary'      // Works well together
  | 'synergistic'        // Mutual reinforcement
  | 'competitive'        // Competing for resources
  | 'conflicting'        // Direct conflict
  | 'supportive'         // Provides support

/**
 * Relationship Impact
 */
export interface RelationshipImpact {
  /** Impact on success probability */
  successProbability: number
  /** Impact on completion time */
  completionTime: number
  /** Impact on difficulty */
  difficulty: number
  /** Impact on motivation */
  motivation: number
  /** Impact description */
  description: string
}

/**
 * Goal Conflict
 */
export interface GoalConflict {
  /** Conflicting goal ID */
  goalId: string
  /** Conflict type */
  type: ConflictType
  /** Conflict severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Conflict description */
  description: string
  /** Resolution strategies */
  resolutionStrategies: ConflictResolution[]
  /** Conflict resolved */
  resolved: boolean
}

/**
 * Conflict Types
 */
export type ConflictType = 
  | 'resource_conflict'    // Competing for same resources
  | 'time_conflict'        // Competing for same time
  | 'goal_conflict'        // Contradictory objectives
  | 'method_conflict'      // Conflicting methods
  | 'priority_conflict'    // Priority conflicts

/**
 * Conflict Resolution
 */
export interface ConflictResolution {
  /** Resolution strategy */
  strategy: ResolutionStrategy
  /** Resolution description */
  description: string
  /** Resolution feasibility */
  feasibility: number
  /** Resolution impact */
  impact: ResolutionImpact
}

/**
 * Resolution Strategy
 */
export type ResolutionStrategy = 
  | 'prioritize'           // Prioritize one goal
  | 'schedule_separate'    // Schedule separately
  | 'merge_goals'          // Combine into one goal
  | 'modify_approach'      // Modify approach
  | 'resource_allocation'  // Allocate resources differently
  | 'sequential_approach'  // Do one after another

/**
 * Resolution Impact
 */
export interface ResolutionImpact {
  /** Impact on goal success */
  goalSuccess: Record<string, number>
  /** Impact on timeline */
  timeline: number
  /** Impact on resources */
  resources: number
  /** Overall satisfaction */
  satisfaction: number
}

// ================================
// Goal Metadata
// ================================

/**
 * Goal Metadata
 */
export interface GoalMetadata {
  /** Creation information */
  creation: CreationMetadata
  /** Modification history */
  modifications: ModificationHistory[]
  /** Sharing and collaboration */
  sharing: SharingMetadata
  /** System information */
  system: SystemMetadata
  /** Analytics and tracking */
  analytics: AnalyticsMetadata
}

/**
 * Creation Metadata
 */
export interface CreationMetadata {
  /** Created by user */
  createdBy: string
  /** Creation date */
  createdAt: Date
  /** Creation method */
  creationMethod: 'manual' | 'template' | 'ai_suggested' | 'imported'
  /** Creation source */
  source?: string
  /** Original template */
  templateId?: string
  /** Creation context */
  context: CreationContext
}

/**
 * Creation Context
 */
export interface CreationContext {
  /** User fitness level at creation */
  userFitnessLevel: FitnessLevel
  /** Active workout plan */
  activeWorkoutPlan?: string
  /** Recent achievements */
  recentAchievements: string[]
  /** Motivation triggers */
  motivationTriggers: string[]
  /** Environmental factors */
  environment: Record<string, any>
}

/**
 * Modification History
 */
export interface ModificationHistory {
  /** Modification ID */
  id: string
  /** Modified by user */
  modifiedBy: string
  /** Modification date */
  modifiedAt: Date
  /** Modification type */
  type: ModificationType
  /** Fields changed */
  fieldsChanged: string[]
  /** Previous values */
  previousValues: Record<string, any>
  /** New values */
  newValues: Record<string, any>
  /** Modification reason */
  reason: string
  /** Modification impact */
  impact: ModificationImpact
}

/**
 * Modification Types
 */
export type ModificationType = 
  | 'target_adjustment'    // Target value changed
  | 'timeline_adjustment'  // Timeline changed
  | 'priority_change'      // Priority changed
  | 'status_change'        // Status changed
  | 'configuration_change' // Configuration changed
  | 'relationship_change'  // Relationships changed

/**
 * Modification Impact
 */
export interface ModificationImpact {
  /** Impact on success probability */
  successProbability: number
  /** Impact on completion date */
  completionDate: number
  /** Impact on difficulty */
  difficulty: number
  /** Impact on other goals */
  relatedGoals: Record<string, number>
}

/**
 * Sharing Metadata
 */
export interface SharingMetadata {
  /** Shared with users */
  sharedWith: SharedUser[]
  /** Sharing permissions */
  permissions: SharingPermissions
  /** Collaboration settings */
  collaboration: CollaborationSettings
  /** Public sharing */
  publicSharing: PublicSharingSettings
}

/**
 * Shared User
 */
export interface SharedUser {
  /** User ID */
  userId: string
  /** User role */
  role: 'viewer' | 'supporter' | 'coach' | 'collaborator'
  /** Shared date */
  sharedAt: Date
  /** Permissions */
  permissions: UserPermissions
}

/**
 * User Permissions
 */
export interface UserPermissions {
  /** Can view progress */
  viewProgress: boolean
  /** Can comment */
  comment: boolean
  /** Can provide encouragement */
  encourage: boolean
  /** Can suggest modifications */
  suggest: boolean
  /** Can edit */
  edit: boolean
}

/**
 * Sharing Permissions
 */
export interface SharingPermissions {
  /** Allow sharing */
  allowSharing: boolean
  /** Require approval for sharing */
  requireApproval: boolean
  /** Share progress updates */
  shareProgress: boolean
  /** Share achievements */
  shareAchievements: boolean
  /** Share setbacks */
  shareSetbacks: boolean
}

/**
 * Collaboration Settings
 */
export interface CollaborationSettings {
  /** Allow collaboration */
  allowCollaboration: boolean
  /** Collaboration type */
  type: 'support_group' | 'accountability_partner' | 'coaching' | 'team_goal'
  /** Collaboration rules */
  rules: CollaborationRule[]
}

/**
 * Collaboration Rule
 */
export interface CollaborationRule {
  /** Rule type */
  type: string
  /** Rule description */
  description: string
  /** Rule parameters */
  parameters: any
  /** Rule active */
  active: boolean
}

/**
 * Public Sharing Settings
 */
export interface PublicSharingSettings {
  /** Allow public sharing */
  allowPublic: boolean
  /** Public visibility */
  visibility: 'private' | 'anonymous' | 'public'
  /** Share success story */
  shareSuccessStory: boolean
  /** Allow testimonial use */
  allowTestimonial: boolean
}

/**
 * System Metadata
 */
export interface SystemMetadata {
  /** System version */
  version: string
  /** Data schema version */
  schemaVersion: string
  /** Last system update */
  lastSystemUpdate: Date
  /** Data integrity checks */
  integrityChecks: IntegrityCheck[]
  /** System tags */
  systemTags: string[]
}

/**
 * Integrity Check
 */
export interface IntegrityCheck {
  /** Check type */
  type: string
  /** Check result */
  result: 'pass' | 'fail' | 'warning'
  /** Check date */
  date: Date
  /** Check details */
  details: string
}

/**
 * Analytics Metadata
 */
export interface AnalyticsMetadata {
  /** Tracking enabled */
  trackingEnabled: boolean
  /** Analytics events */
  events: AnalyticsEvent[]
  /** Performance metrics */
  performance: PerformanceMetrics
  /** Usage statistics */
  usage: UsageStatistics
}

/**
 * Analytics Event
 */
export interface AnalyticsEvent {
  /** Event type */
  type: string
  /** Event timestamp */
  timestamp: Date
  /** Event data */
  data: any
  /** Event source */
  source: string
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /** Goal engagement score */
  engagement: number
  /** Goal stickiness */
  stickiness: number
  /** Goal virality */
  virality: number
  /** Goal effectiveness */
  effectiveness: number
}

/**
 * Usage Statistics
 */
export interface UsageStatistics {
  /** Total views */
  views: number
  /** Total interactions */
  interactions: number
  /** Time spent */
  timeSpent: number
  /** Feature usage */
  featureUsage: Record<string, number>
}

// Export all goal tracking types
export type {
  FitnessGoal,
  GoalConfiguration,
  GoalProgress,
  GoalTimeline,
  GoalMotivation,
  GoalRelationships,
  GoalMetadata
}