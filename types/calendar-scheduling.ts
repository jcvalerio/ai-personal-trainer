/**
 * Calendar Scheduling Type Definitions
 * Phase 3: Calendar views, drag-and-drop scheduling, time slot management,
 * and session conflict detection for the AI Personal Trainer application
 */

import { FitnessLevel } from './index'
import { 
  WorkoutSession, 
  WorkoutPlan, 
  SessionStatus,
  SessionType,
  DayScheduleType 
} from './workouts'
import { DashboardWorkoutPlan } from './plan-dashboard'

// ================================
// Calendar Core Types
// ================================

/**
 * Calendar View Types
 */
export type CalendarViewType = 
  | 'day'          // Single day view with hourly slots
  | 'week'         // Week view with daily columns
  | 'month'        // Month view with date grid
  | 'agenda'       // List view of upcoming sessions
  | 'year'         // Year overview for long-term planning
  | 'schedule'     // Training schedule template view

/**
 * Calendar Time Unit
 */
export type CalendarTimeUnit = 
  | 'minute'
  | 'hour' 
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

/**
 * Calendar Navigation Direction
 */
export type NavigationDirection = 'previous' | 'next' | 'today' | 'specific'

/**
 * Calendar Date Range
 */
export interface CalendarDateRange {
  /** Start date of the range */
  start: Date
  /** End date of the range */
  end: Date
  /** Range label for display */
  label: string
  /** Range type identifier */
  type: CalendarTimeUnit
}

/**
 * Calendar Configuration
 */
export interface CalendarConfig {
  /** Default view type */
  defaultView: CalendarViewType
  /** Available view types */
  availableViews: CalendarViewType[]
  /** Week start day (0 = Sunday, 1 = Monday) */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Time format (12h or 24h) */
  timeFormat: '12h' | '24h'
  /** Timezone configuration */
  timezone: TimezoneConfig
  /** Business hours */
  businessHours: BusinessHoursConfig
  /** Localization settings */
  localization: CalendarLocalization
  /** Display options */
  display: CalendarDisplayOptions
  /** Interaction settings */
  interaction: CalendarInteractionConfig
}

/**
 * Timezone Configuration
 */
export interface TimezoneConfig {
  /** User's timezone */
  userTimezone: string
  /** Display timezone */
  displayTimezone: string
  /** Auto-detect timezone */
  autoDetect: boolean
  /** Show timezone indicator */
  showTimezone: boolean
  /** Handle daylight saving time */
  handleDST: boolean
}

/**
 * Business Hours Configuration
 */
export interface BusinessHoursConfig {
  /** Business hours enabled */
  enabled: boolean
  /** Hours for each day of week */
  hours: DayBusinessHours[]
  /** Highlight business hours */
  highlight: boolean
  /** Restrict scheduling to business hours */
  restrictScheduling: boolean
}

/**
 * Business Hours for Specific Day
 */
export interface DayBusinessHours {
  /** Day of week (0-6) */
  dayOfWeek: number
  /** Is day a business day */
  isBusinessDay: boolean
  /** Time slots for this day */
  timeSlots: TimeSlot[]
  /** Day-specific notes */
  notes?: string
}

/**
 * Time Slot Definition
 */
export interface TimeSlot {
  /** Slot start time (24h format) */
  start: string
  /** Slot end time (24h format) */
  end: string
  /** Is slot available for scheduling */
  available: boolean
  /** Slot capacity (number of sessions) */
  capacity?: number
  /** Slot type/category */
  type?: 'peak' | 'off_peak' | 'premium' | 'restricted'
}

/**
 * Calendar Localization
 */
export interface CalendarLocalization {
  /** Language code */
  locale: string
  /** Day name format */
  dayNameFormat: 'long' | 'short' | 'narrow'
  /** Month name format */
  monthNameFormat: 'long' | 'short' | 'narrow'
  /** Date format pattern */
  dateFormat: string
  /** Time format pattern */
  timeFormat: string
  /** Week number display */
  showWeekNumbers: boolean
  /** Custom translations */
  translations: Record<string, string>
}

/**
 * Calendar Display Options
 */
export interface CalendarDisplayOptions {
  /** Show weekend days */
  showWeekends: boolean
  /** Weekend days to show */
  weekendDays: number[]
  /** Show week numbers */
  showWeekNumbers: boolean
  /** Show time ruler */
  showTimeRuler: boolean
  /** Time ruler interval (minutes) */
  timeRulerInterval: number
  /** Show all-day events */
  showAllDayEvents: boolean
  /** Event display density */
  eventDensity: 'compact' | 'comfortable' | 'spacious'
  /** Color theme */
  colorTheme: CalendarColorTheme
}

/**
 * Calendar Color Theme
 */
export interface CalendarColorTheme {
  /** Primary color */
  primary: string
  /** Secondary color */
  secondary: string
  /** Background color */
  background: string
  /** Text color */
  text: string
  /** Border color */
  border: string
  /** Today highlight color */
  today: string
  /** Weekend color */
  weekend: string
  /** Business hours color */
  businessHours: string
}

/**
 * Calendar Interaction Configuration
 */
export interface CalendarInteractionConfig {
  /** Enable drag and drop */
  dragAndDrop: boolean
  /** Enable click to create */
  clickToCreate: boolean
  /** Enable double-click to edit */
  doubleClickToEdit: boolean
  /** Enable resizing */
  resizing: boolean
  /** Enable multi-select */
  multiSelect: boolean
  /** Keyboard navigation */
  keyboardNavigation: boolean
  /** Touch gestures */
  touchGestures: TouchGestureConfig
}

/**
 * Touch Gesture Configuration
 */
export interface TouchGestureConfig {
  /** Swipe navigation */
  swipeNavigation: boolean
  /** Pinch to zoom */
  pinchZoom: boolean
  /** Long press actions */
  longPress: boolean
  /** Touch sensitivity */
  touchSensitivity: 'low' | 'medium' | 'high'
}

// ================================
// Calendar Events and Sessions
// ================================

/**
 * Calendar Event (extends WorkoutSession for calendar display)
 */
export interface CalendarEvent extends Omit<WorkoutSession, 'scheduledDate' | 'scheduledTime'> {
  /** Event start date and time */
  start: Date
  /** Event end date and time */
  end: Date
  /** Event title (displayed on calendar) */
  title: string
  /** Event description */
  description?: string
  /** Event color */
  color?: string
  /** Event background color */
  backgroundColor?: string
  /** Event border color */
  borderColor?: string
  /** Event text color */
  textColor?: string
  /** Is event all-day */
  allDay: boolean
  /** Event recurrence rule */
  recurrence?: RecurrenceRule
  /** Calendar-specific properties */
  calendar: CalendarEventProperties
  /** Drag and drop properties */
  dragDrop: DragDropProperties
  /** Conflict detection properties */
  conflicts: ConflictProperties
}

