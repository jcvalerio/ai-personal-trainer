/**
 * Template Browser Type Definitions
 * Phase 3: Community template marketplace, template categories and tagging,
 * rating and review system, and template sharing and discovery
 */

import { FitnessLevel, SubscriptionTier, UserProfile } from './index'
import { 
  WorkoutPlan, 
  ExerciseType,
  WorkoutStatus,
  Equipment
} from './workouts'
import { 
  DashboardWorkoutPlan, 
  TemplateCategory,
  TemplateProperties 
} from './plan-dashboard'

// ================================
// Template Marketplace Core Types
// ================================

/**
 * Template Marketplace Entry
 */
export interface TemplateMarketplaceEntry extends DashboardWorkoutPlan {
  /** Marketplace-specific metadata */
  marketplace: MarketplaceMetadata
  /** Discovery and search properties */
  discovery: DiscoveryMetadata
  /** Template usage analytics */
  analytics: TemplateAnalytics
  /** Community engagement data */
  community: CommunityEngagement
  /** Quality and validation data */
  quality: TemplateQuality
  /** Monetization data */
  monetization: MonetizationData
}

/**
 * Marketplace Metadata
 */
export interface MarketplaceMetadata {
  /** Marketplace ID */
  marketplaceId: string
  /** Template submission date */
  submittedAt: Date
  /** Template approval status */
  approvalStatus: ApprovalStatus
  /** Reviewer information */
  reviewer?: ReviewerInfo
  /** Marketplace category */
  category: MarketplaceCategory
  /** Template visibility */
  visibility: TemplateVisibility
  /** Featured status */
  featured: FeaturedStatus
  /** Template maturity level */
  maturity: TemplateMaturity
  /** Content rating */
  contentRating: ContentRating
}

/**
 * Template Approval Status
 */
export type ApprovalStatus = 
  | 'pending'      // Awaiting review
  | 'under_review' // Currently being reviewed
  | 'approved'     // Approved for marketplace
  | 'rejected'     // Rejected with feedback
  | 'suspended'    // Temporarily suspended
  | 'archived'     // Archived/removed

/**
 * Reviewer Information
 */
export interface ReviewerInfo {
  /** Reviewer ID */
  reviewerId: string
  /** Reviewer name */
  reviewerName: string
  /** Review date */
  reviewDate: Date
  /** Review notes */
  notes?: string
  /** Review score */
  score: number
}

/**
 * Marketplace Category (extends base template categories)
 */
export interface MarketplaceCategory {
  /** Primary category */
  primary: TemplateCategory
  /** Secondary categories */
  secondary: TemplateCategory[]
  /** Niche specializations */
  specializations: string[]
  /** Target demographics */
  demographics: TargetDemographic[]
}

/**
 * Target Demographics
 */
export interface TargetDemographic {
  /** Demographic type */
  type: DemographicType
  /** Demographic values */
  values: string[]
  /** Primary target indicator */
  isPrimary: boolean
}

/**
 * Demographic Types
 */
export type DemographicType = 
  | 'age_group'        // Age ranges
  | 'fitness_level'    // Beginner, intermediate, advanced
  | 'gender'           // Male, female, any
  | 'goals'            // Weight loss, muscle gain, etc.
  | 'time_commitment'  // Available time per week
  | 'equipment_access' // Home, gym, minimal equipment
  | 'physical_limitations' // Injuries, mobility issues
  | 'lifestyle'        // Busy professional, student, etc.

/**
 * Template Visibility Settings
 */
export interface TemplateVisibility {
  /** Public visibility */
  isPublic: boolean
  /** Search visibility */
  searchable: boolean
  /** Featured in categories */
  featuredInCategories: boolean
  /** Geographic restrictions */
  geoRestrictions: GeographicRestriction[]
  /** Subscription requirements */
  subscriptionRequirements: SubscriptionRequirement[]
  /** Age restrictions */
  ageRestrictions: AgeRestriction
}

/**
 * Geographic Restriction
 */
export interface GeographicRestriction {
  /** Restriction type */
  type: 'include' | 'exclude'
  /** Country codes */
  countries: string[]
  /** Region codes */
  regions?: string[]
  /** Reason for restriction */
  reason: string
}

/**
 * Subscription Requirement
 */
export interface SubscriptionRequirement {
  /** Required subscription tier */
  tier: SubscriptionTier
  /** Grace period for expired subscriptions */
  gracePeriodDays?: number
  /** Trial access allowed */
  allowTrial: boolean
}

/**
 * Age Restriction
 */
export interface AgeRestriction {
  /** Minimum age */
  minimumAge?: number
  /** Maximum age */
  maximumAge?: number
  /** Parental consent required */
  parentalConsentRequired: boolean
  /** Age verification required */
  ageVerificationRequired: boolean
}

/**
 * Featured Status
 */
export interface FeaturedStatus {
  /** Is template featured */
  isFeatured: boolean
  /** Featured level */
  featuredLevel: FeaturedLevel
  /** Featured start date */
  featuredFrom?: Date
  /** Featured end date */
  featuredUntil?: Date
  /** Featured in sections */
  featuredSections: FeaturedSection[]
  /** Featured priority */
  featuredPriority: number
}

/**
 * Featured Levels
 */
export type FeaturedLevel = 
  | 'hero'         // Top-level hero section
  | 'premium'      // Premium featured section
  | 'category'     // Featured in category
  | 'trending'     // Trending section
  | 'recommended'  // Recommended for you

/**
 * Featured Sections
 */
export type FeaturedSection = 
  | 'homepage'
  | 'category_page'
  | 'search_results'
  | 'user_recommendations'
  | 'trending_now'
  | 'editor_picks'
  | 'new_releases'

/**
 * Template Maturity Level
 */
export type TemplateMaturity = 
  | 'alpha'        // Early development
  | 'beta'         // Testing phase
  | 'stable'       // Stable release
  | 'mature'       // Well-established
  | 'legacy'       // Older but maintained

/**
 * Content Rating
 */
export interface ContentRating {
  /** Overall rating */
  overall: ContentRatingLevel
  /** Difficulty rating */
  difficulty: ContentRatingLevel
  /** Intensity rating */
  intensity: ContentRatingLevel
  /** Safety rating */
  safety: ContentRatingLevel
  /** Content warnings */
  warnings: ContentWarning[]
}

/**
 * Content Rating Levels
 */
export type ContentRatingLevel = 'G' | 'PG' | 'PG13' | 'R' | 'NR'

/**
 * Content Warning
 */
export interface ContentWarning {
  /** Warning type */
  type: WarningType
  /** Warning description */
  description: string
  /** Severity level */
  severity: 'low' | 'medium' | 'high'
}

/**
 * Warning Types
 */
export type WarningType = 
  | 'high_intensity'
  | 'injury_risk'
  | 'medical_conditions'
  | 'equipment_required'
  | 'space_requirements'
  | 'noise_level'
  | 'explicit_language'
  | 'cultural_sensitivity'

/**
 * Discovery Metadata
 */
export interface DiscoveryMetadata {
  /** Search keywords */
  searchKeywords: string[]
  /** Template tags */
  tags: TemplateTag[]
  /** SEO metadata */
  seo: SEOMetadata
  /** Social media metadata */
  socialMedia: SocialMediaMetadata
  /** Related templates */
  relatedTemplates: RelatedTemplate[]
  /** Alternative templates */
  alternatives: AlternativeTemplate[]
}

/**
 * Template Tag
 */
export interface TemplateTag {
  /** Tag name */
  name: string
  /** Tag category */
  category: TagCategory
  /** Tag weight/importance */
  weight: number
  /** Tag popularity score */
  popularityScore: number
  /** Is tag verified */
  verified: boolean
}

/**
 * Tag Categories
 */
