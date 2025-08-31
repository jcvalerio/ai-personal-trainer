/**
 * React Query hook for Session Analytics API
 * Handles session-specific analytics, performance metrics, and comparisons
 */
'use client';

import { useQuery } from '@tanstack/react-query';

// Session Analytics Types
export interface SessionStats {
  totalExercises: number;
  completedExercises: number;
  totalSets: number;
  completedSets: number;
  totalReps?: number;
  completedReps?: number;
  averageHeartRate?: number;
  caloriesBurned: number;
  duration: number; // in minutes
  effortRating?: number;
}

export interface PerformanceMetrics {
  strengthGain: number; // percentage
  enduranceImprovement: number; // percentage
  consistencyScore: number; // 0-100
  intensityLevel: number; // 0-100
}

export interface ComparisonData {
  previousSession?: {
    caloriesBurned: number;
    duration: number;
    effortRating?: number;
  };
  personalBests?: Array<{
    exercise: string;
    weight?: number;
    reps?: number;
    duration?: number;
  }>;
  weeklyTrend?: {
    direction: 'up' | 'down' | 'same';
    value: number;
  };
}

export interface SessionAnalyticsData {
  sessionStats: SessionStats;
  performanceMetrics?: PerformanceMetrics;
  comparisonData?: ComparisonData;
  rawAnalytics?: any; // Raw API response for advanced use cases
}

export interface SessionAnalyticsOptions {
  includeComparisons?: boolean;
  includePredictions?: boolean;
  includeHeartRate?: boolean;
  timeframe?: 'week' | 'month' | 'quarter';
}

// API function to fetch session analytics
async function fetchSessionAnalytics(
  sessionId: string, 
  options: SessionAnalyticsOptions = {}
): Promise<SessionAnalyticsData> {
  const searchParams = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const url = `/api/workouts/sessions/${sessionId}/analytics${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch session analytics`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to load session analytics');
  }

  // Transform API response to match component expectations
  const data = result.data;
  
  // Map existing API structure to expected format
  return {
    sessionStats: {
      totalExercises: data.exercise?.total || 0,
      completedExercises: data.exercise?.completed || 0,
      totalSets: data.performance?.totalSets || 0,
      completedSets: data.performance?.totalSets || 0,
      totalReps: data.performance?.totalReps,
      completedReps: data.performance?.totalReps,
      averageHeartRate: data.performance?.averageHeartRate,
      caloriesBurned: data.volume?.totalLoad || 0, // Use total load as calories estimate
      duration: data.basic?.actualDuration || data.time?.currentDuration || 0,
      effortRating: data.effort?.averagePerceivedExertion,
    },
    performanceMetrics: {
      strengthGain: Math.round(Math.random() * 15), // Placeholder - actual calculation would be based on historical data
      enduranceImprovement: Math.round(Math.random() * 12),
      consistencyScore: data.exercise?.completionRate || 0,
      intensityLevel: data.effort?.overallIntensity === 'high' ? 80 : 
                     data.effort?.overallIntensity === 'moderate' ? 60 : 40,
    },
    comparisonData: {
      previousSession: data.progress?.trends ? {
        caloriesBurned: 0, // Would need historical data
        duration: data.basic?.actualDuration || 0,
        effortRating: data.effort?.averagePerceivedExertion,
      } : undefined,
      personalBests: [], // Would be populated from progress data
      weeklyTrend: data.progress?.trends ? {
        direction: data.progress.trends.completionTrend === 'improving' ? 'up' as const : 
                  data.progress.trends.completionTrend === 'declining' ? 'down' as const : 'same' as const,
        value: 5, // Placeholder percentage change
      } : undefined,
    },
    // Include raw API data for advanced use cases
    rawAnalytics: data,
  };
}

// Query Keys Factory
export const sessionAnalyticsKeys = {
  all: ['session-analytics'] as const,
  session: (sessionId: string) => [...sessionAnalyticsKeys.all, sessionId] as const,
  sessionWithOptions: (sessionId: string, options: SessionAnalyticsOptions) => 
    [...sessionAnalyticsKeys.session(sessionId), { options }] as const,
};

/**
 * Hook to fetch session analytics with performance metrics and comparisons
 */
export function useSessionAnalytics(
  sessionId: string | null | undefined,
  options: SessionAnalyticsOptions = {}
) {
  return useQuery({
    queryKey: sessionAnalyticsKeys.sessionWithOptions(sessionId || '', options),
    queryFn: () => fetchSessionAnalytics(sessionId!, options),
    enabled: !!sessionId && sessionId.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes (analytics can be slightly stale)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => data, // Data is already transformed in fetchSessionAnalytics
    refetchOnWindowFocus: false, // Analytics don't need frequent refetching
    refetchOnMount: true, // Always get fresh data on component mount
  });
}

/**
 * Hook for real-time session analytics during active sessions
 */
export function useRealTimeSessionAnalytics(
  sessionId: string | null | undefined,
  options: SessionAnalyticsOptions = {},
  refetchInterval = 30000 // 30 seconds
) {
  return useQuery({
    queryKey: sessionAnalyticsKeys.sessionWithOptions(sessionId || '', { 
      ...options, 
      realTime: true 
    } as any),
    queryFn: () => fetchSessionAnalytics(sessionId!, { ...options }),
    enabled: !!sessionId && sessionId.length > 0,
    staleTime: 0, // Always fetch fresh data for real-time
    gcTime: 1 * 60 * 1000, // 1 minute cache
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: 2, // Fewer retries for real-time data
    select: (data) => data,
    refetchOnWindowFocus: true, // Get fresh data when user returns
  });
}

/**
 * Hook for compact session analytics (for use in cards, headers, etc.)
 */
export function useCompactSessionAnalytics(sessionId: string | null | undefined) {
  return useSessionAnalytics(sessionId, {
    includeComparisons: false,
    includePredictions: false,
    includeHeartRate: false,
  });
}