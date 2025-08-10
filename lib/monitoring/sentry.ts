/**
 * Sentry Error Tracking and Performance Monitoring
 * 
 * Centralized error tracking and performance monitoring for production.
 * Includes user context, custom tags, and performance traces.
 */

// import * as Sentry from '@sentry/nextjs';
// Optional Sentry - will be loaded dynamically if available
let Sentry: any = null;

/**
 * Initialize Sentry with environment-specific configuration
 */
export async function initSentry() {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    return;
  }

  try {
    const sentryModule = '@sentry/nextjs';
    const importedSentry = await import(/* webpackIgnore: true */ sentryModule).catch(() => null);
    if (!importedSentry) {
      console.warn('Sentry not available - error tracking disabled');
      return;
    }
    
    Sentry = importedSentry;
  } catch (error) {
    console.warn('Failed to load Sentry:', error);
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling (optional, resource intensive)
    profilesSampleRate: 0.1,
    
    // Environment and release tracking
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    
    // Error filtering
    beforeSend(event: any) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' || 
            error?.value?.includes('Loading chunk')) {
          return null; // Don't send chunk loading errors
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'ai-personal-trainer',
        version: process.env.npm_package_version || '0.1.0'
      }
    },
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Track navigation and page loads
        routingInstrumentation: Sentry.nextRouterInstrumentation,
        
        // Performance monitoring for key interactions
        tracingOrigins: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          /^https:\/\/ai-personal-trainer/
        ]
      })
    ]
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  subscription?: string;
}) {
  if (!Sentry) {return;}
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    subscription: user.subscription
  });
}

/**
 * Add custom tags to error reports
 */
export function addContextTags(tags: Record<string, string>) {
  if (!Sentry) {return;}
  
  Sentry.setTags(tags);
}

/**
 * Track custom events and metrics
 */
export function trackEvent(
  name: string, 
  data?: Record<string, any>,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  if (!Sentry) {return;}
  
  Sentry.addBreadcrumb({
    message: name,
    data,
    level,
    timestamp: Date.now() / 1000
  });
}

/**
 * Track workout generation performance
 */
export function trackWorkoutGeneration(
  duration: number,
  exerciseCount: number,
  success: boolean
) {
  if (!Sentry) {return;}
  
  const transaction = Sentry.startTransaction({
    name: 'workout-generation',
    op: 'ai-processing'
  });
  
  transaction.setTag('exercise-count', exerciseCount.toString());
  transaction.setTag('success', success.toString());
  transaction.setMeasurement('duration', duration, 'millisecond');
  
  transaction.finish();
}

/**
 * Track API response times
 */
export function trackApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  if (!Sentry) {return;}
  
  const transaction = Sentry.startTransaction({
    name: `${method} ${endpoint}`,
    op: 'http.server'
  });
  
  transaction.setTag('method', method);
  transaction.setTag('endpoint', endpoint);
  transaction.setTag('status_code', statusCode.toString());
  transaction.setMeasurement('response_time', duration, 'millisecond');
  
  transaction.finish();
}

/**
 * Enhanced error reporting with context
 */
export function reportError(
  error: Error,
  context?: {
    user_id?: string;
    workout_id?: string;
    exercise_id?: string;
    action?: string;
    additional_data?: Record<string, any>;
  }
) {
  if (!Sentry) {
    console.error('Error (Sentry disabled):', error, context);
    return;
  }
  
  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext('error_context', context);
      
      if (context.user_id) {
        scope.setTag('user_id', context.user_id);
      }
      
      if (context.workout_id) {
        scope.setTag('workout_id', context.workout_id);
      }
      
      if (context.action) {
        scope.setTag('action', context.action);
      }
    }
    
    Sentry.captureException(error);
  });
}

/**
 * Performance monitoring wrapper for async functions
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    if (!Sentry) {
      return fn(...args);
    }
    
    const transaction = Sentry.startTransaction({
      name: operationName,
      op: 'function'
    });
    
    const start = Date.now();
    
    return fn(...args)
      .then((result) => {
        transaction.setTag('success', 'true');
        transaction.setMeasurement('duration', Date.now() - start, 'millisecond');
        transaction.finish();
        return result;
      })
      .catch((error) => {
        transaction.setTag('success', 'false');
        transaction.setMeasurement('duration', Date.now() - start, 'millisecond');
        reportError(error, { action: operationName });
        transaction.finish();
        throw error;
      });
  }) as T;
}