export type TagCategory = 
  | 'equipment'        // Equipment-related tags
  | 'body_part'       // Target body parts
  | 'goal'            // Fitness goals
  | 'style'           // Workout style
  | 'duration'        // Time-related tags
  | 'difficulty'      // Difficulty indicators
  | 'location'        // Where to perform
  | 'special'         // Special considerations
  | 'seasonal'        // Seasonal themes
  | 'trending'        // Trending topics

/**
 * SEO Metadata
 */
export interface SEOMetadata {
  /** Page title */
  title: string
  /** Meta description */
  description: string
  /** Keywords */
  keywords: string[]
  /** Canonical URL */
  canonicalUrl?: string
  /** Open Graph data */
  openGraph: OpenGraphData
  /** Twitter Card data */
  twitterCard: TwitterCardData
  /** JSON-LD structured data */
  structuredData: StructuredData
}

/**
 * Open Graph Data
 */
export interface OpenGraphData {
  /** OG title */
  title: string
  /** OG description */
  description: string
  /** OG image */
  image: string
  /** OG type */
  type: 'website' | 'article' | 'video' | 'product'
  /** OG URL */
  url: string
}

/**
 * Twitter Card Data
 */
export interface TwitterCardData {
  /** Card type */
  card: 'summary' | 'summary_large_image' | 'app' | 'player'
  /** Card title */
  title: string
  /** Card description */
  description: string
  /** Card image */
  image: string
  /** Creator Twitter handle */
  creator?: string
}

/**
 * Structured Data (JSON-LD)
 */
export interface StructuredData {
  /** Schema.org type */
  type: string
  /** Structured data object */
  data: Record<string, any>
}

/**
 * Social Media Metadata
 */
export interface SocialMediaMetadata {
  /** Shareable title */
  shareTitle: string
  /** Share description */
  shareDescription: string
  /** Share image */
  shareImage: string
  /** Hashtags */
  hashtags: string[]
  /** Platform-specific content */
  platformContent: PlatformContent[]
}

/**
 * Platform Content
 */
export interface PlatformContent {
  /** Platform name */
  platform: SocialPlatform
  /** Platform-specific title */
  title: string
  /** Platform-specific description */
  description: string
  /** Platform-specific image */
  image?: string
  /** Platform-specific hashtags */
  hashtags: string[]
}

/**
 * Social Platforms
 */
export type SocialPlatform = 
  | 'facebook'
  | 'twitter'
  | 'instagram' 
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'reddit'

/**
 * Related Template
 */
export interface RelatedTemplate {
  /** Template ID */
  templateId: string
  /** Relationship type */
  relationship: RelationshipType
  /** Relationship score */
  score: number
  /** Relationship description */
  description?: string
}

/**
 * Relationship Types
 */
export type RelationshipType = 
  | 'similar'          // Similar content/style
  | 'prerequisite'     // Required before this template
  | 'follow_up'        // Natural progression after
  | 'complementary'    // Works well together
  | 'alternative'      // Different approach to same goal
  | 'same_creator'     // From same creator
  | 'same_series'      // Part of same series

/**
 * Alternative Template
 */
export interface AlternativeTemplate {
  /** Template ID */
  templateId: string
  /** Alternative type */
  alternativeType: AlternativeType
  /** Comparison metrics */
  comparison: TemplateComparison
  /** Why it's an alternative */
  reason: string
}

/**
 * Alternative Types
 */
export type AlternativeType = 
  | 'easier'           // Easier version
  | 'harder'           // More challenging version
  | 'shorter'          // Shorter duration
  | 'longer'           // Extended version
  | 'no_equipment'     // Bodyweight version
  | 'gym_version'      // Gym equipment version
  | 'home_version'     // Home-friendly version
  | 'different_style'  // Different approach

/**
 * Template Comparison
 */
export interface TemplateComparison {
  /** Difficulty comparison */
  difficulty: ComparisonMetric
  /** Duration comparison */
  duration: ComparisonMetric
  /** Equipment comparison */
  equipment: ComparisonMetric
  /** Intensity comparison */
  intensity: ComparisonMetric
  /** Effectiveness comparison */
  effectiveness: ComparisonMetric
}

/**
 * Comparison Metric
 */
export interface ComparisonMetric {
  /** Comparison value (-1 to 1, where 0 is equal) */
  value: number
  /** Comparison description */
  description: string
  /** Confidence score */
  confidence: number
}

// ================================
// Template Analytics
// ================================

/**
 * Template Analytics
 */
export interface TemplateAnalytics {
  /** Usage statistics */
  usage: TemplateUsageStats
  /** Performance metrics */
  performance: TemplatePerformanceStats
  /** Engagement analytics */
  engagement: TemplateEngagementStats
  /** Conversion analytics */
  conversion: TemplateConversionStats
  /** Geographic analytics */
  geographic: GeographicStats
  /** Temporal analytics */
  temporal: TemporalStats
}

/**
 * Template Usage Statistics
 */
export interface TemplateUsageStats {
  /** Total views */
  totalViews: number
  /** Unique viewers */
  uniqueViewers: number
  /** View duration statistics */
  viewDuration: DurationStats
  /** Downloads/uses */
  totalDownloads: number
  /** Active users */
  activeUsers: number
  /** Return user rate */
  returnUserRate: number
  /** Completion statistics */
  completion: CompletionStats
}

/**
 * Duration Statistics
 */
export interface DurationStats {
  /** Average duration */
  average: number
  /** Median duration */
  median: number
  /** Duration distribution */
  distribution: DurationDistribution[]
  /** Bounce rate (very short views) */
  bounceRate: number
}

/**
 * Duration Distribution
 */
export interface DurationDistribution {
  /** Duration range (seconds) */
  range: { min: number; max: number }
  /** Percentage of views in this range */
  percentage: number
  /** View count in this range */
  count: number
}

/**
 * Completion Statistics
 */
export interface CompletionStats {
  /** Overall completion rate */
  overallRate: number
  /** Completion by week */
  weeklyRates: number[]
  /** Drop-off points */
  dropOffPoints: DropOffPoint[]
  /** Average completion time */
  avgCompletionTime: number
}

/**
 * Drop-off Point Analysis
 */
export interface DropOffPoint {
  /** Point in template (week/session number) */
  point: number
  /** Drop-off percentage */
  dropOffPercentage: number
  /** Reasons for drop-off */
  reasons: DropOffReason[]
}

/**
 * Drop-off Reasons
 */
export interface DropOffReason {
  /** Reason category */
  category: 'difficulty' | 'time_commitment' | 'injury' | 'boredom' | 'life_change' | 'other'
  /** Reason description */
  description: string
  /** Frequency of this reason */
  frequency: number
}

/**
 * Template Performance Statistics
 */
export interface TemplatePerformanceStats {
  /** User satisfaction metrics */
  satisfaction: SatisfactionMetrics
  /** Effectiveness metrics */
  effectiveness: EffectivenessMetrics
  /** Goal achievement rates */
  goalAchievement: GoalAchievementStats
  /** Improvement metrics */
  improvements: ImprovementMetrics
}

/**
 * Satisfaction Metrics
 */
export interface SatisfactionMetrics {
  /** Overall satisfaction rating */
  overallRating: number
  /** Rating distribution */
  ratingDistribution: RatingDistribution
  /** Net Promoter Score */
  netPromoterScore: number
  /** User sentiment analysis */
  sentiment: SentimentAnalysis
}

/**
 * Rating Distribution
 */
export interface RatingDistribution {
  /** 1-star ratings */
  oneStar: number
  /** 2-star ratings */
  twoStar: number
  /** 3-star ratings */
  threeStar: number
  /** 4-star ratings */
  fourStar: number
  /** 5-star ratings */
  fiveStar: number
}

/**
 * Sentiment Analysis
 */