/**
 * Calendar Event Properties
 */
export interface CalendarEventProperties {
  /** Event category */
  category: EventCategory
  /** Event priority */
  priority: EventPriority
  /** Event visibility */
  visibility: EventVisibility
  /** Event editing permissions */
  editable: boolean
  /** Event deletion permissions */
  deletable: boolean
  /** Event resize permissions */
  resizable: boolean
  /** Event move permissions */
  movable: boolean
  /** Show event details on hover */
  showDetailsOnHover: boolean
  /** Event icon */
  icon?: string
  /** Event tags */
  tags: string[]
}

/**
 * Event Categories
 */
export type EventCategory = 
  | 'workout'           // Regular workout sessions
  | 'assessment'        // Fitness assessments
  | 'recovery'          // Recovery/rest sessions
  | 'class'            // Group fitness classes
  | 'personal_training' // One-on-one training
  | 'competition'       // Athletic competitions
  | 'rehabilitation'    // Physical therapy/rehab
  | 'milestone'         // Achievement milestones
  | 'reminder'          // Workout reminders
  | 'maintenance'       // Equipment/facility maintenance
  | 'blocked'          // Blocked time slots

/**
 * Event Priority Levels
 */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Event Visibility Settings
 */
export type EventVisibility = 'public' | 'private' | 'shared' | 'organization'

/**
 * Recurrence Rule
 */
export interface RecurrenceRule {
  /** Recurrence frequency */
  frequency: RecurrenceFrequency
  /** Interval between recurrences */
  interval: number
  /** Days of week for weekly recurrence */
  daysOfWeek?: number[]
  /** Days of month for monthly recurrence */
  daysOfMonth?: number[]
  /** Months of year for yearly recurrence */
  monthsOfYear?: number[]
  /** Recurrence end condition */
  end?: RecurrenceEnd
  /** Recurrence exceptions */
  exceptions?: Date[]
  /** Timezone for recurrence calculation */
  timezone?: string
}

/**
 * Recurrence Frequency
 */
export type RecurrenceFrequency = 
  | 'daily'
  | 'weekly' 
  | 'monthly'
  | 'yearly'
  | 'custom'

/**
 * Recurrence End Condition
 */
export type RecurrenceEnd = 
  | { type: 'never' }
  | { type: 'count'; count: number }
  | { type: 'date'; date: Date }

/**
 * Drag and Drop Properties
 */
export interface DragDropProperties {
  /** Is event draggable */
  draggable: boolean
  /** Drag constraints */
  constraints: DragConstraints
  /** Drag feedback */
  feedback: DragFeedback
  /** Drop validation */
  validation: DropValidation
  /** Drag ghost configuration */
  ghost: DragGhostConfig
}

/**
 * Drag Constraints
 */
export interface DragConstraints {
  /** Constrain to business hours */
  businessHoursOnly: boolean
  /** Constrain to specific days */
  allowedDays?: number[]
  /** Minimum time between sessions */
  minimumGap?: number
  /** Maximum duration change */
  maxDurationChange?: number
  /** Constrain to same week */
  sameWeekOnly?: boolean
  /** Constrain to same calendar */
  sameCalendarOnly?: boolean
  /** Custom constraint function */
  customConstraint?: (event: CalendarEvent, newStart: Date, newEnd: Date) => boolean
}

/**
 * Drag Feedback
 */
export interface DragFeedback {
  /** Show drag feedback */
  enabled: boolean
  /** Feedback style */
  style: 'outline' | 'fill' | 'shadow'
  /** Show time indicators */
  showTimeIndicators: boolean
  /** Show conflict warnings */
  showConflictWarnings: boolean
  /** Feedback color */
  color?: string
  /** Feedback opacity */
  opacity?: number
}

/**
 * Drop Validation
 */
export interface DropValidation {
  /** Validate on drop */
  enabled: boolean
  /** Show validation errors */
  showErrors: boolean
  /** Validation rules */
  rules: ValidationRule[]
  /** Auto-resolve conflicts */
  autoResolveConflicts: boolean
}

/**
 * Validation Rule
 */
export interface ValidationRule {
  /** Rule type */
  type: ValidationType
  /** Rule message */
  message: string
  /** Rule severity */
  severity: 'error' | 'warning' | 'info'
  /** Rule parameters */
  parameters?: any
  /** Custom validation function */
  validator?: (event: CalendarEvent, newStart: Date, newEnd: Date) => boolean
}

/**
 * Validation Types
 */
export type ValidationType = 
  | 'no_overlap'        // Events cannot overlap
  | 'business_hours'    // Must be within business hours
  | 'minimum_gap'       // Minimum time between events
  | 'maximum_duration'  // Maximum event duration
  | 'required_equipment' // Required equipment availability
  | 'instructor_availability' // Instructor must be available
  | 'capacity_limit'    // Venue/class capacity limit
  | 'custom'            // Custom validation rule

/**
 * Drag Ghost Configuration
 */
export interface DragGhostConfig {
  /** Show drag ghost */
  enabled: boolean
  /** Ghost transparency */
  opacity: number
  /** Ghost style */
  style: 'original' | 'simplified' | 'placeholder'
  /** Show ghost details */
  showDetails: boolean
}

/**
 * Conflict Detection Properties
 */
export interface ConflictProperties {
  /** Has conflicts */
  hasConflicts: boolean
  /** Conflict details */
  conflicts: SessionConflict[]
  /** Conflict resolution suggestions */
  resolutionSuggestions: ConflictResolution[]
  /** Auto-resolve conflicts */
  autoResolve: boolean
}

// ================================
// Session Conflict Detection
// ================================

/**
 * Session Conflict Types
 */
export type ConflictType = 
  | 'time_overlap'      // Time slots overlap
  | 'equipment_conflict' // Same equipment needed
  | 'instructor_conflict' // Same instructor assigned
  | 'venue_conflict'    // Same venue booked
  | 'user_double_booking' // User has multiple sessions
  | 'capacity_exceeded' // Venue/class capacity exceeded
  | 'prerequisite_missing' // Required prerequisite not met
  | 'recovery_violation' // Insufficient recovery time
  | 'custom_conflict'   // Custom business rule violation

