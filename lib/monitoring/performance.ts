/**
 * Performance Monitoring Utilities
 * 
 * Client-side and server-side performance tracking for the AI Personal Trainer app.
 * Includes Web Vitals, API response times, and user experience metrics.
 */

import { trackEvent, trackApiPerformance } from './sentry';

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: 2500,    // Largest Contentful Paint
  FID: 100,     // First Input Delay  
  CLS: 0.1,     // Cumulative Layout Shift
  
  // API Response times
  API_FAST: 200,
  API_ACCEPTABLE: 1000,
  API_SLOW: 3000,
  
  // Workout generation
  WORKOUT_GENERATION: 5000,
  
  // Database queries
  DB_QUERY: 100,
  DB_COMPLEX_QUERY: 500
} as const;

/**
 * Performance metrics collection
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url?: string;
  userId?: string;
}

/**
 * Track Web Vitals using the web-vitals library pattern
 */
export function initWebVitals() {
  if (typeof window === 'undefined') {return;}
  
  // Dynamically import web-vitals to avoid SSR issues
  const vitalsModule = 'web-vitals';
  import(/* webpackIgnore: true */ vitalsModule).then(({ getCLS, getFID, getFCP, getLCP, getTTFB }: any) => {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }).catch(error => {
    console.warn('Web Vitals tracking failed:', error);
  });
}

/**
 * Handle performance entry reporting
 */
function onPerfEntry(metric: any) {
  const { name, value, rating } = metric;
  
  // Report to analytics
  trackEvent('web-vital', {
    metric_name: name,
    metric_value: value,
    metric_rating: rating,
    url: window.location.pathname
  });
  
  // Log poor performance
  if (rating === 'poor') {
    console.warn(`Poor ${name} performance: ${value}ms`);
  }
}

/**
 * API Performance monitoring middleware
 */
export class ApiPerformanceMonitor {
  private static instance: ApiPerformanceMonitor;
  
  static getInstance(): ApiPerformanceMonitor {
    if (!this.instance) {
      this.instance = new ApiPerformanceMonitor();
    }
    return this.instance;
  }
  
  /**
   * Track API call performance
   */
  async trackApiCall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let statusCode = 200;
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      // Track successful API call
      trackApiPerformance(endpoint, method, duration, statusCode);
      
      // Log slow API calls
      if (duration > PERFORMANCE_THRESHOLDS.API_SLOW) {
        console.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      statusCode = error instanceof Error && 'status' in error ? 
                   (error as any).status : 500;
      
      // Track failed API call
      trackApiPerformance(endpoint, method, duration, statusCode);
      
      throw error;
    }
  }
}

/**
 * Database query performance tracking
 */
export function trackDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  return withTimer(query, `db-query-${queryName}`, (duration) => {
    if (duration > PERFORMANCE_THRESHOLDS.DB_COMPLEX_QUERY) {
      console.warn(`Slow database query: ${queryName} took ${duration}ms`);
    }
    
    trackEvent('database-query', {
      query_name: queryName,
      duration,
      rating: duration > PERFORMANCE_THRESHOLDS.DB_COMPLEX_QUERY ? 'poor' : 'good'
    });
  });
}

/**
 * Workout generation performance tracking
 */
export function trackWorkoutGeneration<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withTimer(operation, 'workout-generation', (duration) => {
    const rating = duration > PERFORMANCE_THRESHOLDS.WORKOUT_GENERATION ? 'poor' : 'good';
    
    trackEvent('workout-generation', {
      duration,
      rating
    });
    
    if (rating === 'poor') {
      console.warn(`Slow workout generation: ${duration}ms`);
    }
  });
}

/**
 * Generic timer utility
 */
export async function withTimer<T>(
  operation: () => Promise<T>,
  operationName: string,
  callback?: (duration: number) => void
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    if (callback) {
      callback(duration);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (callback) {
      callback(duration);
    }
    
    throw error;
  }
}

/**
 * Memory usage tracking (Node.js only)
 */
export function trackMemoryUsage() {
  if (typeof process === 'undefined') {return;}
  
  const memUsage = process.memoryUsage();
  
  trackEvent('memory-usage', {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024) // MB
  });
  
  // Warn on high memory usage
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 512) {
    console.warn(`High memory usage: ${heapUsedMB.toFixed(2)}MB`);
  }
}

/**
 * User interaction performance tracking
 */
export function trackUserInteraction(
  action: string,
  element?: string,
  duration?: number
) {
  trackEvent('user-interaction', {
    action,
    element,
    duration,
    url: typeof window !== 'undefined' ? window.location.pathname : undefined
  });
}

/**
 * Page load performance tracking
 */
export function trackPageLoad(pageName: string) {
  if (typeof window === 'undefined') {return;}
  
  // Wait for the page to be fully loaded
  if (document.readyState === 'complete') {
    measurePageLoad(pageName);
  } else {
    window.addEventListener('load', () => measurePageLoad(pageName));
  }
}

function measurePageLoad(pageName: string) {
  if (typeof window === 'undefined' || !window.performance) {return;}
  
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigation) {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    
    trackEvent('page-load', {
      page_name: pageName,
      load_time: loadTime,
      dom_content_loaded: domContentLoaded,
      rating: loadTime > 3000 ? 'poor' : loadTime > 1000 ? 'needs-improvement' : 'good'
    });
  }
}

/**
 * Resource loading performance tracking
 */
export function trackResourceLoading() {
  if (typeof window === 'undefined' || !window.performance) {return;}
  
  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  resources.forEach((resource) => {
    const duration = resource.responseEnd - resource.fetchStart;
    
    // Only track significant resources
    if (duration > 100) {
      trackEvent('resource-load', {
        resource_name: resource.name.split('/').pop() || 'unknown',
        resource_type: resource.initiatorType,
        duration,
        size: resource.transferSize || 0
      });
    }
  });
}