export interface SentimentAnalysis {
  /** Positive sentiment percentage */
  positive: number
  /** Neutral sentiment percentage */
  neutral: number
  /** Negative sentiment percentage */
  negative: number
  /** Common positive themes */
  positiveThemes: string[]
  /** Common negative themes */
  negativeThemes: string[]
}

/**
 * Effectiveness Metrics
 */
export interface EffectivenessMetrics {
  /** Goal achievement rate */
  goalAchievementRate: number
  /** Time to see results (days) */
  timeToResults: number
  /** Adherence rate */
  adherenceRate: number
  /** Modification frequency */
  modificationRate: number
}

/**
 * Goal Achievement Statistics
 */
export interface GoalAchievementStats {
  /** Achievement by goal type */
  byGoalType: Record<string, GoalAchievementMetric>
  /** Average time to achieve goals */
  avgTimeToAchieve: number
  /** Success factors */
  successFactors: SuccessFactor[]
  /** Failure factors */
  failureFactors: FailureFactor[]
}

/**
 * Goal Achievement Metric
 */
export interface GoalAchievementMetric {
  /** Goal type */
  goalType: string
  /** Achievement rate */
  achievementRate: number
  /** Average time to achieve */
  avgTime: number
  /** User satisfaction for this goal */
  satisfaction: number
}

/**
 * Success/Failure Factors
 */
export interface SuccessFactor {
  /** Factor description */
  factor: string
  /** Correlation with success */
  correlation: number
  /** Statistical significance */
  significance: number
}

export interface FailureFactor {
  /** Factor description */
  factor: string
  /** Correlation with failure */
  correlation: number
  /** Statistical significance */
  significance: number
}

/**
 * Improvement Metrics
 */
export interface ImprovementMetrics {
  /** Fitness improvements */
  fitness: FitnessImprovements
  /** Strength improvements */
  strength: StrengthImprovements
  /** Endurance improvements */
  endurance: EnduranceImprovements
  /** Body composition changes */
  bodyComposition: BodyCompositionChanges
}

/**
 * Fitness Improvements
 */
export interface FitnessImprovements {
  /** Overall fitness score improvement */
  overallImprovement: number
  /** Improvement by category */
  categoryImprovements: Record<string, number>
  /** Improvement timeline */
  timeline: ImprovementTimelinePoint[]
}

/**
 * Strength/Endurance Improvements
 */
export interface StrengthImprovements {
  /** Strength gains by exercise */
  byExercise: Record<string, number>
  /** Overall strength improvement */
  overall: number
  /** One-rep max improvements */
  oneRepMaxGains: Record<string, number>
}

export interface EnduranceImprovements {
  /** Cardiovascular improvements */
  cardiovascular: number
  /** Muscular endurance improvements */
  muscular: number
  /** Endurance by activity type */
  byActivity: Record<string, number>
}

/**
 * Body Composition Changes
 */
export interface BodyCompositionChanges {
  /** Weight changes */
  weight: BodyMetricChange
  /** Body fat changes */
  bodyFat: BodyMetricChange
  /** Muscle mass changes */
  muscleMass: BodyMetricChange
  /** Circumference measurements */
  circumferences: Record<string, BodyMetricChange>
}

/**
 * Body Metric Change
 */
export interface BodyMetricChange {
  /** Average change */
  averageChange: number
  /** Percentage of users with positive change */
  positiveChangeRate: number
  /** Change distribution */
  distribution: ChangeDistribution[]
}

/**
 * Change Distribution
 */
export interface ChangeDistribution {
  /** Change range */
  range: { min: number; max: number }
  /** Percentage of users in this range */
  percentage: number
  /** User count */
  count: number
}

/**
 * Improvement Timeline Point
 */
export interface ImprovementTimelinePoint {
  /** Time point (weeks from start) */
  week: number
  /** Improvement value */
  improvement: number
  /** User count at this point */
  userCount: number
  /** Confidence interval */
  confidenceInterval: { lower: number; upper: number }
}

/**
 * Template Engagement Statistics
 */
export interface TemplateEngagementStats {
  /** Social engagement */
  social: SocialEngagementStats
  /** Community engagement */
  community: CommunityEngagementStats
  /** User-generated content */
  userContent: UserContentStats
  /** Sharing statistics */
  sharing: SharingStats
}

/**
 * Social Engagement Statistics
 */
export interface SocialEngagementStats {
  /** Likes/favorites */
  likes: number
  /** Shares */
  shares: number
  /** Comments */
  comments: number
  /** Social media mentions */
  mentions: number
  /** Engagement rate */
  engagementRate: number
  /** Viral coefficient */
  viralCoefficient: number
}

/**
 * Community Engagement Statistics
 */
export interface CommunityEngagementStats {
  /** Forum discussions */
  discussions: number
  /** Questions asked */
  questions: number
  /** Answers provided */
  answers: number
  /** Community challenges */
  challenges: number
  /** User groups formed */
  userGroups: number
}

/**
 * User-Generated Content Statistics
 */
export interface UserContentStats {
  /** Progress photos */
  progressPhotos: number
  /** Success stories */
  successStories: number
  /** Video testimonials */
  videoTestimonials: number
  /** Blog posts/articles */
  blogPosts: number
  /** Modifications/variations */
  modifications: number
}

/**
 * Sharing Statistics
 */
export interface SharingStats {
  /** Shares by platform */
  byPlatform: Record<SocialPlatform, number>
  /** Share-to-view ratio */
  shareToViewRatio: number
  /** Viral sharing chains */
  viralChains: ViralChain[]
  /** Share effectiveness */
  shareEffectiveness: ShareEffectiveness
}

/**
 * Viral Chain
 */
export interface ViralChain {
  /** Chain ID */
  id: string
  /** Chain length */
  length: number
  /** Total reach */
  totalReach: number
  /** Conversion rate */
  conversionRate: number
  /** Chain start date */
  startDate: Date
}

/**
 * Share Effectiveness
 */
export interface ShareEffectiveness {
  /** Clicks per share */
  clicksPerShare: number
  /** Conversions per share */
  conversionsPerShare: number
  /** Revenue per share */
  revenuePerShare: number
  /** Most effective platforms */
  topPlatforms: string[]
}

/**
 * Template Conversion Statistics
 */
export interface TemplateConversionStats {
  /** View-to-download conversion */
  viewToDownload: ConversionFunnel
  /** Free-to-paid conversion */
  freeToPaid: ConversionFunnel
  /** Trial-to-subscription conversion */
  trialToSubscription: ConversionFunnel
  /** Revenue metrics */
  revenue: RevenueMetrics
}

/**
 * Conversion Funnel
 */
export interface ConversionFunnel {
  /** Funnel stages */
  stages: ConversionStage[]
  /** Overall conversion rate */
  overallRate: number
  /** Conversion by user segment */
  bySegment: Record<string, number>
  /** Conversion timeline */
  timeline: ConversionTimelinePoint[]
}

/**
 * Conversion Stage
 */
export interface ConversionStage {
  /** Stage name */
  name: string
  /** Users entering stage */
  usersEntered: number
  /** Users completing stage */
  usersCompleted: number
  /** Conversion rate for this stage */
  conversionRate: number
  /** Average time in stage */
  avgTimeInStage: number
}

/**
 * Conversion Timeline Point
 */
export interface ConversionTimelinePoint {
  /** Date */
  date: Date
  /** Conversion rate at this date */
  conversionRate: number
  /** Volume at this date */
  volume: number
}

/**
 * Revenue Metrics
 */
export interface RevenueMetrics {
  /** Total revenue */
  totalRevenue: number
  /** Revenue per user */
  revenuePerUser: number
  /** Revenue per download */
  revenuePerDownload: number
  /** Revenue trends */
  trends: RevenueTrendPoint[]
  /** Revenue by source */
  bySource: Record<string, number>
}

/**
 * Revenue Trend Point
 */