/**
 * Session Conflict Details
 */
export interface SessionConflict {
  /** Conflict unique identifier */
  id: string
  /** Conflict type */
  type: ConflictType
  /** Conflict severity */
  severity: ConflictSeverity
  /** Primary session (the one being scheduled) */
  primarySession: CalendarEvent
  /** Conflicting sessions */
  conflictingSessions: CalendarEvent[]
  /** Conflict description */
  description: string
  /** Conflict details */
  details: ConflictDetails
  /** Suggested resolutions */
  resolutions: ConflictResolution[]
  /** Can conflict be ignored */
  canIgnore: boolean
  /** Conflict detection timestamp */
  detectedAt: Date
}

/**
 * Conflict Severity Levels
 */
export type ConflictSeverity = 
  | 'info'       // Informational, no action needed
  | 'warning'    // Warning, user should review
  | 'error'      // Error, must be resolved
  | 'critical'   // Critical, blocks scheduling

/**
 * Conflict Details (varies by conflict type)
 */
export type ConflictDetails = 
  | TimeOverlapDetails
  | EquipmentConflictDetails
  | InstructorConflictDetails
  | VenueConflictDetails
  | CapacityConflictDetails
  | RecoveryConflictDetails
  | CustomConflictDetails

/**
 * Time Overlap Conflict Details
 */
export interface TimeOverlapDetails {
  /** Overlap start time */
  overlapStart: Date
  /** Overlap end time */
  overlapEnd: Date
  /** Overlap duration in minutes */
  overlapDuration: number
  /** Percentage of overlap */
  overlapPercentage: number
}

/**
 * Equipment Conflict Details
 */
export interface EquipmentConflictDetails {
  /** Conflicting equipment IDs */
  equipmentIds: string[]
  /** Equipment names */
  equipmentNames: string[]
  /** Required quantity */
  requiredQuantity: Record<string, number>
  /** Available quantity */
  availableQuantity: Record<string, number>
  /** Shortage details */
  shortages: EquipmentShortage[]
}

/**
 * Equipment Shortage
 */
export interface EquipmentShortage {
  /** Equipment ID */
  equipmentId: string
  /** Equipment name */
  equipmentName: string
  /** Required quantity */
  required: number
  /** Available quantity */
  available: number
  /** Shortage amount */
  shortage: number
}

/**
 * Instructor Conflict Details
 */
export interface InstructorConflictDetails {
  /** Instructor ID */
  instructorId: string
  /** Instructor name */
  instructorName: string
  /** Conflicting session times */
  conflictingTimes: TimeRange[]
  /** Travel time between locations */
  travelTime?: number
}

/**
 * Time Range
 */
export interface TimeRange {
  /** Start time */
  start: Date
  /** End time */
  end: Date
  /** Range description */
  description?: string
}

/**
 * Venue Conflict Details
 */
export interface VenueConflictDetails {
  /** Venue ID */
  venueId: string
  /** Venue name */
  venueName: string
  /** Venue type */
  venueType: string
  /** Conflicting bookings */
  conflictingBookings: VenueBooking[]
  /** Setup/cleanup time required */
  setupCleanupTime?: number
}

/**
 * Venue Booking
 */
export interface VenueBooking {
  /** Booking ID */
  bookingId: string
  /** Booking title */
  title: string
  /** Booking start time */
  start: Date
  /** Booking end time */
  end: Date
  /** Booking priority */
  priority: EventPriority
}

/**
 * Capacity Conflict Details
 */
export interface CapacityConflictDetails {
  /** Venue/class capacity */
  maxCapacity: number
  /** Current bookings */
  currentBookings: number
  /** New session participant count */
  newParticipants: number
  /** Total participants after booking */
  totalParticipants: number
  /** Capacity exceeded by */
  exceededBy: number
  /** Waitlist available */
  waitlistAvailable: boolean
}

/**
 * Recovery Conflict Details
 */
export interface RecoveryConflictDetails {
  /** Required recovery time (hours) */
  requiredRecoveryHours: number
  /** Actual time between sessions (hours) */
  actualTimeBetween: number
  /** Recovery deficit (hours) */
  recoveryDeficit: number
  /** Previous session details */
  previousSession: {
    sessionId: string
    endTime: Date
    intensity: 'low' | 'medium' | 'high' | 'extreme'
    muscleGroups: string[]
  }
  /** Recovery recommendations */
  recommendations: string[]
}

/**
 * Custom Conflict Details
 */
export interface CustomConflictDetails {
  /** Custom rule identifier */
  ruleId: string
  /** Rule description */
  ruleDescription: string
  /** Rule parameters */
  ruleParameters: any
  /** Violation details */
  violationDetails: any
}

/**
 * Conflict Resolution Suggestions
 */
export interface ConflictResolution {
  /** Resolution ID */
  id: string
  /** Resolution type */
  type: ResolutionType
  /** Resolution description */
  description: string
  /** Resolution action */
  action: ResolutionAction
  /** Resolution impact */
  impact: ResolutionImpact
  /** Resolution confidence */
  confidence: number
  /** Auto-apply resolution */
  autoApply: boolean
  /** Resolution cost/trade-off */
  tradeOff?: string
}

/**
 * Resolution Types
 */
export type ResolutionType = 
  | 'reschedule'         // Move session to different time
  | 'substitute'         // Substitute equipment/instructor
  | 'split'             // Split into multiple sessions
  | 'merge'             // Merge with another session
  | 'cancel'            // Cancel conflicting session
  | 'waitlist'          // Add to waitlist
  | 'override'          // Override conflict (force scheduling)
  | 'modify_duration'   // Adjust session duration
  | 'change_venue'      // Move to different venue
  | 'custom'            // Custom resolution

/**
 * Resolution Action
 */
export interface ResolutionAction {
  /** Action type */
  type: 'automatic' | 'user_prompt' | 'admin_approval'
  /** Action parameters */
  parameters: any
  /** Action function */
  execute?: () => Promise<void>
  /** Action validation */
  validate?: () => boolean
}

/**
 * Resolution Impact Assessment
 */
export interface ResolutionImpact {
  /** Impact on user experience */
  userExperience: 'positive' | 'neutral' | 'negative'
  /** Impact on schedule efficiency */
  scheduleEfficiency: number
  /** Impact on resource utilization */
  resourceUtilization: number
  /** Impact on goal achievement */
  goalAchievement: number
  /** Impact on cost */
  cost?: number
  /** Affected users count */
  affectedUsers: number
}

