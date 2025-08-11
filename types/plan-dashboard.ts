/**
 * Plan Dashboard and Management Interface Type Definitions
 * Phase 3: Advanced TypeScript interfaces for plan management, calendar scheduling,
 * template browsing, progress analytics, and dashboard state management
 */

import { FitnessLevel, SubscriptionTier, UserProfile } from './index'
import { 
  WorkoutPlan, 
  WorkoutSession,
  WorkoutStatus,
  SessionStatus,
  ExerciseType,
  UserAchievement,
  AchievementType,
  ProgressMeasurement,
  MeasurementType
} from './workouts'
import { SessionExecution } from './session-execution'

// ================================
// Plan Management Dashboard Types
// ================================

/**
 * Enhanced Plan Status with Dashboard-specific states
 */
export type PlanManagementStatus = WorkoutStatus | 'scheduled' | 'overdue' | 'modified'

/**
 * Plan Priority Levels for Dashboard Organization
 */
export type PlanPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Plan Management Actions
 */
export type PlanAction = 
  | 'duplicate'
  | 'archive' 
  | 'restore'
  | 'delete'
  | 'export'
  | 'share'
  | 'publish'
  | 'unpublish'
  | 'modify'
  | 'schedule'

/**
 * Enhanced Workout Plan for Dashboard Management
 */
export interface DashboardWorkoutPlan extends WorkoutPlan {
  /** Plan management metadata */
  management: PlanManagement
  /** Dashboard-specific display properties */
  display: PlanDisplayProps
  /** Usage and performance statistics */
  statistics: PlanStatistics
  /** Social and sharing information */
  social: PlanSocialData
  /** Template-specific properties */
  template?: TemplateProperties
}

/**
 * Plan Management Metadata
 */
export interface PlanManagement {
  /** Management priority level */
  priority: PlanPriority
  /** Tags for organization and filtering */
  tags: string[]
  /** Custom categories beyond default classification */
  customCategories: string[]
  /** Plan ownership and sharing settings */
  ownership: PlanOwnership
  /** Version control and change tracking */
  versioning: PlanVersioning
  /** Compliance and validation status */
  compliance: PlanCompliance
  /** Archival and retention settings */
  retention: RetentionSettings
}

/**
 * Plan Ownership Configuration
 */
export interface PlanOwnership {
  /** Original creator */
  createdBy: string
  /** Current owner (may differ from creator) */
  ownerId: string
  /** Users with edit permissions */
  editors: string[]
  /** Users with view permissions */
  viewers: string[]
  /** Organization permissions */
  organizationAccess: OrganizationAccess
  /** Public visibility settings */
  publicAccess: PublicAccessSettings
}

/**
 * Organization Access Controls
 */
export interface OrganizationAccess {
  /** Can organization members view */
  canView: boolean
  /** Can organization members copy/use */
  canUse: boolean
  /** Can organization admins edit */
  canEdit: boolean
  /** Require approval for use */
  requireApproval: boolean
  /** Role-based restrictions */
  roleRestrictions: Record<string, string[]>
}

/**
 * Public Access Settings
 */
export interface PublicAccessSettings {
  /** Is plan publicly visible */
  isPublic: boolean
  /** Allow public cloning/copying */
  allowCloning: boolean
  /** Require attribution when shared */
  requireAttribution: boolean
  /** Content licensing terms */
  license?: ContentLicense
  /** Age and content restrictions */
  restrictions: ContentRestrictions
}

/**
 * Content Licensing
 */
export interface ContentLicense {
  /** License type */
  type: 'cc0' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'proprietary' | 'custom'
  /** License text or URL */
  text?: string
  /** Attribution requirements */
  attribution: AttributionRequirements
}

/**
 * Attribution Requirements
 */
export interface AttributionRequirements {
  /** Required attribution text */
  text: string
  /** Link back required */
  linkRequired: boolean
  /** Creator name display required */
  nameRequired: boolean
  /** Modification notification required */
  notifyOnModification: boolean
}

/**
 * Content Restrictions
 */
export interface ContentRestrictions {
  /** Minimum age requirement */
  minimumAge?: number
  /** Fitness level requirements */
  minimumFitnessLevel?: FitnessLevel
  /** Equipment access requirements */
  requiredEquipment?: string[]
  /** Medical clearance requirements */
  medicalClearance?: string[]
  /** Geographic restrictions */
  geoRestrictions?: string[]
}

/**
 * Plan Version Control
 */
export interface PlanVersioning {
  /** Current version number */
  currentVersion: string
  /** Version history */
  versionHistory: PlanVersion[]
  /** Change tracking enabled */
  trackChanges: boolean
  /** Automatic versioning on significant changes */
  autoVersion: boolean
  /** Branch information for collaborative editing */
  branches: PlanBranch[]
  /** Merge conflicts if any */
  conflicts: PlanConflict[]
}

/**
 * Individual Plan Version
 */
export interface PlanVersion {
  /** Version identifier */
  version: string
  /** Version display name */
  name?: string
  /** Creation timestamp */
  createdAt: Date
  /** Creator user ID */
  createdBy: string
  /** Change summary */
  changesSummary: string
  /** Detailed change log */
  changeLog: PlanChange[]
  /** Version tags */
  tags: string[]
  /** Is this a stable release */
  isStable: boolean
  /** Can this version be restored */
  canRestore: boolean
}

/**
 * Plan Version Branch
 */
export interface PlanBranch {
  /** Branch identifier */
  branchId: string
  /** Branch name */
  name: string
  /** Base version */
  baseVersion: string
  /** Branch creator */
  createdBy: string
  /** Creation timestamp */
  createdAt: Date
  /** Branch description */
  description?: string
  /** Is branch active */
  isActive: boolean
  /** Can branch be merged */
  canMerge: boolean
}

/**
 * Plan Change Record
 */
export interface PlanChange {
  /** Change type */
  type: 'add' | 'modify' | 'delete' | 'move' | 'metadata'
  /** Affected entity type */
  entityType: 'exercise' | 'session' | 'schedule' | 'metadata' | 'settings'
  /** Entity identifier */
  entityId?: string
  /** Change description */
  description: string
  /** Previous value (for modifications) */
  previousValue?: any
  /** New value */
  newValue?: any
  /** Change timestamp */
  timestamp: Date
  /** User who made the change */
  changedBy: string
}

/**
 * Plan Merge Conflict
 */
export interface PlanConflict {
  /** Conflict identifier */
  conflictId: string
  /** Conflicting entity */
  entityType: string
  /** Entity identifier */
  entityId: string
  /** Base version value */
  baseValue: any
  /** Current version value */
  currentValue: any
  /** Incoming change value */
  incomingValue: any
  /** Conflict resolution status */
  resolved: boolean
  /** Resolution method if resolved */
  resolution?: 'use_current' | 'use_incoming' | 'merge_custom' | 'manual'
  /** Custom resolution data */
  customResolution?: any
}

/**
 * Plan Compliance and Validation
 */
export interface PlanCompliance {
  /** Validation status */
  isValid: boolean
  /** Last validation timestamp */
  lastValidated: Date
  /** Validation errors */
  validationErrors: ValidationError[]
  /** Validation warnings */
  validationWarnings: ValidationWarning[]
  /** Compliance with organizational standards */
  organizationCompliance: ComplianceStatus
  /** Safety and medical compliance */
  safetyCompliance: SafetyCompliance
}

/**
 * Validation Error Details
 */
export interface ValidationError {
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Severity level */
  severity: 'error' | 'warning' | 'info'
  /** Affected entity */
  entityType: string
  /** Entity identifier */
  entityId?: string
  /** Suggested fix */
  suggestedFix?: string
  /** Is error blocking */
  isBlocking: boolean
}

/**
 * Validation Warning
 */
export interface ValidationWarning extends Omit<ValidationError, 'severity'> {
  /** Warning category */
  category: 'performance' | 'safety' | 'usability' | 'best_practice'
  /** Can warning be dismissed */
  canDismiss: boolean
  /** Warning dismissal status */
  dismissed: boolean
}

/**
 * Organization Compliance Status
 */