export interface RevenueTrendPoint {
  /** Date */
  date: Date
  /** Revenue amount */
  revenue: number
  /** User count */
  users: number
  /** Average order value */
  averageOrderValue: number
}

/**
 * Geographic Statistics
 */
export interface GeographicStats {
  /** Usage by country */
  byCountry: Record<string, GeographicMetric>
  /** Usage by region */
  byRegion: Record<string, GeographicMetric>
  /** Top performing locations */
  topLocations: GeographicPerformance[]
  /** Global reach metrics */
  globalReach: GlobalReachMetrics
}

/**
 * Geographic Metric
 */
export interface GeographicMetric {
  /** User count */
  users: number
  /** Download count */
  downloads: number
  /** Completion rate */
  completionRate: number
  /** Revenue */
  revenue: number
  /** User rating */
  rating: number
}

/**
 * Geographic Performance
 */
export interface GeographicPerformance {
  /** Location name */
  location: string
  /** Performance score */
  score: number
  /** Key metrics */
  metrics: GeographicMetric
  /** Growth rate */
  growthRate: number
}

/**
 * Global Reach Metrics
 */
export interface GlobalReachMetrics {
  /** Total countries */
  countriesReached: number
  /** Market penetration by region */
  marketPenetration: Record<string, number>
  /** Localization effectiveness */
  localizationEffectiveness: Record<string, number>
  /** Cultural adaptation scores */
  culturalAdaptation: Record<string, number>
}

/**
 * Temporal Statistics
 */
export interface TemporalStats {
  /** Seasonal patterns */
  seasonalPatterns: SeasonalPattern[]
  /** Weekly patterns */
  weeklyPatterns: WeeklyPattern
  /** Daily patterns */
  dailyPatterns: DailyPattern
  /** Growth trends */
  growthTrends: GrowthTrend[]
}

/**
 * Seasonal Pattern
 */
export interface SeasonalPattern {
  /** Season */
  season: 'spring' | 'summer' | 'fall' | 'winter'
  /** Usage multiplier */
  usageMultiplier: number
  /** Popular features */
  popularFeatures: string[]
  /** Completion rate */
  completionRate: number
  /** User satisfaction */
  satisfaction: number
}

/**
 * Weekly Pattern
 */
export interface WeeklyPattern {
  /** Usage by day of week */
  byDayOfWeek: Record<string, number>
  /** Peak usage days */
  peakDays: string[]
  /** Weekend vs weekday patterns */
  weekendVsWeekday: { weekend: number; weekday: number }
}

/**
 * Daily Pattern
 */
export interface DailyPattern {
  /** Usage by hour */
  byHour: Record<number, number>
  /** Peak hours */
  peakHours: number[]
  /** Timezone considerations */
  timezoneDistribution: Record<string, number>
}

/**
 * Growth Trend
 */
export interface GrowthTrend {
  /** Time period */
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  /** Data points */
  dataPoints: GrowthDataPoint[]
  /** Growth rate */
  growthRate: number
  /** Trend direction */
  direction: 'up' | 'down' | 'stable'
}

/**
 * Growth Data Point
 */
export interface GrowthDataPoint {
  /** Date */
  date: Date
  /** Value */
  value: number
  /** Growth percentage from previous period */
  growthPercent: number
}

// ================================
// Community Engagement
// ================================

/**
 * Community Engagement Data
 */
export interface CommunityEngagement {
  /** Reviews and ratings */
  reviews: ReviewSystem
  /** Community discussions */
  discussions: DiscussionSystem
  /** User-generated content */
  userContent: UserGeneratedContentSystem
  /** Social features */
  social: SocialFeatureSystem
  /** Gamification elements */
  gamification: GamificationSystem
}

/**
 * Review System
 */
export interface ReviewSystem {
  /** Overall rating */
  overallRating: number
  /** Total review count */
  totalReviews: number
  /** Rating breakdown */
  ratingBreakdown: RatingBreakdown
  /** Review highlights */
  highlights: ReviewHighlight[]
  /** Recent reviews */
  recentReviews: TemplateReview[]
  /** Verified reviews */
  verifiedReviews: TemplateReview[]
  /** Review moderation */
  moderation: ReviewModeration
}

/**
 * Rating Breakdown
 */
export interface RatingBreakdown {
  /** 5-star reviews */
  fiveStars: ReviewCount
  /** 4-star reviews */
  fourStars: ReviewCount
  /** 3-star reviews */
  threeStars: ReviewCount
  /** 2-star reviews */
  twoStars: ReviewCount
  /** 1-star reviews */
  oneStar: ReviewCount
}

/**
 * Review Count
 */
export interface ReviewCount {
  /** Number of reviews */
  count: number
  /** Percentage of total */
  percentage: number
}

/**
 * Review Highlight
 */
export interface ReviewHighlight {
  /** Highlight type */
  type: 'most_helpful' | 'most_recent' | 'most_detailed' | 'verified_user'
  /** Review excerpt */
  excerpt: string
  /** Full review ID */
  reviewId: string
  /** Highlight reason */
  reason: string
}

/**
 * Template Review
 */
export interface TemplateReview {
  /** Review ID */
  id: string
  /** Template ID */
  templateId: string
  /** Reviewer information */
  reviewer: ReviewerProfile
  /** Review rating (1-5) */
  rating: number
  /** Review title */
  title?: string
  /** Review content */
  content: string
  /** Review pros */
  pros: string[]
  /** Review cons */
  cons: string[]
  /** Review tags */
  tags: string[]
  /** Review submission date */
  submittedAt: Date
  /** Review verification */
  verification: ReviewVerification
  /** Review helpfulness */
  helpfulness: ReviewHelpfulness
  /** Review responses */
  responses: ReviewResponse[]
  /** Review media */
  media: ReviewMedia[]
}

/**
 * Reviewer Profile
 */
export interface ReviewerProfile {
  /** Reviewer ID */
  id: string
  /** Display name */
  displayName: string
  /** Avatar URL */
  avatarUrl?: string
  /** Reviewer credibility */
  credibility: ReviewerCredibility
  /** Reviewer badges */
  badges: ReviewerBadge[]
  /** Review history */
  reviewHistory: ReviewHistorySummary
}

/**
 * Reviewer Credibility
 */
export interface ReviewerCredibility {
  /** Credibility score (0-100) */
  score: number
  /** Verification status */
  verified: boolean
  /** Experience level */
  experienceLevel: 'novice' | 'intermediate' | 'expert'
  /** Specializations */
  specializations: string[]
  /** Trust factors */
  trustFactors: TrustFactor[]
}

/**
 * Trust Factor
 */
export interface TrustFactor {
  /** Factor type */
  type: 'verified_purchase' | 'completed_template' | 'expert_status' | 'community_member'
  /** Factor description */
  description: string
  /** Factor weight */
  weight: number
}

/**
 * Reviewer Badge
 */
export interface ReviewerBadge {
  /** Badge type */
  type: 'verified_user' | 'expert_reviewer' | 'top_contributor' | 'early_adopter'
  /** Badge name */
  name: string
  /** Badge description */
  description: string
  /** Badge icon */
  icon: string
  /** Badge earned date */
  earnedAt: Date
}

/**
 * Review History Summary
 */
export interface ReviewHistorySummary {
  /** Total reviews written */
  totalReviews: number
  /** Average rating given */
  averageRating: number
  /** Review helpfulness score */
  helpfulnessScore: number
  /** Reviews by category */
  byCategory: Record<string, number>
}

/**
 * Review Verification
 */
export interface ReviewVerification {
  /** Is review verified */
  isVerified: boolean
  /** Verification method */
  verificationMethod: VerificationMethod
  /** Verification date */
  verificationDate?: Date
  /** Verification details */
  details: VerificationDetails
}

/**
 * Verification Method
 */