// ================================
// Calendar Time Slot Management
// ================================

/**
 * Time Slot Manager Configuration
 */
export interface TimeSlotManager {
  /** Available time slots */
  slots: AvailableTimeSlot[]
  /** Slot allocation rules */
  allocationRules: SlotAllocationRule[]
  /** Capacity management */
  capacity: CapacityManagement
  /** Pricing tiers */
  pricing: SlotPricingConfig
  /** Booking policies */
  policies: BookingPolicies
}

/**
 * Available Time Slot
 */
export interface AvailableTimeSlot {
  /** Slot unique identifier */
  id: string
  /** Slot start time */
  start: Date
  /** Slot end time */
  end: Date
  /** Slot duration in minutes */
  duration: number
  /** Slot type/category */
  type: TimeSlotType
  /** Slot capacity */
  capacity: SlotCapacity
  /** Slot status */
  status: SlotStatus
  /** Slot pricing */
  pricing: SlotPricing
  /** Required resources */
  resources: SlotResources
  /** Slot restrictions */
  restrictions: SlotRestrictions
  /** Booking information */
  bookings: SlotBooking[]
  /** Slot metadata */
  metadata: SlotMetadata
}

/**
 * Time Slot Types
 */
export type TimeSlotType = 
  | 'regular'      // Regular training slot
  | 'premium'      // Premium/high-demand slot
  | 'off_peak'     // Off-peak/discount slot
  | 'group'        // Group session slot
  | 'personal'     // Personal training slot
  | 'assessment'   // Assessment/evaluation slot
  | 'maintenance'  // Equipment maintenance slot
  | 'blocked'      // Unavailable/blocked slot

/**
 * Slot Capacity
 */
export interface SlotCapacity {
  /** Maximum participants */
  maximum: number
  /** Minimum participants (for group sessions) */
  minimum?: number
  /** Optimal participant count */
  optimal?: number
  /** Current bookings */
  current: number
  /** Available spaces */
  available: number
  /** Waitlist capacity */
  waitlistCapacity?: number
  /** Current waitlist count */
  waitlistCount: number
}

/**
 * Slot Status
 */
export type SlotStatus = 
  | 'available'     // Open for booking
  | 'partial'       // Partially booked
  | 'full'          // Fully booked
  | 'waitlist'      // Waitlist only
  | 'closed'        // Closed for booking
  | 'cancelled'     // Slot cancelled
  | 'maintenance'   // Under maintenance

/**
 * Slot Pricing
 */
export interface SlotPricing {
  /** Base price */
  basePrice: number
  /** Currency code */
  currency: string
  /** Pricing modifiers */
  modifiers: PricingModifier[]
  /** Final price */
  finalPrice: number
  /** Discount information */
  discounts: SlotDiscount[]
  /** Premium charges */
  premiums: SlotPremium[]
}

/**
 * Pricing Modifier
 */
export interface PricingModifier {
  /** Modifier type */
  type: 'peak_time' | 'off_peak' | 'group_discount' | 'member_discount' | 'loyalty' | 'seasonal'
  /** Modifier value (percentage or fixed amount) */
  value: number
  /** Is modifier a percentage */
  isPercentage: boolean
  /** Modifier description */
  description: string
}

/**
 * Slot Discount
 */
export interface SlotDiscount {
  /** Discount type */
  type: 'early_bird' | 'bulk_booking' | 'member' | 'student' | 'senior' | 'promotional'
  /** Discount value */
  value: number
  /** Is discount percentage */
  isPercentage: boolean
  /** Discount conditions */
  conditions: DiscountCondition[]
  /** Discount expiry */
  expiresAt?: Date
}

/**
 * Discount Condition
 */
export interface DiscountCondition {
  /** Condition type */
  type: 'user_type' | 'booking_count' | 'advance_booking' | 'day_of_week' | 'time_of_day'
  /** Condition value */
  value: any
  /** Condition description */
  description: string
}

/**
 * Slot Premium
 */
export interface SlotPremium {
  /** Premium type */
  type: 'peak_time' | 'premium_instructor' | 'exclusive_access' | 'priority_booking'
  /** Premium value */
  value: number
  /** Is premium percentage */
  isPercentage: boolean
  /** Premium justification */
  justification: string
}

/**
 * Slot Resources
 */
export interface SlotResources {
  /** Required equipment */
  equipment: ResourceRequirement[]
  /** Required instructors */
  instructors: ResourceRequirement[]
  /** Required venues */
  venues: ResourceRequirement[]
  /** Additional resources */
  additional: ResourceRequirement[]
}

/**
 * Resource Requirement
 */
export interface ResourceRequirement {
  /** Resource ID */
  resourceId: string
  /** Resource name */
  resourceName: string
  /** Required quantity */
  quantity: number
  /** Resource type */
  type: 'equipment' | 'instructor' | 'venue' | 'other'
  /** Is resource optional */
  optional: boolean
  /** Alternatives available */
  alternatives: string[]
}

/**
 * Slot Restrictions
 */
export interface SlotRestrictions {
  /** Fitness level requirements */
  fitnessLevel?: {
    minimum: FitnessLevel
    maximum?: FitnessLevel
  }
  /** Age restrictions */
  age?: {
    minimum: number
    maximum?: number
  }
  /** Membership requirements */
  membership?: {
    required: boolean
    types: string[]
  }
  /** Prerequisites */
  prerequisites?: {
    required: boolean
    conditions: string[]
  }
  /** Gender restrictions */
  gender?: 'male' | 'female' | 'any'
  /** Medical clearance */
  medicalClearance?: {
    required: boolean
    conditions: string[]
  }
}

/**
 * Slot Booking
 */
export interface SlotBooking {
  /** Booking ID */
  bookingId: string
  /** User ID */
  userId: string
  /** User name */
  userName: string
  /** Booking status */
  status: BookingStatus
  /** Booking timestamp */
  bookedAt: Date
  /** Session details */
  sessionDetails: CalendarEvent
  /** Payment status */
  paymentStatus: PaymentStatus
  /** Special requests */
  specialRequests?: string[]
  /** Check-in status */
  checkedIn: boolean
  /** Cancellation details */
  cancellation?: BookingCancellation
}

/**
 * Booking Status
 */
export type BookingStatus = 
  | 'confirmed'    // Booking confirmed
  | 'pending'      // Awaiting confirmation
  | 'waitlist'     // On waitlist
  | 'cancelled'    // Cancelled by user
  | 'no_show'      // User didn't show up
  | 'completed'    // Session completed
  | 'transferred'  // Booking transferred