export interface ComplianceStatus {
  /** Complies with organization standards */
  compliant: boolean
  /** Compliance percentage */
  complianceScore: number
  /** Non-compliant items */
  violations: ComplianceViolation[]
  /** Last compliance check */
  lastChecked: Date
  /** Required approval status */
  approvalRequired: boolean
  /** Approval status */
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

/**
 * Compliance Violation
 */
export interface ComplianceViolation {
  /** Violation type */
  type: string
  /** Violation description */
  description: string
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Resolution required */
  resolutionRequired: boolean
  /** Suggested resolution */
  suggestedResolution?: string
}

/**
 * Safety Compliance
 */
export interface SafetyCompliance {
  /** Safety rating */
  safetyRating: number
  /** Safety concerns */
  concerns: SafetyConcern[]
  /** Required disclaimers */
  disclaimers: string[]
  /** Medical clearance requirements */
  medicalClearance: string[]
  /** Equipment safety checks */
  equipmentSafety: EquipmentSafetyCheck[]
}

/**
 * Safety Concern
 */
export interface SafetyConcern {
  /** Concern type */
  type: 'injury_risk' | 'equipment_hazard' | 'medical_condition' | 'intensity_warning'
  /** Concern description */
  description: string
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'severe'
  /** Affected populations */
  affectedPopulations: string[]
  /** Mitigation strategies */
  mitigations: string[]
}

/**
 * Equipment Safety Check
 */
export interface EquipmentSafetyCheck {
  /** Equipment ID */
  equipmentId: string
  /** Safety status */
  status: 'safe' | 'caution' | 'unsafe'
  /** Safety notes */
  notes: string[]
  /** Last safety inspection */
  lastInspected?: Date
  /** Inspection due date */
  inspectionDue?: Date
}

/**
 * Data Retention Settings
 */
export interface RetentionSettings {
  /** Automatic archival enabled */
  autoArchive: boolean
  /** Days before archival */
  archiveAfterDays?: number
  /** Automatic deletion enabled */
  autoDelete: boolean
  /** Days before deletion */
  deleteAfterDays?: number
  /** Retention policy reason */
  retentionReason: 'regulatory' | 'business' | 'user_preference' | 'storage_limits'
  /** Data export before deletion */
  exportBeforeDeletion: boolean
}

/**
 * Plan Display Properties for Dashboard
 */
export interface PlanDisplayProps {
  /** Display order/priority */
  displayOrder: number
  /** Pinned to top of dashboard */
  isPinned: boolean
  /** Featured/highlighted status */
  isFeatured: boolean
  /** Color coding for visual organization */
  colorTheme?: PlanColorTheme
  /** Custom display icon */
  customIcon?: string
  /** Display in compact mode */
  compactDisplay: boolean
  /** Progress visualization preferences */
  progressVisualization: ProgressVisualizationSettings
  /** Dashboard widget configuration */
  widgetConfig: DashboardWidgetConfig
}

/**
 * Plan Color Theme
 */
export interface PlanColorTheme {
  /** Primary color */
  primary: string
  /** Secondary color */
  secondary?: string
  /** Background color */
  background?: string
  /** Text color */
  text?: string
  /** Accent color */
  accent?: string
}

/**
 * Progress Visualization Settings
 */
export interface ProgressVisualizationSettings {
  /** Chart type preference */
  chartType: 'line' | 'bar' | 'circle' | 'gauge'
  /** Show percentage complete */
  showPercentage: boolean
  /** Show time remaining */
  showTimeRemaining: boolean
  /** Show streak information */
  showStreak: boolean
  /** Animation enabled */
  animated: boolean
}

/**
 * Dashboard Widget Configuration
 */
export interface DashboardWidgetConfig {
  /** Widget size */
  size: 'small' | 'medium' | 'large' | 'extra_large'
  /** Widget position */
  position: WidgetPosition
  /** Show quick actions */
  showQuickActions: boolean
  /** Show statistics */
  showStatistics: boolean
  /** Show recent sessions */
  showRecentSessions: boolean
  /** Refresh interval in minutes */
  refreshIntervalMinutes: number
}

/**
 * Widget Position
 */
export interface WidgetPosition {
  /** Grid row */
  row: number
  /** Grid column */
  column: number
  /** Widget span (width) */
  colSpan: number
  /** Widget span (height) */
  rowSpan: number
}

/**
 * Plan Usage and Performance Statistics
 */
export interface PlanStatistics {
  /** Total usage metrics */
  usage: PlanUsageMetrics
  /** Performance metrics */
  performance: PlanPerformanceMetrics
  /** Social engagement metrics */
  engagement: PlanEngagementMetrics
  /** Temporal statistics */
  temporal: TemporalStatistics
}

/**
 * Plan Usage Metrics
 */
export interface PlanUsageMetrics {
  /** Total number of users */
  totalUsers: number
  /** Active users in last 30 days */
  activeUsers: number
  /** Total sessions completed */
  totalSessions: number
  /** Average sessions per user */
  avgSessionsPerUser: number
  /** Plan completion rate */
  completionRate: number
  /** Average time to completion */
  avgCompletionDays: number
  /** Dropout rate and reasons */
  dropoutRate: number
  /** Most common dropout points */
  dropoutPoints: DropoutPoint[]
}

/**
 * Dropout Analysis
 */
export interface DropoutPoint {
  /** Point in plan where dropout occurs */
  point: 'week_1' | 'week_2' | 'month_1' | 'mid_plan' | 'near_end'
  /** Percentage of users who drop out at this point */
  dropoutPercentage: number
  /** Common reasons for dropout */
  reasons: string[]
}

/**
 * Plan Performance Metrics
 */
export interface PlanPerformanceMetrics {
  /** Average user satisfaction rating */
  avgSatisfactionRating: number
  /** Effectiveness score based on goal achievement */
  effectivenessScore: number
  /** Difficulty rating from users */
  avgDifficultyRating: number
  /** Exercise completion rates */
  exerciseCompletionRates: Record<string, number>
  /** Most/least popular exercises */
  exercisePopularity: ExercisePopularityMetric[]
  /** Common modifications made */
  commonModifications: PlanModification[]
}

/**
 * Exercise Popularity Metric
 */
export interface ExercisePopularityMetric {
  /** Exercise ID */
  exerciseId: string
  /** Exercise name */
  exerciseName: string
  /** Completion rate */
  completionRate: number
  /** User satisfaction rating */
  avgRating: number
  /** Number of times modified */
  modificationsCount: number
  /** Popularity rank */
  popularityRank: number
}

/**
 * Common Plan Modifications
 */
export interface PlanModification {
  /** Modification type */
  type: 'exercise_substitution' | 'volume_adjustment' | 'schedule_change' | 'difficulty_adjustment'
  /** Description of modification */
  description: string
  /** Frequency of this modification */
  frequency: number
  /** Success rate of modification */
  successRate: number
  /** User fitness levels that commonly make this modification */
  commonFitnessLevels: FitnessLevel[]
}

/**
 * Social Engagement Metrics
 */
export interface PlanEngagementMetrics {
  /** Number of shares */
  shareCount: number
  /** Number of clones/copies */
  cloneCount: number
  /** Star/favorite count */
  favoriteCount: number
  /** Comment/review count */
  reviewCount: number
  /** Average rating from reviews */
  avgRating: number
  /** Social media mentions */
  socialMentions: number
  /** Community discussions */
  discussionCount: number
}

/**
 * Temporal Statistics
 */
export interface TemporalStatistics {
  /** Usage trends over time */
  usageTrends: TemporalDataPoint[]
  /** Seasonal usage patterns */
  seasonalPatterns: SeasonalPattern[]
  /** Peak usage times */
  peakTimes: PeakUsageTime[]
  /** Growth metrics */
  growth: GrowthMetrics
}

/**
 * Temporal Data Point
 */
export interface TemporalDataPoint {
  /** Time period */
  period: Date
  /** Value for this period */
  value: number
  /** Percentage change from previous period */
  changePercent: number
  /** Trend direction */
  trend: 'up' | 'down' | 'stable'
}

/**
 * Seasonal Usage Pattern
 */
export interface SeasonalPattern {
  /** Season identifier */
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'new_year' | 'beach_season'
  /** Usage multiplier (1.0 = average) */
  usageMultiplier: number
  /** Most popular plan types during this season */
  popularPlanTypes: string[]
  /** Seasonal completion rate */
  completionRate: number
}

/**
 * Peak Usage Time
 */
export interface PeakUsageTime {
  /** Time period type */
  type: 'hour_of_day' | 'day_of_week' | 'day_of_month' | 'month_of_year'
  /** Time value */
  value: number
  /** Usage intensity */
  intensity: number
  /** Geographic region (if applicable) */
  region?: string
}

/**
 * Growth Metrics
 */
export interface GrowthMetrics {
  /** User growth rate (monthly) */
  userGrowthRate: number
  /** Session growth rate (monthly) */
  sessionGrowthRate: number
  /** Engagement growth rate */
  engagementGrowthRate: number
  /** Viral coefficient (users referred per user) */
  viralCoefficient: number
  /** Customer lifetime value */
  customerLifetimeValue: number
}

/**
 * Plan Social Data
 */
export interface PlanSocialData {
  /** Social sharing settings */
  sharing: SocialSharingSettings
  /** Community data */
  community: CommunityData
  /** Reviews and ratings */
  reviews: PlanReview[]
  /** Social proof metrics */
  socialProof: SocialProofMetrics
}

/**
 * Social Sharing Settings
 */
export interface SocialSharingSettings {
  /** Can be shared publicly */
  allowPublicSharing: boolean
  /** Share to social media platforms */
  socialMediaEnabled: boolean
  /** Generate share links */
  shareLinksEnabled: boolean
  /** Social media platforms enabled */
  platforms: SocialMediaPlatform[]
  /** Custom share message */
  shareMessage?: string
  /** Share analytics enabled */
  trackSharing: boolean
}

/**
 * Social Media Platform Configuration
 */
export interface SocialMediaPlatform {
  /** Platform name */
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'
  /** Platform enabled */
  enabled: boolean
  /** Custom message for this platform */
  customMessage?: string
  /** Platform-specific hashtags */
  hashtags: string[]
}

/**
 * Community Data
 */
export interface CommunityData {
  /** Community discussions */
  discussions: CommunityDiscussion[]
  /** User-generated content */
  userContent: UserGeneratedContent[]
  /** Community challenges */
  challenges: CommunityChallenge[]
  /** Community moderators */
  moderators: string[]
  /** Community guidelines */
  guidelines: string[]
}

/**
 * Community Discussion
 */
export interface CommunityDiscussion {
  /** Discussion ID */
  id: string
  /** Discussion title */
  title: string
  /** Discussion content */
  content: string
  /** Author user ID */
  authorId: string
  /** Author display name */
  authorName: string
  /** Creation timestamp */
  createdAt: Date
  /** Last updated */
  updatedAt: Date
  /** Number of replies */
  replyCount: number
  /** Number of likes */
  likeCount: number
  /** Discussion tags */
  tags: string[]
  /** Is discussion pinned */
  isPinned: boolean
  /** Is discussion locked */
  isLocked: boolean
}

/**
 * User Generated Content
 */
export interface UserGeneratedContent {
  /** Content ID */
  id: string
  /** Content type */
  type: 'video' | 'photo' | 'blog_post' | 'success_story' | 'modification'
  /** Content title */
  title: string
  /** Content description */
  description: string
  /** Content URL */
  contentUrl: string
  /** Author user ID */
  authorId: string
  /** Creation timestamp */
  createdAt: Date
  /** Content tags */
  tags: string[]
  /** Like count */
  likeCount: number
  /** View count */
  viewCount: number
  /** Is content featured */
  isFeatured: boolean
}

/**
 * Community Challenge
 */
export interface CommunityChallenge {
  /** Challenge ID */
  id: string
  /** Challenge name */
  name: string
  /** Challenge description */
  description: string
  /** Challenge type */
  type: 'completion' | 'consistency' | 'performance' | 'social'
  /** Start date */
  startDate: Date
  /** End date */
  endDate: Date
  /** Participant count */
  participantCount: number
  /** Challenge rules */
  rules: string[]
  /** Prizes/rewards */
  rewards: ChallengeReward[]
  /** Leaderboard */
  leaderboard: ChallengeLeaderboard[]
}

/**
 * Challenge Reward
 */
export interface ChallengeReward {
  /** Reward type */
  type: 'badge' | 'points' | 'discount' | 'physical' | 'recognition'
  /** Reward description */
  description: string
  /** Reward value */
  value?: number
  /** Reward criteria */
  criteria: string
  /** Is reward claimed */
  claimed: boolean
}

/**
 * Challenge Leaderboard Entry
 */
export interface ChallengeLeaderboard {
  /** Rank position */
  rank: number
  /** User ID */
  userId: string
  /** User display name */
  userName: string
  /** User score/progress */
  score: number
  /** Last update timestamp */
  lastUpdated: Date
}

/**
 * Plan Review
 */
export interface PlanReview {
  /** Review ID */
  id: string
  /** Reviewer user ID */
  reviewerId: string
  /** Reviewer name */
  reviewerName: string
  /** Review rating (1-5) */
  rating: number
  /** Review title */
  title?: string
  /** Review content */
  content: string
  /** Review timestamp */
  createdAt: Date
  /** Review helpful votes */
  helpfulVotes: number
  /** Review tags */
  tags: string[]
  /** Reviewer fitness level */
  reviewerFitnessLevel: FitnessLevel
  /** Plan completion percentage when reviewed */
  completionPercentage: number
  /** Review verification status */
  verified: boolean
}

/**
 * Social Proof Metrics
 */
export interface SocialProofMetrics {
  /** Total user count */
  totalUsers: number
  /** Success stories count */
  successStories: number
  /** Average goal achievement rate */
  goalAchievementRate: number
  /** Celebrity/influencer endorsements */
  endorsements: EndorsementData[]
  /** Expert/trainer validations */
  expertValidations: ExpertValidation[]
  /** Media mentions */
  mediaMentions: MediaMention[]
}

/**
 * Endorsement Data
 */
export interface EndorsementData {
  /** Endorser name */
  name: string
  /** Endorser title/role */
  title: string
  /** Endorsement text */
  endorsement: string
  /** Endorser photo URL */
  photoUrl?: string
  /** Endorser verification status */
  verified: boolean
  /** Endorsement date */
  date: Date
}

/**
 * Expert Validation
 */
export interface ExpertValidation {
  /** Expert name */
  expertName: string
  /** Expert credentials */
  credentials: string[]
  /** Expert organization */
  organization?: string
  /** Validation statement */
  validation: string
  /** Validation date */
  validatedAt: Date
  /** Expert rating */
  rating?: number
}

/**
 * Media Mention
 */
export interface MediaMention {
  /** Media outlet name */
  outlet: string
  /** Article/mention title */
  title: string
  /** Article URL */
  url?: string
  /** Publication date */
  publishedAt: Date
  /** Mention sentiment */
  sentiment: 'positive' | 'neutral' | 'negative'
  /** Reach/audience size */
  reach?: number
}

/**
 * Template-specific Properties
 */
export interface TemplateProperties {
  /** Template category */
  category: TemplateCategory
  /** Template subcategory */
  subcategory?: string
  /** Template difficulty level */
  templateDifficulty: FitnessLevel
  /** Customization options */
  customization: TemplateCustomization
  /** Template marketplace data */
  marketplace: TemplateMarketplaceData
  /** Template usage statistics */
  templateStats: TemplateUsageStats
}

/**
 * Template Categories
 */
export type TemplateCategory = 
  | 'strength_training'
  | 'cardio_fitness' 
  | 'weight_loss'
  | 'muscle_building'
  | 'athletic_performance'
  | 'rehabilitation'
  | 'senior_fitness'
  | 'youth_fitness'
  | 'functional_fitness'
  | 'bodyweight'
  | 'powerlifting'
  | 'crossfit'
  | 'yoga'
  | 'pilates'
  | 'martial_arts'
  | 'dance_fitness'
  | 'seasonal_programs'
  | 'challenge_programs'

/**
 * Template Customization Options
 */
export interface TemplateCustomization {
  /** Can customize duration */
  allowDurationChange: boolean
  /** Can customize frequency */
  allowFrequencyChange: boolean
  /** Can substitute exercises */
  allowExerciseSubstitution: boolean
  /** Can modify intensity */
  allowIntensityModification: boolean
  /** Can add/remove rest days */
  allowScheduleModification: boolean
  /** Customization difficulty level */
  customizationComplexity: 'simple' | 'intermediate' | 'advanced'
  /** Preset customization options */
  presetOptions: PresetCustomization[]
}

/**
 * Preset Customization Option
 */
export interface PresetCustomization {
  /** Option name */
  name: string
  /** Option description */
  description: string
  /** Changes applied by this option */
  changes: CustomizationChange[]
  /** Suitability criteria */
  suitableFor: SuitabilityCriteria
}

/**
 * Customization Change
 */
export interface CustomizationChange {
  /** Change type */
  type: 'duration' | 'frequency' | 'exercise' | 'intensity' | 'schedule'
  /** Target entity */
  target: string
  /** Change action */
  action: 'increase' | 'decrease' | 'replace' | 'add' | 'remove' | 'modify'
  /** Change value */
  value: any
  /** Change description */
  description: string
}

/**
 * Suitability Criteria
 */
export interface SuitabilityCriteria {
  /** Recommended fitness levels */
  fitnessLevels: FitnessLevel[]
  /** Time availability requirements */
  timeRequirements: TimeRequirement[]
  /** Equipment requirements */
  equipmentNeeded: string[]
  /** Physical limitations considerations */
  limitations: string[]
  /** Goal alignment */
  goals: string[]
}

/**
 * Time Requirement
 */
export interface TimeRequirement {
  /** Requirement type */
  type: 'total_duration' | 'session_length' | 'frequency' | 'flexibility'
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Unit of measurement */
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'sessions_per_week'
  /** Flexibility score (1-5) */
  flexibility: number
}

/**
 * Template Marketplace Data
 */
export interface TemplateMarketplaceData {
  /** Template pricing */
  pricing: TemplatePricing
  /** Template promotion data */
  promotions: TemplatePromotion[]
  /** Template bundle information */
  bundles: TemplateBundle[]
  /** Marketplace visibility */
  visibility: MarketplaceVisibility
  /** Content quality metrics */
  quality: ContentQualityMetrics
}

/**
 * Template Pricing
 */
export interface TemplatePricing {
  /** Is template free */
  isFree: boolean
  /** Base price */
  basePrice?: number
  /** Currency */
  currency?: string
  /** Pricing tiers */
  tiers: PricingTier[]
  /** Subscription options */
  subscriptions: SubscriptionOption[]
  /** Bulk pricing options */
  bulkPricing: BulkPricingOption[]
}

/**
 * Pricing Tier
 */
export interface PricingTier {
  /** Tier name */
  name: string
  /** Tier price */
  price: number
  /** What's included */
  includes: string[]
  /** Tier limitations */
  limitations: string[]
  /** Recommended for */
  recommendedFor: string[]
}

/**
 * Subscription Option
 */
export interface SubscriptionOption {
  /** Subscription type */
  type: 'monthly' | 'quarterly' | 'annual' | 'lifetime'
  /** Subscription price */
  price: number
  /** Savings compared to one-time purchase */
  savings?: number
  /** Subscription benefits */
  benefits: string[]
}

/**
 * Bulk Pricing Option
 */
export interface BulkPricingOption {
  /** Minimum quantity */
  minQuantity: number
  /** Price per unit at this quantity */
  pricePerUnit: number
  /** Discount percentage */
  discountPercent: number
  /** Target customer type */
  targetCustomer: 'gym' | 'trainer' | 'organization' | 'reseller'
}

/**
 * Template Promotion
 */
export interface TemplatePromotion {
  /** Promotion ID */
  id: string
  /** Promotion type */
  type: 'discount' | 'bundle' | 'free_trial' | 'upgrade' | 'seasonal'
  /** Promotion title */
  title: string
  /** Promotion description */
  description: string
  /** Discount value */
  discountValue?: number
  /** Discount type */
  discountType?: 'percentage' | 'fixed_amount'
  /** Promotion start date */
  startDate: Date
  /** Promotion end date */
  endDate: Date
  /** Promotion code */
  code?: string
  /** Maximum uses */
  maxUses?: number
  /** Current use count */
  currentUses: number
  /** Target audience */
  targetAudience: string[]
}

/**
 * Template Bundle
 */
export interface TemplateBundle {
  /** Bundle ID */
  id: string
  /** Bundle name */
  name: string
  /** Bundle description */
  description: string
  /** Included template IDs */
  templateIds: string[]
  /** Bundle price */
  price: number
  /** Individual total price */
  individualPrice: number
  /** Savings amount */
  savings: number
  /** Bundle theme/category */
  theme: string
  /** Bundle difficulty progression */
  difficultyProgression: boolean
}

/**
 * Marketplace Visibility
 */
export interface MarketplaceVisibility {
  /** Is featured on marketplace */
  featured: boolean
  /** Search visibility */
  searchVisible: boolean
  /** Category placement */
  categoryPlacement: number
  /** Geographic availability */
  geoAvailability: string[]
  /** Language availability */
  languages: string[]
  /** Subscription tier requirements */
  subscriptionRequirements: SubscriptionTier[]
}

/**
 * Content Quality Metrics
 */
export interface ContentQualityMetrics {
  /** Overall quality score */
  qualityScore: number
  /** Content completeness */
  completeness: number
  /** Accuracy rating */
  accuracy: number
  /** User engagement score */
  engagement: number
  /** Expert validation score */
  expertValidation: number
  /** Quality flags */
  qualityFlags: QualityFlag[]
}

/**
 * Quality Flag
 */
export interface QualityFlag {
  /** Flag type */
  type: 'high_quality' | 'verified' | 'popular' | 'trending' | 'editor_choice' | 'award_winner'
  /** Flag description */
  description: string
  /** Flag date awarded */
  awardedAt: Date
  /** Flag expiry date */
  expiresAt?: Date
}

/**
 * Template Usage Statistics
 */
export interface TemplateUsageStats {
  /** Total downloads/uses */
  totalUses: number
  /** Active users (last 30 days) */
  activeUsers: number
  /** Completion rate */
  completionRate: number
  /** User satisfaction rating */
  satisfactionRating: number
  /** Most common customizations */
  popularCustomizations: CustomizationStats[]
  /** Success rate metrics */
  successMetrics: TemplateSuccessMetrics
}

/**
 * Customization Statistics
 */
export interface CustomizationStats {
  /** Customization type */
  type: string
  /** Usage frequency */
  frequency: number
  /** Success rate of this customization */
  successRate: number
  /** User feedback on this customization */
  userFeedback: number
}

/**
 * Template Success Metrics
 */
export interface TemplateSuccessMetrics {
  /** Goal achievement rate */
  goalAchievementRate: number
  /** Average improvement metrics */
  avgImprovements: Record<string, number>
  /** User retention rate */
  retentionRate: number
  /** Referral rate */
  referralRate: number
  /** Success story count */
  successStoryCount: number
}

// ================================
// Plan Management Operations
// ================================

/**
 * Bulk Plan Operations
 */
export interface BulkPlanOperation {
  /** Operation type */
  operation: BulkOperationType
  /** Plan IDs to operate on */
  planIds: string[]
  /** Operation parameters */
  parameters: BulkOperationParameters
  /** Operation metadata */
  metadata: OperationMetadata
}

/**
 * Bulk Operation Types
 */
export type BulkOperationType = 
  | 'archive'
  | 'restore'
  | 'delete' 
  | 'export'
  | 'duplicate'
  | 'update_tags'
  | 'update_category'
  | 'change_ownership'
  | 'update_permissions'
  | 'validate'

/**
 * Bulk Operation Parameters
 */
export interface BulkOperationParameters {
  /** Archive/delete parameters */
  archive?: {
    reason: string
    preserveData: boolean
  }
  /** Export parameters */
  export?: {
    format: 'json' | 'csv' | 'pdf' | 'zip'
    includeStatistics: boolean
    includeUserData: boolean
  }
  /** Tag update parameters */
  updateTags?: {
    action: 'add' | 'remove' | 'replace'
    tags: string[]
  }
  /** Category update parameters */
  updateCategory?: {
    category: string
    subcategory?: string
  }
  /** Ownership change parameters */
  changeOwnership?: {
    newOwnerId: string
    transferType: 'full' | 'collaborative'
    notifyUsers: boolean
  }
  /** Permission update parameters */
  updatePermissions?: {
    permissions: Partial<PlanOwnership>
    inheritFromParent: boolean
  }
}

/**
 * Operation Metadata
 */
export interface OperationMetadata {
  /** Operation ID */
  operationId: string
  /** Initiated by user ID */
  initiatedBy: string
  /** Operation timestamp */
  timestamp: Date
  /** Operation reason/context */
  reason: string
  /** Expected duration */
  estimatedDuration?: number
  /** Operation priority */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** Rollback capability */
  canRollback: boolean
}

/**
 * Plan Search and Filter Configuration
 */
export interface PlanSearchFilters {
  /** Text search query */
  query?: string
  /** Search in specific fields */
  searchFields: SearchField[]
  /** Plan status filters */
  status: PlanManagementStatus[]
  /** Plan ownership filters */
  ownership: OwnershipFilter
  /** Date range filters */
  dateRange: DateRangeFilter
  /** Category and classification filters */
  classification: ClassificationFilter
  /** Performance filters */
  performance: PerformanceFilter
  /** Social and engagement filters */
  social: SocialFilter
  /** Advanced filters */
  advanced: AdvancedFilter
}

/**
 * Search Fields
 */
export type SearchField = 
  | 'name'
  | 'description'
  | 'tags'
  | 'creator'
  | 'exercises'
  | 'notes'
  | 'reviews'

/**
 * Ownership Filter
 */
export interface OwnershipFilter {
  /** Filter by owner */
  ownedBy?: 'me' | 'others' | 'organization' | 'public'
  /** Filter by creator */
  createdBy?: string[]
  /** Filter by sharing status */
  sharingStatus?: 'private' | 'shared' | 'public'
  /** Filter by permissions */
  permissions?: 'can_view' | 'can_edit' | 'can_share'
}

/**
 * Date Range Filter
 */
export interface DateRangeFilter {
  /** Creation date range */
  created?: DateRange
  /** Last updated date range */
  updated?: DateRange
  /** Last used date range */
  lastUsed?: DateRange
  /** Completion date range */
  completed?: DateRange
}

/**
 * Date Range
 */
export interface DateRange {
  /** Start date */
  from: Date
  /** End date */
  to: Date
  /** Relative date options */
  preset?: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_year' | 'custom'
}

/**
 * Classification Filter
 */
export interface ClassificationFilter {
  /** Fitness level targets */
  fitnessLevel: FitnessLevel[]
  /** Goal categories */
  goals: string[]
  /** Exercise types included */
  exerciseTypes: ExerciseType[]
  /** Equipment requirements */
  equipment: EquipmentFilter
  /** Plan duration ranges */
  duration: DurationFilter
  /** Template categories */
  templateCategories: TemplateCategory[]
}

/**
 * Equipment Filter
 */
export interface EquipmentFilter {
  /** Required equipment */
  required?: string[]
  /** Optional equipment */
  optional?: string[]
  /** No equipment needed */
  bodyweightOnly?: boolean
  /** Equipment categories */
  categories?: string[]
}

/**
 * Duration Filter
 */
export interface DurationFilter {
  /** Minimum duration in weeks */
  minWeeks?: number
  /** Maximum duration in weeks */
  maxWeeks?: number
  /** Sessions per week range */
  sessionsPerWeek?: {
    min: number
    max: number
  }
  /** Session duration range */
  sessionDuration?: {
    min: number
    max: number
  }
}

/**
 * Performance Filter
 */
export interface PerformanceFilter {
  /** Minimum completion rate */
  minCompletionRate?: number
  /** Minimum user rating */
  minRating?: number
  /** Minimum success rate */
  minSuccessRate?: number
  /** Usage volume thresholds */
  usageThresholds?: {
    minUsers: number
    minSessions: number
  }
  /** Quality metrics */
  quality?: {
    minQualityScore: number
    hasValidation: boolean
  }
}

/**
 * Social Filter
 */
export interface SocialFilter {
  /** Minimum social engagement */
  minEngagement?: {
    shares: number
    favorites: number
    reviews: number
  }
  /** Community features */
  community?: {
    hasDiscussions: boolean
    hasChallenges: boolean
    hasUserContent: boolean
  }
  /** Social proof requirements */
  socialProof?: {
    hasEndorsements: boolean
    hasExpertValidation: boolean
    hasMediaMentions: boolean
  }
}

/**
 * Advanced Filter
 */
export interface AdvancedFilter {
  /** Custom field filters */
  customFields?: Record<string, any>
  /** Compliance requirements */
  compliance?: {
    organizationCompliant: boolean
    safetyValidated: boolean
    medicalApproved: boolean
  }
  /** Version control filters */
  versioning?: {
    hasVersionHistory: boolean
    isLatestVersion: boolean
    hasActiveBranches: boolean
  }
  /** Marketplace filters */
  marketplace?: {
    isPaid: boolean
    isPromoted: boolean
    inBundle: boolean
  }
}

/**
 * Plan Search Results
 */
export interface PlanSearchResults {
  /** Matching plans */
  plans: DashboardWorkoutPlan[]
  /** Total count of matches */
  totalCount: number
  /** Search execution metadata */
  searchMetadata: SearchMetadata
  /** Faceted search results */
  facets: SearchFacets
  /** Search suggestions */
  suggestions: SearchSuggestion[]
}

/**
 * Search Metadata
 */
export interface SearchMetadata {
  /** Search execution time in milliseconds */
  executionTime: number
  /** Search query hash for caching */
  queryHash: string
  /** Search timestamp */
  timestamp: Date
  /** Result ranking algorithm used */
  rankingAlgorithm: string
  /** Search quality score */
  qualityScore: number
}

/**
 * Search Facets
 */
export interface SearchFacets {
  /** Status facets */
  status: FacetResult[]
  /** Category facets */
  categories: FacetResult[]
  /** Fitness level facets */
  fitnessLevels: FacetResult[]
  /** Duration facets */
  durations: FacetResult[]
  /** Rating facets */
  ratings: FacetResult[]
  /** Creator facets */
  creators: FacetResult[]
}

/**
 * Facet Result
 */
export interface FacetResult {
  /** Facet value */
  value: string
  /** Count of matching items */
  count: number
  /** Is this facet currently selected */
  selected: boolean
}

/**
 * Search Suggestion
 */
export interface SearchSuggestion {
  /** Suggestion text */
  text: string
  /** Suggestion type */
  type: 'query' | 'filter' | 'category' | 'creator'
  /** Suggestion confidence score */
  confidence: number
  /** Expected result count */
  expectedResults: number
}

// ================================
// Multi-Select and Bulk Operations UI Types
// ================================

/**
 * Multi-Select State Management
 */
export interface MultiSelectState {
  /** Currently selected plan IDs */
  selectedPlanIds: Set<string>
  /** Select all state */
  selectAllState: SelectAllState
  /** Available bulk actions */
  availableActions: BulkAction[]
  /** Bulk operation in progress */
  operationInProgress: boolean
  /** Current bulk operation */
  currentOperation?: BulkPlanOperation
  /** Operation progress */
  operationProgress?: OperationProgress
}

/**
 * Select All State
 */
export type SelectAllState = 'none' | 'partial' | 'all' | 'indeterminate'

/**
 * Bulk Action Configuration
 */
export interface BulkAction {
  /** Action identifier */
  id: BulkOperationType
  /** Display label */
  label: string
  /** Action description */
  description: string
  /** Action icon */
  icon: string
  /** Action color theme */
  color: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  /** Action requires confirmation */
  requiresConfirmation: boolean
  /** Confirmation message */
  confirmationMessage?: string
  /** Action is destructive */
  isDestructive: boolean
  /** Minimum selection count */
  minSelectionCount: number
  /** Maximum selection count */
  maxSelectionCount?: number
  /** Action availability predicate */
  isAvailable: (plans: DashboardWorkoutPlan[]) => boolean
  /** Action keyboard shortcut */
  shortcut?: string
}

/**
 * Operation Progress
 */
export interface OperationProgress {
  /** Current step */
  currentStep: number
  /** Total steps */
  totalSteps: number
  /** Progress percentage */
  percentage: number
  /** Current step description */
  stepDescription: string
  /** Processed items */
  processedItems: number
  /** Total items to process */
  totalItems: number
  /** Operation start time */
  startTime: Date
  /** Estimated completion time */
  estimatedCompletion?: Date
  /** Errors encountered */
  errors: OperationError[]
  /** Warnings encountered */
  warnings: OperationWarning[]
}

/**
 * Operation Error
 */
export interface OperationError {
  /** Item that caused the error */
  itemId: string
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Can error be retried */
  canRetry: boolean
  /** Suggested fix */
  suggestedFix?: string
}

/**
 * Operation Warning
 */
export interface OperationWarning {
  /** Item that triggered the warning */
  itemId: string
  /** Warning code */
  code: string
  /** Warning message */
  message: string
  /** Can warning be ignored */
  canIgnore: boolean
  /** Warning resolution */
  resolution?: string
}

// ================================
// Dashboard State Management Types
// ================================

/**
 * Plan Dashboard State
 */
export interface PlanDashboardState {
  /** UI state */
  ui: DashboardUIState
  /** Data state */
  data: DashboardDataState
  /** Filter and search state */
  filters: DashboardFilterState
  /** Multi-select state */
  multiSelect: MultiSelectState
  /** User preferences */
  preferences: DashboardPreferences
  /** Real-time updates */
  realtime: RealtimeState
  /** Performance monitoring */
  performance: PerformanceState
}

/**
 * Dashboard UI State
 */
export interface DashboardUIState {
  /** Current view mode */
  viewMode: DashboardViewMode
  /** Layout configuration */
  layout: DashboardLayout
  /** Loading states */
  loading: LoadingStates
  /** Error states */
  errors: ErrorStates
  /** Modal and dialog states */
  modals: ModalStates
  /** Notification states */
  notifications: NotificationState[]
}

/**
 * Dashboard View Modes
 */
export type DashboardViewMode = 
  | 'grid'      // Grid view with cards
  | 'list'      // List view with detailed rows
  | 'table'     // Table view with sortable columns
  | 'kanban'    // Kanban board by status
  | 'calendar'  // Calendar view with scheduled plans
  | 'analytics' // Analytics and charts view

/**
 * Dashboard Layout Configuration
 */
export interface DashboardLayout {
  /** Sidebar configuration */
  sidebar: SidebarConfig
  /** Main content area configuration */
  mainArea: MainAreaConfig
  /** Widget configurations */
  widgets: WidgetConfig[]
  /** Responsive breakpoints */
  breakpoints: ResponsiveBreakpoints
}

/**
 * Sidebar Configuration
 */
export interface SidebarConfig {
  /** Is sidebar visible */
  visible: boolean
  /** Is sidebar collapsed */
  collapsed: boolean
  /** Sidebar width */
  width: number
  /** Sidebar sections */
  sections: SidebarSection[]
  /** Sidebar position */
  position: 'left' | 'right'
}

/**
 * Sidebar Section
 */
export interface SidebarSection {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Section icon */
  icon?: string
  /** Is section expanded */
  expanded: boolean
  /** Section order */
  order: number
  /** Section content type */
  contentType: 'filters' | 'quick_actions' | 'statistics' | 'recent_plans' | 'favorites'
}

/**
 * Main Area Configuration
 */
export interface MainAreaConfig {
  /** Content padding */
  padding: string
  /** Show header */
  showHeader: boolean
  /** Header height */
  headerHeight: number
  /** Show footer */
  showFooter: boolean
  /** Content scroll behavior */
  scrollBehavior: 'auto' | 'smooth'
  /** Virtual scrolling enabled */
  virtualScrolling: boolean
}

/**
 * Widget Configuration
 */
export interface WidgetConfig {
  /** Widget identifier */
  id: string
  /** Widget type */
  type: WidgetType
  /** Widget position */
  position: WidgetPosition
  /** Widget size */
  size: WidgetSize
  /** Widget configuration */
  config: WidgetSpecificConfig
  /** Is widget visible */
  visible: boolean
  /** Widget refresh interval */
  refreshInterval?: number
}

/**
 * Widget Types
 */
export type WidgetType = 
  | 'plan_stats'
  | 'recent_activity'
  | 'progress_chart'
  | 'quick_actions'
  | 'favorite_plans'
  | 'upcoming_sessions'
  | 'achievements'
  | 'community_feed'
  | 'analytics_summary'

/**
 * Widget Size
 */
export interface WidgetSize {
  /** Width in grid units */
  width: number
  /** Height in grid units */
  height: number
  /** Minimum width */
  minWidth?: number
  /** Minimum height */
  minHeight?: number
  /** Is widget resizable */
  resizable: boolean
}

/**
 * Widget-Specific Configuration
 */
export type WidgetSpecificConfig = 
  | PlanStatsWidgetConfig
  | RecentActivityWidgetConfig
  | ProgressChartWidgetConfig
  | QuickActionsWidgetConfig

/**
 * Plan Stats Widget Configuration
 */
export interface PlanStatsWidgetConfig {
  /** Stats to display */
  statsToShow: PlanStatType[]
  /** Time period for stats */
  timePeriod: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all_time'
  /** Chart type */
  chartType: 'pie' | 'bar' | 'line' | 'donut' | 'gauge'
  /** Show percentages */
  showPercentages: boolean
}

/**
 * Plan Stat Types
 */
export type PlanStatType = 
  | 'total_plans'
  | 'active_plans'
  | 'completed_plans'
  | 'completion_rate'
  | 'avg_session_duration'
  | 'total_sessions'
  | 'streak_days'

/**
 * Recent Activity Widget Configuration
 */
export interface RecentActivityWidgetConfig {
  /** Number of activities to show */
  itemCount: number
  /** Activity types to include */
  activityTypes: ActivityType[]
  /** Show activity details */
  showDetails: boolean
  /** Auto-refresh enabled */
  autoRefresh: boolean
}

/**
 * Activity Types
 */
export type ActivityType = 
  | 'session_completed'
  | 'plan_started'
  | 'plan_completed'
  | 'achievement_earned'
  | 'plan_shared'
  | 'plan_modified'

/**
 * Progress Chart Widget Configuration
 */
export interface ProgressChartWidgetConfig {
  /** Metrics to track */
  metrics: ProgressMetric[]
  /** Chart style */
  chartStyle: 'line' | 'area' | 'bar' | 'scatter'
  /** Time range */
  timeRange: 'week' | 'month' | 'quarter' | 'year'
  /** Show trend lines */
  showTrend: boolean
  /** Compare periods */
  comparePeriods: boolean
}

/**
 * Progress Metrics
 */
export type ProgressMetric = 
  | 'weight'
  | 'body_fat'
  | 'muscle_mass'
  | 'strength_score'
  | 'endurance_score'
  | 'flexibility_score'
  | 'overall_fitness'

/**
 * Quick Actions Widget Configuration
 */
export interface QuickActionsWidgetConfig {
  /** Actions to show */
  actions: QuickActionType[]
  /** Action layout */
  layout: 'grid' | 'list' | 'compact'
  /** Show action labels */
  showLabels: boolean
  /** Custom actions */
  customActions: CustomQuickAction[]
}

/**
 * Quick Action Types
 */
export type QuickActionType = 
  | 'create_plan'
  | 'start_session'
  | 'view_progress'
  | 'browse_templates'
  | 'sync_data'
  | 'share_achievement'

/**
 * Custom Quick Action
 */
export interface CustomQuickAction {
  /** Action ID */
  id: string
  /** Action label */
  label: string
  /** Action icon */
  icon: string
  /** Action URL or handler */
  action: string | (() => void)
  /** Action color */
  color: string
  /** Action availability condition */
  condition?: () => boolean
}

/**
 * Responsive Breakpoints
 */
export interface ResponsiveBreakpoints {
  /** Mobile breakpoint */
  mobile: number
  /** Tablet breakpoint */
  tablet: number
  /** Desktop breakpoint */
  desktop: number
  /** Large desktop breakpoint */
  desktopLg: number
  /** Extra large screen breakpoint */
  desktopXl: number
}

/**
 * Dashboard Data State
 */
export interface DashboardDataState {
  /** Plans data */
  plans: PlanDataState
  /** Sessions data */
  sessions: SessionDataState
  /** Progress data */
  progress: ProgressDataState
  /** Analytics data */
  analytics: AnalyticsDataState
  /** Cache state */
  cache: CacheState
}

/**
 * Plan Data State
 */
export interface PlanDataState {
  /** All loaded plans */
  items: DashboardWorkoutPlan[]
  /** Plan loading state */
  loading: boolean
  /** Plan error state */
  error?: string
  /** Total plan count */
  totalCount: number
  /** Last fetch timestamp */
  lastFetch?: Date
  /** Data freshness score */
  freshnessScore: number
}

/**
 * Session Data State
 */
export interface SessionDataState {
  /** Recent sessions */
  recentSessions: WorkoutSession[]
  /** Active session */
  activeSession?: SessionExecution
  /** Sessions loading state */
  loading: boolean
  /** Sessions error state */
  error?: string
  /** Session statistics */
  statistics: SessionStatistics
}

/**
 * Session Statistics
 */
export interface SessionStatistics {
  /** Total sessions this period */
  totalSessions: number
  /** Completed sessions this period */
  completedSessions: number
  /** Average session duration */
  avgDuration: number
  /** Current streak days */
  streakDays: number
  /** Sessions by status */
  sessionsByStatus: Record<SessionStatus, number>
  /** Weekly session pattern */
  weeklyPattern: number[]
}

/**
 * Progress Data State
 */
export interface ProgressDataState {
  /** Progress measurements */
  measurements: ProgressMeasurement[]
  /** Achievement data */
  achievements: UserAchievement[]
  /** Progress trends */
  trends: ProgressTrend[]
  /** Progress goals */
  goals: ProgressGoal[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error?: string
}

/**
 * Progress Trend
 */
export interface ProgressTrend {
  /** Measurement type */
  type: MeasurementType
  /** Trend direction */
  direction: 'up' | 'down' | 'stable'
  /** Trend percentage */
  changePercent: number
  /** Trend period */
  period: 'week' | 'month' | 'quarter'
  /** Trend confidence */
  confidence: number
}

/**
 * Progress Goal
 */
export interface ProgressGoal {
  /** Goal ID */
  id: string
  /** Goal type */
  type: MeasurementType | 'performance' | 'consistency' | 'achievement'
  /** Goal description */
  description: string
  /** Target value */
  targetValue: number
  /** Current value */
  currentValue: number
  /** Goal unit */
  unit: string
  /** Target date */
  targetDate: Date
  /** Goal status */
  status: 'on_track' | 'behind' | 'achieved' | 'at_risk'
  /** Progress percentage */
  progressPercent: number
}

/**
 * Analytics Data State
 */
export interface AnalyticsDataState {
  /** Performance analytics */
  performance: PerformanceAnalytics
  /** Usage analytics */
  usage: UsageAnalytics
  /** Social analytics */
  social: SocialAnalytics
  /** Loading state */
  loading: boolean
  /** Error state */
  error?: string
  /** Last update timestamp */
  lastUpdate: Date
}

/**
 * Performance Analytics
 */
export interface PerformanceAnalytics {
  /** Overall performance score */
  overallScore: number
  /** Performance by category */
  categoryScores: Record<string, number>
  /** Performance trends */
  trends: PerformanceTrendData[]
  /** Performance benchmarks */
  benchmarks: PerformanceBenchmark[]
}

/**
 * Performance Trend Data
 */
export interface PerformanceTrendData {
  /** Date */
  date: Date
  /** Performance score */
  score: number
  /** Category breakdown */
  categoryBreakdown: Record<string, number>
}

/**
 * Performance Benchmark
 */
export interface PerformanceBenchmark {
  /** Benchmark name */
  name: string
  /** User's value */
  userValue: number
  /** Benchmark value */
  benchmarkValue: number
  /** Percentile ranking */
  percentile: number
  /** Comparison group */
  comparisonGroup: string
}

/**
 * Usage Analytics
 */
export interface UsageAnalytics {
  /** Daily usage patterns */
  dailyPatterns: UsagePattern[]
  /** Weekly usage patterns */
  weeklyPatterns: UsagePattern[]
  /** Monthly usage patterns */
  monthlyPatterns: UsagePattern[]
  /** Feature usage statistics */
  featureUsage: FeatureUsageStats[]
}

/**
 * Usage Pattern
 */
export interface UsagePattern {
  /** Period identifier */
  period: string
  /** Usage count */
  usage: number
  /** Duration in minutes */
  duration: number
  /** Activities performed */
  activities: string[]
}

/**
 * Feature Usage Statistics
 */
export interface FeatureUsageStats {
  /** Feature name */
  feature: string
  /** Usage count */
  usageCount: number
  /** Last used */
  lastUsed: Date
  /** Usage trend */
  trend: 'increasing' | 'decreasing' | 'stable'
  /** Feature satisfaction rating */
  satisfactionRating: number
}

/**
 * Social Analytics
 */
export interface SocialAnalytics {
  /** Social engagement metrics */
  engagement: SocialEngagementMetrics
  /** Community participation */
  participation: CommunityParticipation
  /** Social influence scores */
  influence: SocialInfluence
}

/**
 * Social Engagement Metrics
 */
export interface SocialEngagementMetrics {
  /** Plans shared */
  sharesCount: number
  /** Comments/reviews given */
  commentsCount: number
  /** Likes/favorites received */
  likesReceived: number
  /** Social connections */
  connectionsCount: number
  /** Engagement rate */
  engagementRate: number
}

/**
 * Community Participation
 */
export interface CommunityParticipation {
  /** Community discussions participated */
  discussionsParticipated: number
  /** Challenges joined */
  challengesJoined: number
  /** User content created */
  contentCreated: number
  /** Help/advice given */
  helpGiven: number
  /** Community reputation score */
  reputationScore: number
}

/**
 * Social Influence
 */
export interface SocialInfluence {
  /** Followers count */
  followersCount: number
  /** Following count */
  followingCount: number
  /** Influence score */
  influenceScore: number
  /** Viral coefficient */
  viralCoefficient: number
  /** Reach metrics */
  reach: ReachMetrics
}

/**
 * Reach Metrics
 */
export interface ReachMetrics {
  /** Direct reach */
  directReach: number
  /** Extended reach */
  extendedReach: number
  /** Viral reach */
  viralReach: number
  /** Geographic reach */
  geographicReach: string[]
}

/**
 * Cache State
 */
export interface CacheState {
  /** Cache entries */
  entries: CacheEntry[]
  /** Total cache size */
  totalSize: number
  /** Cache hit rate */
  hitRate: number
  /** Cache cleanup needed */
  needsCleanup: boolean
}

/**
 * Cache Entry
 */
export interface CacheEntry {
  /** Cache key */
  key: string
  /** Cached data */
  data: any
  /** Cache timestamp */
  timestamp: Date
  /** Expiry timestamp */
  expires: Date
  /** Access count */
  accessCount: number
  /** Entry size in bytes */
  size: number
}

/**
 * Dashboard Filter State
 */
export interface DashboardFilterState {
  /** Active filters */
  active: PlanSearchFilters
  /** Saved filter sets */
  saved: SavedFilterSet[]
  /** Filter history */
  history: FilterHistoryEntry[]
  /** Quick filter presets */
  quickFilters: QuickFilter[]
  /** Smart filter suggestions */
  suggestions: FilterSuggestion[]
}

/**
 * Saved Filter Set
 */
export interface SavedFilterSet {
  /** Filter set ID */
  id: string
  /** Filter set name */
  name: string
  /** Filter configuration */
  filters: PlanSearchFilters
  /** Is set global (shared) */
  isGlobal: boolean
  /** Creation timestamp */
  createdAt: Date
  /** Usage count */
  usageCount: number
  /** Last used timestamp */
  lastUsed: Date
}

/**
 * Filter History Entry
 */
export interface FilterHistoryEntry {
  /** History entry ID */
  id: string
  /** Filter configuration */
  filters: PlanSearchFilters
  /** Result count */
  resultCount: number
  /** Usage timestamp */
  timestamp: Date
  /** Execution time */
  executionTime: number
}

/**
 * Quick Filter
 */
export interface QuickFilter {
  /** Filter ID */
  id: string
  /** Filter label */
  label: string
  /** Filter description */
  description: string
  /** Filter configuration */
  filters: Partial<PlanSearchFilters>
  /** Filter icon */
  icon?: string
  /** Filter color */
  color?: string
  /** Is filter active */
  active: boolean
}

/**
 * Filter Suggestion
 */
export interface FilterSuggestion {
  /** Suggestion ID */
  id: string
  /** Suggestion type */
  type: 'similar_plans' | 'related_goals' | 'popular_filters' | 'personal_patterns'
  /** Suggestion label */
  label: string
  /** Suggestion description */
  description: string
  /** Filter to apply */
  filters: Partial<PlanSearchFilters>
  /** Suggestion confidence */
  confidence: number
  /** Expected improvement */
  expectedImprovement: string
}

/**
 * Dashboard User Preferences
 */
export interface DashboardPreferences {
  /** Default view mode */
  defaultViewMode: DashboardViewMode
  /** Plans per page */
  plansPerPage: number
  /** Auto-refresh enabled */
  autoRefresh: boolean
  /** Auto-refresh interval */
  autoRefreshInterval: number
  /** Notification preferences */
  notifications: DashboardNotificationPreferences
  /** Privacy preferences */
  privacy: DashboardPrivacyPreferences
  /** Accessibility preferences */
  accessibility: DashboardAccessibilityPreferences
  /** Performance preferences */
  performance: DashboardPerformancePreferences
}

/**
 * Dashboard Notification Preferences
 */
export interface DashboardNotificationPreferences {
  /** Show success notifications */
  showSuccess: boolean
  /** Show error notifications */
  showErrors: boolean
  /** Show warning notifications */
  showWarnings: boolean
  /** Show info notifications */
  showInfo: boolean
  /** Notification duration */
  duration: number
  /** Notification position */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Sound notifications */
  soundEnabled: boolean
}

/**
 * Dashboard Privacy Preferences
 */
export interface DashboardPrivacyPreferences {
  /** Share usage analytics */
  shareAnalytics: boolean
  /** Share performance data */
  sharePerformance: boolean
  /** Allow plan recommendations */
  allowRecommendations: boolean
  /** Show in leaderboards */
  showInLeaderboards: boolean
  /** Allow social features */
  allowSocialFeatures: boolean
}

/**
 * Dashboard Accessibility Preferences
 */
export interface DashboardAccessibilityPreferences {
  /** High contrast mode */
  highContrast: boolean
  /** Large text */
  largeText: boolean
  /** Reduced motion */
  reducedMotion: boolean
  /** Screen reader support */
  screenReader: boolean
  /** Keyboard navigation */
  keyboardNavigation: boolean
  /** Focus indicators */
  focusIndicators: boolean
}

/**
 * Dashboard Performance Preferences
 */
export interface DashboardPerformancePreferences {
  /** Enable virtual scrolling */
  virtualScrolling: boolean
  /** Image lazy loading */
  lazyLoading: boolean
  /** Prefetch data */
  prefetchData: boolean
  /** Cache duration */
  cacheDuration: number
  /** Optimize for slow connections */
  optimizeForSlowConnection: boolean
}

/**
 * Loading States
 */
export interface LoadingStates {
  /** Plans loading */
  plans: boolean
  /** Sessions loading */
  sessions: boolean
  /** Analytics loading */
  analytics: boolean
  /** Bulk operation loading */
  bulkOperation: boolean
  /** Export loading */
  export: boolean
  /** Search loading */
  search: boolean
}

/**
 * Error States
 */
export interface ErrorStates {
  /** Plans error */
  plans?: string
  /** Sessions error */
  sessions?: string
  /** Analytics error */
  analytics?: string
  /** Bulk operation error */
  bulkOperation?: string
  /** Export error */
  export?: string
  /** Search error */
  search?: string
}

/**
 * Modal States
 */
export interface ModalStates {
  /** Plan details modal */
  planDetails: ModalState<PlanDetailsModalProps>
  /** Bulk operation confirmation modal */
  bulkConfirmation: ModalState<BulkConfirmationModalProps>
  /** Filter editor modal */
  filterEditor: ModalState<FilterEditorModalProps>
  /** Export options modal */
  exportOptions: ModalState<ExportOptionsModalProps>
  /** Share plan modal */
  sharePlan: ModalState<SharePlanModalProps>
}

/**
 * Modal State
 */
export interface ModalState<T = any> {
  /** Is modal open */
  isOpen: boolean
  /** Modal props */
  props?: T
  /** Modal loading state */
  loading: boolean
  /** Modal error state */
  error?: string
}

/**
 * Plan Details Modal Props
 */
export interface PlanDetailsModalProps {
  /** Plan ID */
  planId: string
  /** Initial tab */
  initialTab?: 'overview' | 'sessions' | 'progress' | 'analytics' | 'settings'
  /** Read-only mode */
  readOnly?: boolean
}

/**
 * Bulk Confirmation Modal Props
 */
export interface BulkConfirmationModalProps {
  /** Operation to confirm */
  operation: BulkPlanOperation
  /** Affected plans */
  affectedPlans: DashboardWorkoutPlan[]
  /** Confirmation callback */
  onConfirm: () => void
  /** Cancellation callback */
  onCancel: () => void
}

/**
 * Filter Editor Modal Props
 */
export interface FilterEditorModalProps {
  /** Current filters */
  currentFilters: PlanSearchFilters
  /** Available filter options */
  filterOptions: FilterOptionSet
  /** Save callback */
  onSave: (filters: PlanSearchFilters) => void
  /** Cancel callback */
  onCancel: () => void
}

/**
 * Filter Option Set
 */
export interface FilterOptionSet {
  /** Available statuses */
  statuses: SelectOption[]
  /** Available categories */
  categories: SelectOption[]
  /** Available fitness levels */
  fitnessLevels: SelectOption[]
  /** Available creators */
  creators: SelectOption[]
  /** Available equipment */
  equipment: SelectOption[]
}

/**
 * Select Option
 */
export interface SelectOption {
  /** Option value */
  value: string
  /** Option label */
  label: string
  /** Option description */
  description?: string
  /** Option count */
  count?: number
  /** Option disabled state */
  disabled?: boolean
}

/**
 * Export Options Modal Props
 */
export interface ExportOptionsModalProps {
  /** Plans to export */
  planIds: string[]
  /** Export callback */
  onExport: (options: ExportOptions) => void
  /** Cancel callback */
  onCancel: () => void
}

/**
 * Export Options
 */
export interface ExportOptions {
  /** Export format */
  format: 'json' | 'csv' | 'pdf' | 'xlsx'
  /** Include statistics */
  includeStatistics: boolean
  /** Include user data */
  includeUserData: boolean
  /** Include social data */
  includeSocialData: boolean
  /** Date range */
  dateRange?: DateRange
  /** Compression enabled */
  compress: boolean
}

/**
 * Share Plan Modal Props
 */
export interface SharePlanModalProps {
  /** Plan to share */
  plan: DashboardWorkoutPlan
  /** Share callback */
  onShare: (options: ShareOptions) => void
  /** Cancel callback */
  onCancel: () => void
}

/**
 * Share Options
 */
export interface ShareOptions {
  /** Share method */
  method: 'link' | 'email' | 'social' | 'copy'
  /** Share permissions */
  permissions: 'view' | 'copy' | 'edit'
  /** Share message */
  message?: string
  /** Expiration date */
  expiresAt?: Date
  /** Require registration */
  requireRegistration: boolean
}

/**
 * Notification State
 */
export interface NotificationState {
  /** Notification ID */
  id: string
  /** Notification type */
  type: 'success' | 'error' | 'warning' | 'info'
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Show timestamp */
  timestamp: Date
  /** Is notification dismissible */
  dismissible: boolean
  /** Auto-dismiss timeout */
  timeout?: number
  /** Notification actions */
  actions?: NotificationAction[]
}

/**
 * Notification Action
 */
export interface NotificationAction {
  /** Action label */
  label: string
  /** Action callback */
  action: () => void
  /** Action style */
  style?: 'primary' | 'secondary' | 'danger'
}

/**
 * Real-time State
 */
export interface RealtimeState {
  /** Connection status */
  connected: boolean
  /** Last ping timestamp */
  lastPing?: Date
  /** Pending updates */
  pendingUpdates: RealtimeUpdate[]
  /** Update subscriptions */
  subscriptions: RealtimeSubscription[]
  /** Connection quality */
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
}

/**
 * Real-time Update
 */
export interface RealtimeUpdate {
  /** Update ID */
  id: string
  /** Update type */
  type: 'plan_updated' | 'session_completed' | 'achievement_earned' | 'plan_shared'
  /** Update data */
  data: any
  /** Update timestamp */
  timestamp: Date
  /** Update priority */
  priority: 'low' | 'normal' | 'high'
  /** Update processed */
  processed: boolean
}

/**
 * Real-time Subscription
 */
export interface RealtimeSubscription {
  /** Subscription ID */
  id: string
  /** Subscription type */
  type: 'user_plans' | 'shared_plans' | 'community_activity'
  /** Subscription parameters */
  parameters: any
  /** Subscription active */
  active: boolean
  /** Last update received */
  lastUpdate?: Date
}

/**
 * Performance State
 */
export interface PerformanceState {
  /** Performance metrics */
  metrics: PerformanceMetrics
  /** Performance alerts */
  alerts: PerformanceAlert[]
  /** Performance optimizations */
  optimizations: PerformanceOptimization[]
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /** Page load time */
  pageLoadTime: number
  /** Initial render time */
  initialRenderTime: number
  /** Time to interactive */
  timeToInteractive: number
  /** First contentful paint */
  firstContentfulPaint: number
  /** Largest contentful paint */
  largestContentfulPaint: number
  /** Memory usage */
  memoryUsage: number
  /** CPU usage */
  cpuUsage: number
}

/**
 * Performance Alert
 */
export interface PerformanceAlert {
  /** Alert ID */
  id: string
  /** Alert type */
  type: 'slow_loading' | 'high_memory' | 'poor_connection' | 'cache_miss'
  /** Alert message */
  message: string
  /** Alert severity */
  severity: 'low' | 'medium' | 'high'
  /** Alert timestamp */
  timestamp: Date
  /** Alert acknowledged */
  acknowledged: boolean
}

/**
 * Performance Optimization
 */
export interface PerformanceOptimization {
  /** Optimization ID */
  id: string
  /** Optimization type */
  type: 'image_compression' | 'code_splitting' | 'caching' | 'prefetching'
  /** Optimization description */
  description: string
  /** Performance impact */
  impact: number
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high'
  /** Optimization enabled */
  enabled: boolean
}

// Export all types
export type {
  DashboardWorkoutPlan,
  PlanManagement,
  PlanSearchFilters,
  MultiSelectState,
  PlanDashboardState,
  BulkPlanOperation,
  PlanSearchResults
}