export type VerificationMethod = 
  | 'purchase_verified'    // Verified through purchase
  | 'usage_verified'       // Verified through app usage
  | 'photo_verified'       // Verified through photo evidence
  | 'video_verified'       // Verified through video evidence
  | 'manual_verified'      // Manually verified by staff
  | 'community_verified'   // Verified by community

/**
 * Verification Details
 */
export interface VerificationDetails {
  /** Verification evidence */
  evidence: string[]
  /** Verification confidence */
  confidence: number
  /** Verifier information */
  verifier?: string
  /** Verification notes */
  notes?: string
}

/**
 * Review Helpfulness
 */
export interface ReviewHelpfulness {
  /** Helpful votes */
  helpfulVotes: number
  /** Not helpful votes */
  notHelpfulVotes: number
  /** Helpfulness ratio */
  helpfulnessRatio: number
  /** Helpfulness rank */
  rank: number
}

/**
 * Review Response
 */
export interface ReviewResponse {
  /** Response ID */
  id: string
  /** Responder type */
  responderType: 'template_creator' | 'community_member' | 'moderator' | 'expert'
  /** Responder ID */
  responderId: string
  /** Responder name */
  responderName: string
  /** Response content */
  content: string
  /** Response date */
  responseDate: Date
  /** Response helpfulness */
  helpfulness: ResponseHelpfulness
}

/**
 * Response Helpfulness
 */
export interface ResponseHelpfulness {
  /** Helpful votes */
  helpfulVotes: number
  /** Not helpful votes */
  notHelpfulVotes: number
}

/**
 * Review Media
 */
export interface ReviewMedia {
  /** Media ID */
  id: string
  /** Media type */
  type: 'image' | 'video' | 'document'
  /** Media URL */
  url: string
  /** Media thumbnail */
  thumbnail?: string
  /** Media caption */
  caption?: string
  /** Media upload date */
  uploadDate: Date
}

/**
 * Review Moderation
 */
export interface ReviewModeration {
  /** Moderation enabled */
  enabled: boolean
  /** Moderation rules */
  rules: ModerationRule[]
  /** Flagged reviews */
  flaggedReviews: FlaggedReview[]
  /** Moderation statistics */
  statistics: ModerationStats
}

/**
 * Moderation Rule
 */
export interface ModerationRule {
  /** Rule ID */
  id: string
  /** Rule type */
  type: 'spam_detection' | 'profanity_filter' | 'fake_review' | 'off_topic'
  /** Rule description */
  description: string
  /** Auto-action */
  autoAction: 'flag' | 'hide' | 'delete' | 'review'
  /** Rule active */
  active: boolean
}

/**
 * Flagged Review
 */
export interface FlaggedReview {
  /** Review ID */
  reviewId: string
  /** Flag reason */
  flagReason: string
  /** Flag count */
  flagCount: number
  /** Moderation status */
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'edited'
  /** Moderator notes */
  moderatorNotes?: string
}

/**
 * Moderation Statistics
 */
export interface ModerationStats {
  /** Total reviews moderated */
  totalModerated: number
  /** Auto-moderated reviews */
  autoModerated: number
  /** Manually moderated reviews */
  manuallyModerated: number
  /** False positive rate */
  falsePositiveRate: number
  /** Average moderation time */
  avgModerationTime: number
}

/**
 * Discussion System
 */
export interface DiscussionSystem {
  /** Discussion forums */
  forums: DiscussionForum[]
  /** Recent discussions */
  recentDiscussions: Discussion[]
  /** Popular discussions */
  popularDiscussions: Discussion[]
  /** Discussion statistics */
  statistics: DiscussionStats
}

/**
 * Discussion Forum
 */
export interface DiscussionForum {
  /** Forum ID */
  id: string
  /** Forum name */
  name: string
  /** Forum description */
  description: string
  /** Forum category */
  category: ForumCategory
  /** Forum moderators */
  moderators: string[]
  /** Discussion count */
  discussionCount: number
  /** Forum rules */
  rules: string[]
}

/**
 * Forum Categories
 */
export type ForumCategory = 
  | 'general_discussion'
  | 'questions_answers'
  | 'success_stories'
  | 'modifications'
  | 'troubleshooting'
  | 'feedback'
  | 'challenges'

/**
 * Discussion
 */
export interface Discussion {
  /** Discussion ID */
  id: string
  /** Discussion title */
  title: string
  /** Discussion content */
  content: string
  /** Discussion author */
  author: DiscussionAuthor
  /** Discussion category */
  category: ForumCategory
  /** Discussion tags */
  tags: string[]
  /** Creation date */
  createdAt: Date
  /** Last activity date */
  lastActivity: Date
  /** Reply count */
  replyCount: number
  /** View count */
  viewCount: number
  /** Like count */
  likeCount: number
  /** Discussion status */
  status: DiscussionStatus
  /** Is discussion pinned */
  isPinned: boolean
  /** Is discussion locked */
  isLocked: boolean
}

/**
 * Discussion Author
 */
export interface DiscussionAuthor {
  /** Author ID */
  id: string
  /** Display name */
  displayName: string
  /** Avatar URL */
  avatarUrl?: string
  /** Author badges */
  badges: string[]
  /** Author reputation */
  reputation: number
}

/**
 * Discussion Status
 */
export type DiscussionStatus = 
  | 'active'
  | 'resolved' 
  | 'closed'
  | 'archived'

/**
 * Discussion Statistics
 */
export interface DiscussionStats {
  /** Total discussions */
  totalDiscussions: number
  /** Active discussions */
  activeDiscussions: number
  /** Total replies */
  totalReplies: number
  /** Average replies per discussion */
  avgRepliesPerDiscussion: number
  /** Most active users */
  mostActiveUsers: ActiveUser[]
}

/**
 * Active User
 */
export interface ActiveUser {
  /** User ID */
  userId: string
  /** Display name */
  displayName: string
  /** Activity score */
  activityScore: number
  /** Contribution type */
  contributionType: 'discussions' | 'replies' | 'helpful_answers'
}

/**
 * User Generated Content System
 */
export interface UserGeneratedContentSystem {
  /** Content categories */
  categories: ContentCategory[]
  /** Featured content */
  featuredContent: UserContent[]
  /** Recent content */
  recentContent: UserContent[]
  /** Content statistics */
  statistics: ContentStats
}

/**
 * Content Category
 */
export interface ContentCategory {
  /** Category ID */
  id: string
  /** Category name */
  name: string
  /** Category description */
  description: string
  /** Content count */
  contentCount: number
  /** Category icon */
  icon?: string
}

/**
 * User Content
 */
export interface UserContent {
  /** Content ID */
  id: string
  /** Content type */
  type: UserContentType
  /** Content title */
  title: string
  /** Content description */
  description?: string
  /** Content creator */
  creator: ContentCreator
  /** Content URL */
  contentUrl: string
  /** Thumbnail URL */
  thumbnailUrl?: string
  /** Creation date */
  createdAt: Date
  /** View count */
  viewCount: number
  /** Like count */
  likeCount: number
  /** Share count */
  shareCount: number
  /** Content tags */
  tags: string[]
  /** Content status */
  status: ContentStatus
}

/**
 * User Content Types
 */
export type UserContentType = 
  | 'progress_photo'
  | 'success_story'
  | 'workout_video'
  | 'tutorial'
  | 'modification'
  | 'blog_post'
  | 'testimonial'

/**
 * Content Creator
 */
export interface ContentCreator {
  /** Creator ID */
  id: string
  /** Display name */
  displayName: string
  /** Avatar URL */
  avatarUrl?: string
  /** Creator badges */
  badges: string[]
  /** Follower count */
  followers: number
  /** Content count */
  contentCount: number
}

/**
 * Content Status
 */
export type ContentStatus = 
  | 'published'
  | 'draft'
  | 'under_review'
  | 'flagged'
  | 'archived'