/**
 * Payment Status
 */
export type PaymentStatus = 
  | 'paid'         // Payment completed
  | 'pending'      // Payment pending
  | 'failed'       // Payment failed
  | 'refunded'     // Payment refunded
  | 'partial'      // Partially paid
  | 'comp'         // Complimentary

/**
 * Booking Cancellation
 */
export interface BookingCancellation {
  /** Cancellation timestamp */
  cancelledAt: Date
  /** Cancellation reason */
  reason: CancellationReason
  /** Cancellation fee */
  fee?: number
  /** Refund amount */
  refund?: number
  /** Refund status */
  refundStatus?: 'pending' | 'processed' | 'denied'
}

/**
 * Cancellation Reasons
 */
export type CancellationReason = 
  | 'user_request'
  | 'illness'
  | 'emergency'
  | 'schedule_conflict'
  | 'venue_unavailable'
  | 'instructor_unavailable'
  | 'equipment_failure'
  | 'weather'
  | 'other'

/**
 * Slot Metadata
 */
export interface SlotMetadata {
  /** Creation timestamp */
  createdAt: Date
  /** Last updated timestamp */
  updatedAt: Date
  /** Created by user ID */
  createdBy: string
  /** Slot tags */
  tags: string[]
  /** Slot notes */
  notes?: string
  /** Slot statistics */
  statistics: SlotStatistics
}

/**
 * Slot Statistics
 */
export interface SlotStatistics {
  /** Total bookings for this slot type */
  totalBookings: number
  /** Average utilization rate */
  utilizationRate: number
  /** No-show rate */
  noShowRate: number
  /** Cancellation rate */
  cancellationRate: number
  /** User satisfaction rating */
  satisfactionRating: number
  /** Revenue generated */
  revenue: number
}

/**
 * Slot Allocation Rules
 */
export interface SlotAllocationRule {
  /** Rule ID */
  id: string
  /** Rule name */
  name: string
  /** Rule description */
  description: string
  /** Rule priority */
  priority: number
  /** Rule conditions */
  conditions: AllocationCondition[]
  /** Rule actions */
  actions: AllocationAction[]
  /** Rule is active */
  active: boolean
}

/**
 * Allocation Condition
 */
export interface AllocationCondition {
  /** Condition type */
  type: 'user_type' | 'membership_level' | 'booking_history' | 'time_advance' | 'slot_type'
  /** Condition operator */
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  /** Condition value */
  value: any
  /** Condition weight */
  weight: number
}

/**
 * Allocation Action
 */
export interface AllocationAction {
  /** Action type */
  type: 'priority_boost' | 'access_restriction' | 'pricing_modifier' | 'notification'
  /** Action parameters */
  parameters: any
  /** Action description */
  description: string
}

/**
 * Capacity Management
 */
export interface CapacityManagement {
  /** Dynamic capacity adjustment */
  dynamicAdjustment: boolean
  /** Capacity optimization rules */
  optimizationRules: CapacityRule[]
  /** Overbooking policy */
  overbookingPolicy: OverbookingPolicy
  /** Waitlist management */
  waitlistManagement: WaitlistManagement
}

/**
 * Capacity Rule
 */
export interface CapacityRule {
  /** Rule ID */
  id: string
  /** Rule trigger */
  trigger: CapacityTrigger
  /** Capacity adjustment */
  adjustment: CapacityAdjustment
  /** Rule active */
  active: boolean
}

/**
 * Capacity Trigger
 */
export interface CapacityTrigger {
  /** Trigger type */
  type: 'demand_high' | 'demand_low' | 'time_based' | 'event_based'
  /** Trigger threshold */
  threshold: number
  /** Trigger condition */
  condition: string
}

/**
 * Capacity Adjustment
 */
export interface CapacityAdjustment {
  /** Adjustment type */
  type: 'increase' | 'decrease' | 'set_absolute'
  /** Adjustment value */
  value: number
  /** Adjustment duration */
  duration?: number
  /** Adjustment reason */
  reason: string
}

/**
 * Overbooking Policy
 */
export interface OverbookingPolicy {
  /** Allow overbooking */
  allowed: boolean
  /** Overbooking percentage */
  percentage: number
  /** Overbooking conditions */
  conditions: OverbookingCondition[]
  /** Overbooking handling */
  handling: OverbookingHandling
}

/**
 * Overbooking Condition
 */
export interface OverbookingCondition {
  /** Condition type */
  type: 'historical_no_show' | 'user_reliability' | 'time_advance' | 'slot_type'
  /** Condition value */
  value: number
  /** Condition description */
  description: string
}

/**
 * Overbooking Handling
 */
export interface OverbookingHandling {
  /** Handling strategy */
  strategy: 'first_come_first_served' | 'priority_based' | 'waitlist_only'
  /** Compensation policy */
  compensation: CompensationPolicy
  /** Notification policy */
  notification: NotificationPolicy
}

/**
 * Compensation Policy
 */
export interface CompensationPolicy {
  /** Offer compensation */
  offerCompensation: boolean
  /** Compensation types */
  types: CompensationType[]
  /** Automatic compensation */
  automatic: boolean
}

/**
 * Compensation Type
 */
export interface CompensationType {
  /** Type */
  type: 'free_session' | 'credit' | 'discount' | 'upgrade' | 'refund'
  /** Value */
  value: number
  /** Description */
  description: string
}

/**
 * Notification Policy
 */
export interface NotificationPolicy {
  /** Advance notice hours */
  advanceNoticeHours: number
  /** Notification methods */
  methods: NotificationMethod[]
  /** Escalation policy */
  escalation: NotificationEscalation
}

/**
 * Notification Method
 */
export type NotificationMethod = 'email' | 'sms' | 'push' | 'in_app' | 'call'

/**
 * Notification Escalation
 */
export interface NotificationEscalation {
  /** Escalation enabled */
  enabled: boolean
  /** Escalation levels */
  levels: EscalationLevel[]
}

/**
 * Escalation Level
 */
export interface EscalationLevel {
  /** Level number */
  level: number
  /** Delay before escalation (minutes) */
  delayMinutes: number
  /** Escalation method */
  method: NotificationMethod
  /** Escalation recipients */
  recipients: string[]
}

/**
 * Waitlist Management
 */
export interface WaitlistManagement {
  /** Waitlist enabled */
  enabled: boolean
  /** Waitlist capacity */
  capacity: number
  /** Priority rules */
  priorityRules: WaitlistPriorityRule[]
  /** Auto-promotion enabled */
  autoPromotion: boolean
  /** Notification settings */
  notifications: WaitlistNotificationSettings
}

