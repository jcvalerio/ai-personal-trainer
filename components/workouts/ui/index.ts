/**
 * Workout Session UI Components
 * Mobile-first, accessible components for workout session execution
 */

// Enhanced Session Interface
export { EnhancedSessionInterface } from './enhanced-session-interface';

// Core Session Components
export { SessionProgressHeader } from './session-progress-header';
export { ExerciseProgressCard } from './exercise-progress-card';
export { SessionTimer } from './session-timer';
export { SessionNavigation } from './session-navigation';

// Session Creation and Scheduling
export { WeeklySchedule } from './weekly-schedule';
export { SessionCreationDialog } from './session-creation-dialog';
export { QuickSessionStarter } from './quick-session-starter';

// AI Recommendations
export { 
  AIRecommendations,
  RestTimeRecommendations,
  FormImprovementRecommendations,
  IntensityAdjustmentRecommendations
} from './ai-recommendations';

// Loading States and Skeletons
export {
  SessionLoading,
  SessionHeaderSkeleton,
  ExerciseCardSkeleton,
  TimerSkeleton,
  NavigationSkeleton,
  SessionStatsSkeleton,
  SessionSkeleton,
  EmptyState,
  NoActiveSessionState,
  SessionCompleteState,
  SessionErrorState,
} from './session-loading-states';

// Type exports for component props
export type { SessionTimerProps } from './session-timer';
export type { ExerciseProgressCardProps } from './exercise-progress-card';
export type { SessionProgressHeaderProps } from './session-progress-header';
export type { SessionNavigationProps } from './session-navigation';
export type { SessionLoadingProps, EmptyStateProps } from './session-loading-states';