/**
 * Content Statistics
 */
export interface ContentStats {
  /** Total content pieces */
  totalContent: number
  /** Content by type */
  byType: Record<UserContentType, number>
  /** Most popular content */
  mostPopular: UserContent[]
  /** Content growth rate */
  growthRate: number
}

/**
 * Social Feature System
 */
export interface SocialFeatureSystem {
  /** Social features available */
  features: SocialFeature[]
  /** Social statistics */
  statistics: SocialStats
  /** Leaderboards */
  leaderboards: Leaderboard[]
  /** Social challenges */
  challenges: SocialChallenge[]
}

/**
 * Social Feature
 */
export interface SocialFeature {
  /** Feature ID */
  id: string
  /** Feature name */
  name: string
  /** Feature description */
  description: string
  /** Feature enabled */
  enabled: boolean
  /** Usage statistics */
  usage: FeatureUsage
}

/**
 * Feature Usage
 */
export interface FeatureUsage {
  /** Total uses */
  totalUses: number
  /** Active users */
  activeUsers: number
  /** Engagement rate */
  engagementRate: number
}

/**
 * Social Statistics
 */
export interface SocialStats {
  /** Total social interactions */
  totalInteractions: number
  /** Social engagement rate */
  engagementRate: number
  /** Most used social features */
  topFeatures: string[]
  /** Social network effects */
  networkEffects: NetworkEffect[]
}

/**
 * Network Effect
 */
export interface NetworkEffect {
  /** Effect type */
  type: 'viral_sharing' | 'friend_recommendations' | 'group_challenges'
  /** Effect strength */
  strength: number
  /** User reach */
  reach: number
}

/**
 * Leaderboard
 */
export interface Leaderboard {
  /** Leaderboard ID */
  id: string
  /** Leaderboard name */
  name: string
  /** Leaderboard type */
  type: LeaderboardType
  /** Time period */
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time'
  /** Top entries */
  topEntries: LeaderboardEntry[]
  /** Leaderboard rules */
  rules: string[]
}

/**
 * Leaderboard Types
 */
export type LeaderboardType = 
  | 'completion_rate'
  | 'streak_days'
  | 'total_workouts'
  | 'community_contributions'
  | 'goal_achievements'

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  /** Rank position */
  rank: number
  /** User ID */
  userId: string
  /** Display name */
  displayName: string
  /** Avatar URL */
  avatarUrl?: string
  /** Score */
  score: number
  /** Badge/achievement */
  badge?: string
}

/**
 * Social Challenge
 */
export interface SocialChallenge {
  /** Challenge ID */
  id: string
  /** Challenge name */
  name: string
  /** Challenge description */
  description: string
  /** Challenge type */
  type: ChallengeType
  /** Start date */
  startDate: Date
  /** End date */
  endDate: Date
  /** Participant count */
  participants: number
  /** Challenge rules */
  rules: string[]
  /** Challenge rewards */
  rewards: ChallengeReward[]
}

/**
 * Challenge Types
 */
export type ChallengeType = 
  | 'completion_challenge'
  | 'consistency_challenge'
  | 'team_challenge'
  | 'milestone_challenge'
  | 'creative_challenge'

/**
 * Challenge Reward
 */
export interface ChallengeReward {
  /** Reward type */
  type: 'badge' | 'points' | 'discount' | 'feature_unlock'
  /** Reward description */
  description: string
  /** Reward value */
  value?: number | string
  /** Reward criteria */
  criteria: string
}

/**
 * Gamification System
 */
export interface GamificationSystem {
  /** Achievement system */
  achievements: AchievementSystem
  /** Point system */
  points: PointSystem
  /** Badge system */
  badges: BadgeSystem
  /** Progress tracking */
  progress: ProgressTrackingSystem
}

/**
 * Achievement System
 */
export interface AchievementSystem {
  /** Available achievements */
  availableAchievements: Achievement[]
  /** Recent achievements */
  recentAchievements: UserAchievementRecord[]
  /** Achievement statistics */
  statistics: AchievementStats
}

/**
 * Achievement
 */
export interface Achievement {
  /** Achievement ID */
  id: string
  /** Achievement name */
  name: string
  /** Achievement description */
  description: string
  /** Achievement icon */
  icon: string
  /** Achievement rarity */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  /** Achievement criteria */
  criteria: AchievementCriteria
  /** Achievement points */
  points: number
  /** Unlock rate */
  unlockRate: number
}

/**
 * Achievement Criteria
 */
export interface AchievementCriteria {
  /** Criteria type */
  type: 'completion' | 'consistency' | 'performance' | 'social' | 'milestone'
  /** Criteria parameters */
  parameters: Record<string, any>
  /** Criteria description */
  description: string
}

/**
 * User Achievement Record
 */
export interface UserAchievementRecord {
  /** User ID */
  userId: string
  /** Achievement ID */
  achievementId: string
  /** Achievement date */
  achievedAt: Date
  /** Achievement progress */
  progress: number
  /** Achievement shared */
  shared: boolean
}

/**
 * Achievement Statistics
 */
export interface AchievementStats {
  /** Total achievements */
  totalAchievements: number
  /** Achievements earned */
  achievementsEarned: number
  /** Completion rate */
  completionRate: number
  /** Rarest achievement earned */
  rarestAchievement?: Achievement
}

/**
 * Point System
 */
export interface PointSystem {
  /** Point earning rules */
  earningRules: PointRule[]
  /** Point spending options */
  spendingOptions: PointReward[]
  /** User point balance */
  userBalance: number
  /** Point history */
  pointHistory: PointTransaction[]
}

/**
 * Point Rule
 */
export interface PointRule {
  /** Rule ID */
  id: string
  /** Action that earns points */
  action: string
  /** Points earned */
  points: number
  /** Daily/weekly limits */
  limits: PointLimit[]
}

/**
 * Point Limit
 */
export interface PointLimit {
  /** Limit type */
  type: 'daily' | 'weekly' | 'monthly'
  /** Maximum points */
  maxPoints: number
  /** Current earned */
  currentEarned: number
}

/**
 * Point Reward
 */
export interface PointReward {
  /** Reward ID */
  id: string
  /** Reward name */
  name: string
  /** Reward description */
  description: string
  /** Point cost */
  cost: number
  /** Reward type */
  type: 'discount' | 'feature' | 'cosmetic' | 'content'
  /** Availability */
  available: boolean
}

/**
 * Point Transaction
 */
export interface PointTransaction {
  /** Transaction ID */
  id: string
  /** Transaction type */
  type: 'earned' | 'spent' | 'bonus' | 'penalty'
  /** Point amount */
  amount: number
  /** Transaction reason */
  reason: string
  /** Transaction date */
  date: Date
  /** Balance after transaction */
  balanceAfter: number
}

/**
 * Badge System
 */
export interface BadgeSystem {
  /** Available badges */
  availableBadges: Badge[]
  /** User badges */
  userBadges: UserBadge[]
  /** Badge statistics */
  statistics: BadgeStats
}

/**
 * Badge
 */
export interface Badge {
  /** Badge ID */
  id: string
  /** Badge name */
  name: string
  /** Badge description */
  description: string
  /** Badge icon */
  icon: string
  /** Badge color */
  color: string
  /** Badge rarity */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  /** Badge criteria */
  criteria: string
  /** Unlock percentage */
  unlockPercentage: number
}

/**
 * User Badge
 */
export interface UserBadge {
  /** Badge ID */
  badgeId: string
  /** Date earned */
  earnedAt: Date
  /** Badge displayed publicly */
  displayed: boolean
  /** Badge sharing status */
  shared: boolean
}

/**
 * Badge Statistics
 */