/**
 * Waitlist Priority Rule
 */
export interface WaitlistPriorityRule {
  /** Rule ID */
  id: string
  /** Priority factor */
  factor: WaitlistPriorityFactor
  /** Priority weight */
  weight: number
  /** Rule active */
  active: boolean
}

/**
 * Waitlist Priority Factor
 */
export type WaitlistPriorityFactor = 
  | 'join_time'         // First come, first served
  | 'membership_level'  // Higher membership priority
  | 'loyalty_score'     // Customer loyalty
  | 'payment_history'   // Payment reliability
  | 'cancellation_history' // Low cancellation rate
  | 'custom'           // Custom priority rule

/**
 * Waitlist Notification Settings
 */
export interface WaitlistNotificationSettings {
  /** Notify on spot available */
  notifyOnAvailable: boolean
  /** Notification window (hours) */
  notificationWindow: number
  /** Reservation hold time (minutes) */
  reservationHoldTime: number
  /** Reminder notifications */
  reminders: boolean
  /** Methods */
  methods: NotificationMethod[]
}

/**
 * Slot Pricing Configuration
 */
export interface SlotPricingConfig {
  /** Base pricing model */
  basePricing: PricingModel
  /** Dynamic pricing enabled */
  dynamicPricing: boolean
  /** Pricing rules */
  pricingRules: PricingRule[]
  /** Currency settings */
  currency: CurrencyConfig
}

/**
 * Pricing Model
 */
export type PricingModel = 
  | 'flat_rate'      // Fixed price per session
  | 'tiered'         // Different prices for different tiers
  | 'time_based'     // Price varies by time of day
  | 'demand_based'   // Price varies by demand
  | 'membership'     // Different prices for members/non-members
  | 'dynamic'        // Algorithmic dynamic pricing

/**
 * Pricing Rule
 */
export interface PricingRule {
  /** Rule ID */
  id: string
  /** Rule conditions */
  conditions: PricingCondition[]
  /** Price adjustment */
  adjustment: PricingAdjustment
  /** Rule priority */
  priority: number
  /** Rule active */
  active: boolean
}

/**
 * Pricing Condition
 */
export interface PricingCondition {
  /** Condition type */
  type: 'time_of_day' | 'day_of_week' | 'demand_level' | 'capacity_utilization' | 'user_type'
  /** Condition operator */
  operator: 'equals' | 'greater_than' | 'less_than' | 'between'
  /** Condition value */
  value: any
}

/**
 * Pricing Adjustment
 */
export interface PricingAdjustment {
  /** Adjustment type */
  type: 'percentage' | 'fixed_amount' | 'set_price'
  /** Adjustment value */
  value: number
  /** Adjustment description */
  description: string
}

/**
 * Currency Configuration
 */
export interface CurrencyConfig {
  /** Base currency */
  baseCurrency: string
  /** Supported currencies */
  supportedCurrencies: string[]
  /** Currency conversion */
  conversion: CurrencyConversion
  /** Display settings */
  display: CurrencyDisplay
}

/**
 * Currency Conversion
 */
export interface CurrencyConversion {
  /** Auto conversion enabled */
  enabled: boolean
  /** Exchange rate provider */
  provider: 'internal' | 'external_api' | 'manual'
  /** Rate update frequency */
  updateFrequency: 'real_time' | 'daily' | 'weekly' | 'manual'
  /** Rate margin */
  margin: number
}

/**
 * Currency Display
 */
export interface CurrencyDisplay {
  /** Display format */
  format: 'symbol' | 'code' | 'name'
  /** Decimal places */
  decimalPlaces: number
  /** Thousand separator */
  thousandSeparator: string
  /** Decimal separator */
  decimalSeparator: string
}

/**
 * Booking Policies
 */
export interface BookingPolicies {
  /** Advance booking requirements */
  advanceBooking: AdvanceBookingPolicy
  /** Cancellation policy */
  cancellation: CancellationPolicy
  /** No-show policy */
  noShow: NoShowPolicy
  /** Transfer policy */
  transfer: TransferPolicy
  /** Refund policy */
  refund: RefundPolicy
}

/**
 * Advance Booking Policy
 */
export interface AdvanceBookingPolicy {
  /** Minimum advance booking (hours) */
  minimumHours: number
  /** Maximum advance booking (days) */
  maximumDays: number
  /** Different rules for different user types */
  userTypeRules: Record<string, AdvanceBookingRule>
}

/**
 * Advance Booking Rule
 */
export interface AdvanceBookingRule {
  /** Minimum hours for this user type */
  minimumHours: number
  /** Maximum days for this user type */
  maximumDays: number
  /** Priority booking window */
  priorityHours?: number
}

/**
 * No-Show Policy
 */
export interface NoShowPolicy {
  /** No-show fee */
  fee: number
  /** Fee is percentage */
  feeIsPercentage: boolean
  /** Grace period (minutes) */
  gracePeriodMinutes: number
  /** Strikes before penalty */
  strikesBeforePenalty: number
  /** Penalty actions */
  penalties: NoShowPenalty[]
}

/**
 * No-Show Penalty
 */
export interface NoShowPenalty {
  /** Penalty type */
  type: 'fee' | 'booking_restriction' | 'membership_suspension' | 'warning'
  /** Penalty duration (days) */
  durationDays?: number
  /** Penalty amount */
  amount?: number
  /** Penalty description */
  description: string
}

/**
 * Transfer Policy
 */
export interface TransferPolicy {
  /** Transfers allowed */
  allowed: boolean
  /** Transfer fee */
  fee: number
  /** Transfers per booking limit */
  limitPerBooking: number
  /** Transfer deadline (hours before session) */
  deadlineHours: number
  /** Transfer restrictions */
  restrictions: TransferRestriction[]
}

/**
 * Transfer Restriction
 */
export interface TransferRestriction {
  /** Restriction type */
  type: 'same_session_type' | 'same_instructor' | 'same_venue' | 'same_price_tier'
  /** Restriction description */
  description: string
  /** Is restriction required */
  required: boolean
}

/**
 * Refund Policy
 */
export interface RefundPolicy {
  /** Refunds allowed */
  allowed: boolean
  /** Refund schedule */
  schedule: RefundSchedule[]
  /** Processing time (business days) */
  processingDays: number
  /** Refund methods */
  methods: RefundMethod[]
}

/**
 * Refund Schedule
 */
