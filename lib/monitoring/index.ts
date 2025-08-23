/**
 * Monitoring and Analytics Configuration
 *
 * Centralized configuration for all monitoring, analytics, and error tracking.
 * Supports Sentry, PostHog, and custom performance monitoring.
 */

import { initSentry, setUserContext, addContextTags } from './sentry';
import {
  initWebVitals,
  trackPageLoad,
  ApiPerformanceMonitor,
} from './performance';

// PostHog configuration (if available)
let posthog: any = null;

/**
 * Initialize all monitoring systems
 */
export async function initMonitoring() {
  // Initialize Sentry for error tracking
  await initSentry();

  // Initialize Web Vitals tracking
  initWebVitals();

  // Initialize PostHog for analytics (client-side only)
  if (typeof window !== 'undefined') {
    initPostHog();
  }

  console.log('✅ Monitoring systems initialized');
}

/**
 * Initialize PostHog analytics
 */
async function initPostHog() {
  if (
    !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    !process.env.NEXT_PUBLIC_POSTHOG_HOST
  ) {
    return;
  }

  try {
    // Use dynamic import with string to avoid TypeScript module resolution
    const moduleName = 'posthog-js';
    const posthogModule = await import(
      /* webpackIgnore: true */ moduleName
    ).catch(() => null);
    if (!posthogModule) {
      console.warn('PostHog not available - analytics disabled');
      return;
    }

    const posthogLib = posthogModule.default;

    posthogLib.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

      // Privacy settings
      respect_dnt: true,
      opt_out_capturing_by_default: false,

      // Performance settings
      loaded: (posthogInstance: any) => {
        posthog = posthogInstance;

        // Track page views automatically
        posthogInstance.capture('$pageview');
      },

      // Feature flags
      bootstrap: {
        featureFlags: {},
      },
    });
  } catch (error) {
    console.warn('PostHog initialization failed:', error);
  }
}

/**
 * Set user context across all monitoring systems
 */
export function setMonitoringUser(user: {
  id: string;
  email?: string;
  username?: string;
  subscription?: string;
  organizationId?: string;
}) {
  // Set Sentry user context
  setUserContext(user);

  // Set PostHog user context
  if (posthog && typeof window !== 'undefined') {
    posthog.identify(user.id, {
      email: user.email,
      username: user.username,
      subscription: user.subscription,
      organization_id: user.organizationId,
    });
  }

  // Add context tags for better error tracking
  addContextTags({
    user_id: user.id,
    subscription: user.subscription || 'free',
    organization_id: user.organizationId || 'personal',
  });
}

/**
 * Track custom events across platforms
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  user?: { id: string }
) {
  // Track in PostHog
  if (posthog && typeof window !== 'undefined') {
    posthog.capture(eventName, properties);
  }

  // Track in Sentry as breadcrumb
  import('./sentry').then(({ trackEvent: sentryTrack }) => {
    sentryTrack(eventName, properties);
  });

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Event: ${eventName}`, properties);
  }
}

/**
 * Track workout-related events
 */
export const WorkoutTracking = {
  generation: {
    started: (exerciseCount: number, difficulty: string) => {
      trackEvent('workout_generation_started', {
        exercise_count: exerciseCount,
        difficulty,
        timestamp: Date.now(),
      });
    },

    completed: (duration: number, exerciseCount: number, success: boolean) => {
      trackEvent('workout_generation_completed', {
        duration,
        exercise_count: exerciseCount,
        success,
        timestamp: Date.now(),
      });
    },

    failed: (error: string, context?: Record<string, any>) => {
      trackEvent('workout_generation_failed', {
        error,
        ...context,
        timestamp: Date.now(),
      });
    },
  },

  session: {
    started: (workoutId: string, exerciseCount: number) => {
      trackEvent('workout_session_started', {
        workout_id: workoutId,
        exercise_count: exerciseCount,
        timestamp: Date.now(),
      });
    },

    completed: (
      workoutId: string,
      duration: number,
      exercisesCompleted: number
    ) => {
      trackEvent('workout_session_completed', {
        workout_id: workoutId,
        duration,
        exercises_completed: exercisesCompleted,
        timestamp: Date.now(),
      });
    },

    abandoned: (
      workoutId: string,
      timeSpent: number,
      exercisesCompleted: number
    ) => {
      trackEvent('workout_session_abandoned', {
        workout_id: workoutId,
        time_spent: timeSpent,
        exercises_completed: exercisesCompleted,
        timestamp: Date.now(),
      });
    },
  },
};

/**
 * Track user engagement events
 */
export const EngagementTracking = {
  pageView: (pageName: string, properties?: Record<string, any>) => {
    trackEvent('page_view', {
      page_name: pageName,
      ...properties,
    });

    // Also track page load performance
    trackPageLoad(pageName);
  },

  buttonClick: (buttonName: string, context?: string) => {
    trackEvent('button_click', {
      button_name: buttonName,
      context,
    });
  },

  featureUsed: (featureName: string, properties?: Record<string, any>) => {
    trackEvent('feature_used', {
      feature_name: featureName,
      ...properties,
    });
  },

  error: (
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ) => {
    trackEvent('user_error', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  },
};

/**
 * Performance monitoring wrapper
 */
export const PerformanceTracking = {
  apiCall: ApiPerformanceMonitor.getInstance().trackApiCall.bind(
    ApiPerformanceMonitor.getInstance()
  ),

  databaseQuery: async <T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> => {
    const { trackDatabaseQuery } = await import('./performance');
    return trackDatabaseQuery(queryName, query);
  },

  workoutGeneration: async <T>(operation: () => Promise<T>): Promise<T> => {
    const { trackWorkoutGeneration } = await import('./performance');
    return trackWorkoutGeneration(operation);
  },
};

/**
 * Error reporting with context
 */
export async function reportError(
  error: Error,
  context?: {
    user_id?: string;
    workout_id?: string;
    exercise_id?: string;
    action?: string;
    additional_data?: Record<string, any>;
  }
) {
  const { reportError: sentryReport } = await import('./sentry');
  sentryReport(error, context);

  // Also track as event
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
}

/**
 * Feature flag support (via PostHog)
 */
export function getFeatureFlag(
  flagName: string,
  defaultValue = false
): boolean {
  if (posthog && typeof window !== 'undefined') {
    return posthog.isFeatureEnabled(flagName) ?? defaultValue;
  }

  // Fallback to environment variables
  const envVar = `FEATURE_${flagName.toUpperCase()}`;
  return process.env[envVar] === 'true' || defaultValue;
}

/**
 * A/B testing support
 */
export function getExperimentVariant(experimentName: string): string | null {
  if (posthog && typeof window !== 'undefined') {
    return posthog.getFeatureFlag(experimentName);
  }

  return null;
}

/**
 * Clean up monitoring resources
 */
export function cleanupMonitoring() {
  if (posthog && typeof window !== 'undefined') {
    posthog.reset();
  }
}

// Export individual systems for direct use
export { initSentry, setUserContext, addContextTags } from './sentry';
export {
  initWebVitals,
  trackPageLoad,
  ApiPerformanceMonitor,
  PERFORMANCE_THRESHOLDS,
} from './performance';