export interface BadgeStats {
  /** Total badges available */
  totalBadges: number
  /** Badges earned */
  badgesEarned: number
  /** Badge completion rate */
  completionRate: number
  /** Rarest badges */
  rarestBadges: Badge[]
}

/**
 * Progress Tracking System
 */
export interface ProgressTrackingSystem {
  /** Progress milestones */
  milestones: ProgressMilestone[]
  /** Progress statistics */
  statistics: ProgressStats
  /** Progress visualization */
  visualization: ProgressVisualization
}

/**
 * Progress Milestone
 */
export interface ProgressMilestone {
  /** Milestone ID */
  id: string
  /** Milestone name */
  name: string
  /** Milestone description */
  description: string
  /** Progress required */
  progressRequired: number
  /** Current progress */
  currentProgress: number
  /** Milestone reward */
  reward?: string
  /** Completion date */
  completedAt?: Date
}

/**
 * Progress Statistics
 */
export interface ProgressStats {
  /** Overall progress percentage */
  overallProgress: number
  /** Progress by category */
  progressByCategory: Record<string, number>
  /** Recent improvements */
  recentImprovements: ProgressImprovement[]
  /** Progress trend */
  trend: 'improving' | 'stable' | 'declining'
}

/**
 * Progress Improvement
 */
export interface ProgressImprovement {
  /** Improvement metric */
  metric: string
  /** Improvement amount */
  improvement: number
  /** Improvement date */
  date: Date
  /** Improvement description */
  description: string
}

/**
 * Progress Visualization
 */
export interface ProgressVisualization {
  /** Chart type */
  chartType: 'line' | 'bar' | 'pie' | 'radar'
  /** Chart data */
  chartData: ChartDataPoint[]
  /** Chart configuration */
  chartConfig: ChartConfig
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  /** X-axis value */
  x: any
  /** Y-axis value */
  y: number
  /** Data label */
  label?: string
  /** Data color */
  color?: string
}

/**
 * Chart Configuration
 */
export interface ChartConfig {
  /** Chart title */
  title: string
  /** X-axis label */
  xAxisLabel: string
  /** Y-axis label */
  yAxisLabel: string
  /** Show legend */
  showLegend: boolean
  /** Chart colors */
  colors: string[]
}

// ================================
// Template Quality and Validation
// ================================

/**
 * Template Quality Assessment
 */
export interface TemplateQuality {
  /** Overall quality score */
  overallScore: number
  /** Quality dimensions */
  dimensions: QualityDimension[]
  /** Quality certifications */
  certifications: QualityCertification[]
  /** Quality issues */
  issues: QualityIssue[]
  /** Quality improvements */
  improvements: QualityImprovement[]
}

/**
 * Quality Dimension
 */
export interface QualityDimension {
  /** Dimension name */
  dimension: QualityDimensionType
  /** Dimension score */
  score: number
  /** Dimension weight */
  weight: number
  /** Dimension assessment */
  assessment: QualityAssessment
}

/**
 * Quality Dimension Types
 */
export type QualityDimensionType = 
  | 'content_accuracy'
  | 'exercise_safety'
  | 'progression_logic'
  | 'user_experience'
  | 'completeness'
  | 'clarity'
  | 'originality'
  | 'effectiveness'

/**
 * Quality Assessment
 */
export interface QualityAssessment {
  /** Assessment method */
  method: 'automated' | 'expert_review' | 'user_feedback' | 'peer_review'
  /** Assessor information */
  assessor?: AssessorInfo
  /** Assessment date */
  date: Date
  /** Assessment notes */
  notes: string
  /** Assessment confidence */
  confidence: number
}

/**
 * Assessor Information
 */
export interface AssessorInfo {
  /** Assessor ID */
  id: string
  /** Assessor name */
  name: string
  /** Assessor type */
  type: 'expert' | 'peer' | 'algorithm'
  /** Assessor credentials */
  credentials: string[]
  /** Assessor rating */
  rating: number
}

/**
 * Quality Certification
 */
export interface QualityCertification {
  /** Certification ID */
  id: string
  /** Certification name */
  name: string
  /** Certifying body */
  certifyingBody: string
  /** Certification level */
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  /** Issue date */
  issuedDate: Date
  /** Expiry date */
  expiryDate?: Date
  /** Certification criteria */
  criteria: string[]
  /** Certification benefits */
  benefits: string[]
}

/**
 * Quality Issue
 */
export interface QualityIssue {
  /** Issue ID */
  id: string
  /** Issue type */
  type: QualityIssueType
  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Issue description */
  description: string
  /** Issue location */
  location: string
  /** Issue status */
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
  /** Resolution */
  resolution?: IssueResolution
}

/**
 * Quality Issue Types
 */
export type QualityIssueType = 
  | 'safety_concern'
  | 'content_error'
  | 'progression_issue'
  | 'usability_problem'
  | 'accessibility_barrier'
  | 'performance_issue'
  | 'compatibility_problem'

/**
 * Issue Resolution
 */
export interface IssueResolution {
  /** Resolution description */
  description: string
  /** Resolution date */
  date: Date
  /** Resolver ID */
  resolverId: string
  /** Resolution verification */
  verified: boolean
}

/**
 * Quality Improvement
 */
export interface QualityImprovement {
  /** Improvement ID */
  id: string
  /** Improvement type */
  type: 'content_enhancement' | 'safety_improvement' | 'usability_enhancement'
  /** Improvement description */
  description: string
  /** Implementation date */
  implementedDate: Date
  /** Quality impact */
  qualityImpact: number
  /** User impact */
  userImpact: string
}

// ================================
// Monetization Data
// ================================

/**
 * Template Monetization Data
 */
export interface MonetizationData {
  /** Pricing model */
  pricingModel: PricingModel
  /** Revenue information */
  revenue: RevenueInformation
  /** Licensing terms */
  licensing: LicensingTerms
  /** Payment processing */
  payment: PaymentProcessing
  /** Financial analytics */
  analytics: FinancialAnalytics
}

/**
 * Pricing Model
 */
export interface PricingModel {
  /** Model type */
  type: PricingModelType
  /** Price tiers */
  tiers: PriceTier[]
  /** Dynamic pricing */
  dynamicPricing: DynamicPricing
  /** Promotional pricing */
  promotions: PromotionalPricing[]
}

/**
 * Pricing Model Types
 */
export type PricingModelType = 
  | 'free'
  | 'freemium'
  | 'one_time'
  | 'subscription'
  | 'pay_per_use'
  | 'tiered'
  | 'dynamic'

/**
 * Price Tier
 */
export interface PriceTier {
  /** Tier ID */
  id: string
  /** Tier name */
  name: string
  /** Tier price */
  price: number
  /** Tier currency */
  currency: string
  /** Tier features */
  features: string[]
  /** Tier limitations */
  limitations: string[]
  /** Tier popularity */
  popularity: number
}

/**
 * Dynamic Pricing
 */
export interface DynamicPricing {
  /** Dynamic pricing enabled */
  enabled: boolean
  /** Pricing factors */
  factors: PricingFactor[]
  /** Price range */
  priceRange: { min: number; max: number }
  /** Update frequency */
  updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
}

/**
 * Pricing Factor
 */
export interface PricingFactor {
  /** Factor name */
  factor: 'demand' | 'competition' | 'seasonality' | 'user_segment' | 'inventory'
  /** Factor weight */
  weight: number
  /** Current factor value */
  currentValue: number
  /** Factor impact on price */
  priceImpact: number
}

/**
 * Promotional Pricing
 */
export interface PromotionalPricing {
  /** Promotion ID */
  id: string
  /** Promotion name */
  name: string
  /** Promotion type */
  type: 'discount' | 'bundle' | 'free_trial' | 'bogo'
  /** Discount percentage */
  discountPercent?: number
  /** Discount amount */
  discountAmount?: number
  /** Promotion start date */
  startDate: Date
  /** Promotion end date */
  endDate: Date
  /** Promotion code */
  code?: string
  /** Usage limits */
  usageLimits: UsageLimit[]
}