export interface RefundSchedule {
  /** Hours before session */
  hoursBefore: number
  /** Refund percentage */
  refundPercentage: number
  /** Refund description */
  description: string
}

/**
 * Refund Method
 */
export type RefundMethod = 'original_payment' | 'store_credit' | 'bank_transfer' | 'check'

// ================================
// Calendar State Management
// ================================

/**
 * Calendar State
 */
export interface CalendarState {
  /** Current view configuration */
  view: CalendarViewState
  /** Calendar data */
  data: CalendarDataState
  /** Drag and drop state */
  dragDrop: DragDropState
  /** Selection state */
  selection: SelectionState
  /** Filter state */
  filters: CalendarFilterState
  /** UI state */
  ui: CalendarUIState
}

/**
 * Calendar View State
 */
export interface CalendarViewState {
  /** Current view type */
  currentView: CalendarViewType
  /** Current date range */
  dateRange: CalendarDateRange
  /** Navigation state */
  navigation: NavigationState
  /** Zoom level */
  zoomLevel: number
  /** View settings */
  settings: ViewSettings
}

/**
 * Navigation State
 */
export interface NavigationState {
  /** Can navigate previous */
  canNavigatePrevious: boolean
  /** Can navigate next */
  canNavigateNext: boolean
  /** Is at today */
  isAtToday: boolean
  /** Navigation history */
  history: NavigationHistoryEntry[]
  /** Current history index */
  historyIndex: number
}

/**
 * Navigation History Entry
 */
export interface NavigationHistoryEntry {
  /** Date range */
  dateRange: CalendarDateRange
  /** View type */
  viewType: CalendarViewType
  /** Timestamp */
  timestamp: Date
}

/**
 * View Settings
 */
export interface ViewSettings {
  /** Time range for day/week views */
  timeRange: {
    start: string
    end: string
  }
  /** Working hours highlight */
  highlightWorkingHours: boolean
  /** Show weekends */
  showWeekends: boolean
  /** Show week numbers */
  showWeekNumbers: boolean
  /** Event display settings */
  eventDisplay: EventDisplaySettings
}

/**
 * Event Display Settings
 */
export interface EventDisplaySettings {
  /** Show event times */
  showTimes: boolean
  /** Show event details */
  showDetails: boolean
  /** Event height */
  eventHeight: 'compact' | 'normal' | 'expanded'
  /** Color coding */
  colorCoding: EventColorCoding
}

/**
 * Event Color Coding
 */
export interface EventColorCoding {
  /** Color by property */
  colorBy: 'category' | 'status' | 'priority' | 'instructor' | 'venue' | 'custom'
  /** Color scheme */
  colorScheme: 'default' | 'pastel' | 'vibrant' | 'monochrome' | 'custom'
  /** Custom colors */
  customColors?: Record<string, string>
}

/**
 * Calendar Data State
 */
export interface CalendarDataState {
  /** Calendar events */
  events: CalendarEvent[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error?: string
  /** Last fetch timestamp */
  lastFetch?: Date
  /** Event cache */
  cache: EventCache
  /** Statistics */
  statistics: CalendarStatistics
}

/**
 * Event Cache
 */
export interface EventCache {
  /** Cached date ranges */
  cachedRanges: CachedDateRange[]
  /** Cache hit rate */
  hitRate: number
  /** Cache size */
  size: number
  /** Last cleanup */
  lastCleanup: Date
}

/**
 * Cached Date Range
 */
export interface CachedDateRange {
  /** Date range */
  range: CalendarDateRange
  /** Events in range */
  events: CalendarEvent[]
  /** Cache timestamp */
  timestamp: Date
  /** Cache expiry */
  expires: Date
}

/**
 * Calendar Statistics
 */
export interface CalendarStatistics {
  /** Total events */
  totalEvents: number
  /** Events by status */
  eventsByStatus: Record<SessionStatus, number>
  /** Events by category */
  eventsByCategory: Record<EventCategory, number>
  /** Utilization rate */
  utilizationRate: number
  /** Most booked time slots */
  popularTimeSlots: PopularTimeSlot[]
}

/**
 * Popular Time Slot
 */
export interface PopularTimeSlot {
  /** Time slot */
  timeSlot: string
  /** Booking count */
  bookingCount: number
  /** Utilization percentage */
  utilization: number
}

/**
 * Drag and Drop State
 */
export interface DragDropState {
  /** Is dragging */
  isDragging: boolean
  /** Dragged event */
  draggedEvent?: CalendarEvent
  /** Drag start position */
  dragStart?: DragPosition
  /** Current drag position */
  currentPosition?: DragPosition
  /** Drop target */
  dropTarget?: DropTarget
  /** Drag constraints */
  constraints: DragConstraints
  /** Ghost element */
  ghost?: DragGhost
}

/**
 * Drag Position
 */
export interface DragPosition {
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Date/time at position */
  dateTime: Date
  /** View context */
  context: DragContext
}

/**
 * Drag Context
 */
export interface DragContext {
  /** Source calendar */
  sourceCalendar: string
  /** Source slot */
  sourceSlot?: string
  /** View type */
  viewType: CalendarViewType
  /** Grid position */
  gridPosition: GridPosition
}

/**
 * Grid Position
 */
export interface GridPosition {
  /** Column index */
  column: number
  /** Row index */
  row: number
  /** Cell identifier */
  cellId: string
}

/**
 * Drop Target
 */
export interface DropTarget {
  /** Target date/time */
  dateTime: Date
  /** Target duration */
  duration: number
  /** Target position */
  position: DragPosition
  /** Is valid drop target */
  isValid: boolean
  /** Validation errors */
  validationErrors: string[]
  /** Target conflicts */
  conflicts: SessionConflict[]
}

/**
 * Drag Ghost
 */
export interface DragGhost {
  /** Ghost element */
  element: HTMLElement
  /** Ghost style */
  style: DragGhostStyle
  /** Ghost content */
  content: string
  /** Ghost offset */
  offset: { x: number; y: number }
}

/**
 * Drag Ghost Style
 */
export interface DragGhostStyle {
  /** Opacity */
  opacity: number
  /** Background color */
  backgroundColor: string
  /** Border style */
  border: string
  /** Box shadow */
  boxShadow: string
}

/**
 * Selection State
 */
export interface SelectionState {
  /** Selected events */
  selectedEvents: Set<string>
  /** Selection mode */
  selectionMode: SelectionMode
  /** Multi-select enabled */
  multiSelect: boolean
  /** Selection actions */
  availableActions: SelectionAction[]
  /** Selection metadata */
  metadata: SelectionMetadata
}

/**
 * Selection Mode
 */
export type SelectionMode = 'none' | 'single' | 'multiple' | 'range'

/**
 * Selection Action
 */
export interface SelectionAction {
  /** Action ID */
  id: string
  /** Action label */
  label: string
  /** Action icon */
  icon?: string
  /** Action handler */
  handler: (eventIds: string[]) => void
  /** Is action available */
  isAvailable: (eventIds: string[]) => boolean
  /** Action keyboard shortcut */
  shortcut?: string
}

/**
 * Selection Metadata
 */
export interface SelectionMetadata {
  /** Selection count */
  count: number
  /** Total duration of selected events */
  totalDuration: number
  /** Selected date range */
  dateRange?: CalendarDateRange
  /** Selection categories */
  categories: string[]
}

/**
 * Calendar Filter State
 */
export interface CalendarFilterState {
  /** Active filters */
  activeFilters: CalendarFilter[]
  /** Filter presets */
  presets: FilterPreset[]
  /** Quick filters */
  quickFilters: QuickCalendarFilter[]
  /** Filter history */
  history: FilterHistoryEntry[]
}

/**
 * Calendar Filter
 */
export interface CalendarFilter {
  /** Filter ID */
  id: string
  /** Filter type */
  type: CalendarFilterType
  /** Filter value */
  value: any
  /** Filter operator */
  operator: FilterOperator
  /** Filter active */
  active: boolean
}

/**
 * Calendar Filter Types
 */
export type CalendarFilterType = 
  | 'category'
  | 'status'
  | 'priority'
  | 'instructor'
  | 'venue'
  | 'user'
  | 'date_range'
  | 'duration'
  | 'custom'

/**
 * Filter Operator
 */
export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'

/**
 * Filter Preset
 */
export interface FilterPreset {
  /** Preset ID */
  id: string
  /** Preset name */
  name: string
  /** Preset filters */
  filters: CalendarFilter[]
  /** Is preset system-defined */
  isSystem: boolean
  /** Preset usage count */
  usageCount: number
}

/**
 * Quick Calendar Filter
 */
export interface QuickCalendarFilter {
  /** Filter ID */
  id: string
  /** Filter label */
  label: string
  /** Filter configuration */
  filter: CalendarFilter
  /** Filter icon */
  icon?: string
  /** Filter color */
  color?: string
}

/**
 * Calendar UI State
 */
export interface CalendarUIState {
  /** Loading states */
  loading: CalendarLoadingStates
  /** Modal states */
  modals: CalendarModalStates
  /** Context menu state */
  contextMenu: ContextMenuState
  /** Tooltip state */
  tooltip: TooltipState
  /** Sidebar state */
  sidebar: CalendarSidebarState
}

/**
 * Calendar Loading States
 */
export interface CalendarLoadingStates {
  /** Events loading */
  events: boolean
  /** Conflicts checking */
  conflicts: boolean
  /** Save operation */
  saving: boolean
  /** Delete operation */
  deleting: boolean
}

/**
 * Calendar Modal States
 */
export interface CalendarModalStates {
  /** Event details modal */
  eventDetails: ModalState<EventDetailsModalProps>
  /** Event edit modal */
  eventEdit: ModalState<EventEditModalProps>
  /** Conflict resolution modal */
  conflictResolution: ModalState<ConflictResolutionModalProps>
  /** Bulk operations modal */
  bulkOperations: ModalState<BulkOperationsModalProps>
}

/**
 * Event Details Modal Props
 */
export interface EventDetailsModalProps {
  /** Event ID */
  eventId: string
  /** Read-only mode */
  readOnly?: boolean
}

/**
 * Event Edit Modal Props
 */
export interface EventEditModalProps {
  /** Event ID (for editing) */
  eventId?: string
  /** Initial event data (for creating) */
  initialData?: Partial<CalendarEvent>
  /** Save callback */
  onSave: (event: CalendarEvent) => void
}

/**
 * Conflict Resolution Modal Props
 */
export interface ConflictResolutionModalProps {
  /** Conflicts to resolve */
  conflicts: SessionConflict[]
  /** Resolution callback */
  onResolve: (resolutions: ConflictResolution[]) => void
}

/**
 * Bulk Operations Modal Props
 */
export interface BulkOperationsModalProps {
  /** Selected event IDs */
  eventIds: string[]
  /** Available operations */
  operations: BulkOperation[]
  /** Operation callback */
  onOperation: (operation: BulkOperation, eventIds: string[]) => void
}

/**
 * Bulk Operation
 */
export interface BulkOperation {
  /** Operation ID */
  id: string
  /** Operation label */
  label: string
  /** Operation description */
  description: string
  /** Operation icon */
  icon?: string
  /** Operation confirmation required */
  requiresConfirmation: boolean
  /** Operation handler */
  handler: (eventIds: string[]) => Promise<void>
}

/**
 * Context Menu State
 */
export interface ContextMenuState {
  /** Is context menu open */
  isOpen: boolean
  /** Menu position */
  position: { x: number; y: number }
  /** Target event ID */
  targetEventId?: string
  /** Available actions */
  actions: ContextMenuAction[]
}

/**
 * Context Menu Action
 */
export interface ContextMenuAction {
  /** Action ID */
  id: string
  /** Action label */
  label: string
  /** Action icon */
  icon?: string
  /** Action handler */
  handler: () => void
  /** Is action available */
  isAvailable: boolean
  /** Action separator (divider) */
  separator?: boolean
}

/**
 * Tooltip State
 */
export interface TooltipState {
  /** Is tooltip visible */
  visible: boolean
  /** Tooltip content */
  content: string
  /** Tooltip position */
  position: { x: number; y: number }
  /** Target event ID */
  targetEventId?: string
  /** Tooltip delay */
  delay: number
}

/**
 * Calendar Sidebar State
 */
export interface CalendarSidebarState {
  /** Is sidebar open */
  isOpen: boolean
  /** Sidebar width */
  width: number
  /** Active sidebar tab */
  activeTab: CalendarSidebarTab
  /** Available tabs */
  tabs: CalendarSidebarTab[]
}

/**
 * Calendar Sidebar Tab
 */
export type CalendarSidebarTab = 
  | 'filters'
  | 'calendars'
  | 'upcoming'
  | 'conflicts'
  | 'statistics'

// Export all calendar types
export type {
  CalendarEvent,
  CalendarConfig,
  SessionConflict,
  TimeSlotManager,
  CalendarState
}