/**
 * Usage Limit
 */
export interface UsageLimit {
  /** Limit type */
  type: 'per_user' | 'total_uses' | 'time_based'
  /** Limit value */
  value: number
  /** Current usage */
  currentUsage: number
}

/**
 * Revenue Information
 */
export interface RevenueInformation {
  /** Total revenue */
  totalRevenue: number
  /** Revenue currency */
  currency: string
  /** Revenue by period */
  revenueByPeriod: RevenuePeriod[]
  /** Revenue by tier */
  revenueByTier: Record<string, number>
  /** Revenue forecasting */
  forecast: RevenueForecast
}

/**
 * Revenue Period
 */
export interface RevenuePeriod {
  /** Period start date */
  startDate: Date
  /** Period end date */
  endDate: Date
  /** Period revenue */
  revenue: number
  /** Period transactions */
  transactions: number
  /** Period growth rate */
  growthRate: number
}

/**
 * Revenue Forecast
 */
export interface RevenueForecast {
  /** Forecast periods */
  periods: ForecastPeriod[]
  /** Forecast methodology */
  methodology: string
  /** Forecast confidence */
  confidence: number
  /** Forecast assumptions */
  assumptions: string[]
}

/**
 * Forecast Period
 */
export interface ForecastPeriod {
  /** Period */
  period: Date
  /** Projected revenue */
  projectedRevenue: number
  /** Revenue range */
  revenueRange: { low: number; high: number }
  /** Key assumptions */
  assumptions: string[]
}

/**
 * Licensing Terms
 */
export interface LicensingTerms {
  /** License type */
  licenseType: LicenseType
  /** Usage rights */
  usageRights: UsageRight[]
  /** Restrictions */
  restrictions: LicenseRestriction[]
  /** Attribution requirements */
  attribution: AttributionRequirement[]
  /** Commercial use allowed */
  commercialUse: boolean
}

/**
 * License Types
 */
export type LicenseType = 
  | 'proprietary'
  | 'creative_commons'
  | 'open_source'
  | 'royalty_free'
  | 'rights_managed'
  | 'custom'

/**
 * Usage Right
 */
export interface UsageRight {
  /** Right type */
  type: string
  /** Right description */
  description: string
  /** Right scope */
  scope: 'personal' | 'commercial' | 'educational' | 'unlimited'
  /** Right duration */
  duration: 'perpetual' | 'limited' | 'subscription'
}

/**
 * License Restriction
 */
export interface LicenseRestriction {
  /** Restriction type */
  type: string
  /** Restriction description */
  description: string
  /** Penalty for violation */
  penalty: string
}

/**
 * Attribution Requirement
 */
export interface AttributionRequirement {
  /** Attribution type */
  type: 'name' | 'link' | 'logo' | 'copyright'
  /** Required text */
  requiredText: string
  /** Placement requirements */
  placement: string[]
  /** Format requirements */
  format: string[]
}

/**
 * Payment Processing
 */
export interface PaymentProcessing {
  /** Supported payment methods */
  paymentMethods: PaymentMethod[]
  /** Payment processors */
  processors: PaymentProcessor[]
  /** Transaction fees */
  fees: TransactionFee[]
  /** Refund policy */
  refundPolicy: RefundPolicy
}

/**
 * Payment Method
 */
export interface PaymentMethod {
  /** Method type */
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer'
  /** Method enabled */
  enabled: boolean
  /** Supported countries */
  supportedCountries: string[]
  /** Processing fee */
  processingFee: number
}

/**
 * Payment Processor
 */
export interface PaymentProcessor {
  /** Processor name */
  name: string
  /** Processor configuration */
  configuration: ProcessorConfiguration
  /** Processor fees */
  fees: ProcessorFee[]
  /** Supported currencies */
  supportedCurrencies: string[]
}

/**
 * Processor Configuration
 */
export interface ProcessorConfiguration {
  /** API endpoint */
  apiEndpoint: string
  /** Webhook URL */
  webhookUrl: string
  /** Security settings */
  security: SecuritySettings
  /** Environment */
  environment: 'sandbox' | 'production'
}

/**
 * Security Settings
 */
export interface SecuritySettings {
  /** Encryption method */
  encryption: string
  /** SSL/TLS version */
  tlsVersion: string
  /** Token security */
  tokenSecurity: boolean
  /** Fraud detection */
  fraudDetection: boolean
}

/**
 * Processor Fee
 */
export interface ProcessorFee {
  /** Fee type */
  type: 'transaction' | 'monthly' | 'setup' | 'chargeback'
  /** Fee amount */
  amount: number
  /** Fee percentage */
  percentage?: number
  /** Fee description */
  description: string
}

/**
 * Transaction Fee
 */
export interface TransactionFee {
  /** Fee type */
  type: 'platform' | 'payment_processing' | 'currency_conversion'
  /** Fee structure */
  structure: 'percentage' | 'fixed' | 'tiered'
  /** Fee rate */
  rate: number
  /** Fee description */
  description: string
}

/**
 * Financial Analytics
 */
export interface FinancialAnalytics {
  /** Key performance indicators */
  kpis: FinancialKPI[]
  /** Revenue analytics */
  revenueAnalytics: RevenueAnalytics
  /** Customer analytics */
  customerAnalytics: CustomerAnalytics
  /** Profitability analysis */
  profitabilityAnalysis: ProfitabilityAnalysis
}

/**
 * Financial KPI
 */
export interface FinancialKPI {
  /** KPI name */
  name: string
  /** KPI value */
  value: number
  /** KPI target */
  target: number
  /** KPI trend */
  trend: 'up' | 'down' | 'stable'
  /** KPI period */
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

/**
 * Revenue Analytics
 */
export interface RevenueAnalytics {
  /** Monthly recurring revenue */
  mrr: number
  /** Annual recurring revenue */
  arr: number
  /** Average revenue per user */
  arpu: number
  /** Customer lifetime value */
  clv: number
  /** Revenue churn rate */
  churnRate: number
}

/**
 * Customer Analytics
 */
export interface CustomerAnalytics {
  /** Customer acquisition cost */
  cac: number
  /** Customer retention rate */
  retentionRate: number
  /** Customer segmentation */
  segmentation: CustomerSegment[]
  /** Purchase behavior */
  purchaseBehavior: PurchaseBehavior
}

/**
 * Customer Segment
 */
export interface CustomerSegment {
  /** Segment name */
  name: string
  /** Segment size */
  size: number
  /** Segment revenue */
  revenue: number
  /** Segment characteristics */
  characteristics: string[]
}

/**
 * Purchase Behavior
 */
export interface PurchaseBehavior {
  /** Average order value */
  averageOrderValue: number
  /** Purchase frequency */
  purchaseFrequency: number
  /** Repeat purchase rate */
  repeatPurchaseRate: number
  /** Seasonal patterns */
  seasonalPatterns: SeasonalPattern[]
}

/**
 * Profitability Analysis
 */
export interface ProfitabilityAnalysis {
  /** Gross profit margin */
  grossProfitMargin: number
  /** Net profit margin */
  netProfitMargin: number
  /** Cost breakdown */
  costBreakdown: CostBreakdown
  /** Profitability by tier */
  profitabilityByTier: Record<string, number>
}

/**
 * Cost Breakdown
 */
export interface CostBreakdown {
  /** Development costs */
  development: number
  /** Marketing costs */
  marketing: number
  /** Support costs */
  support: number
  /** Platform costs */
  platform: number
  /** Other costs */
  other: number
}

// Export all template browser types
export type {
  TemplateMarketplaceEntry,
  MarketplaceMetadata,
  TemplateAnalytics,
  CommunityEngagement,
  TemplateQuality,
  MonetizationData
}