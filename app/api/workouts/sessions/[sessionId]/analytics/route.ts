/**
 * Session Analytics API Route
 * Provides real-time analytics and insights for workout sessions
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { workoutSessionRepository } from '@/lib/repositories/workout-session.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import { sessionAnalyticsQuerySchema } from '@/lib/validation/workout-schemas';

/**
 * GET /api/workouts/sessions/[sessionId]/analytics
 * Get comprehensive analytics for a specific workout session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Await params before using (Next.js 15 requirement)
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID', code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Convert string booleans to actual booleans for validation
    const processedParams = {
      ...queryParams,
      includePerformanceMetrics: queryParams.includePerformanceMetrics !== 'false',
      includeProgressComparison: queryParams.includeProgressComparison !== 'false',
      includeMuscleGroupAnalysis: queryParams.includeMuscleGroupAnalysis === 'true',
      includeCalorieEstimation: queryParams.includeCalorieEstimation !== 'false',
    };

    const validatedQuery = sessionAnalyticsQuerySchema.safeParse(processedParams);
    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: validatedQuery.error.issues,
        },
        { status: 400 }
      );
    }

    const analyticsOptions = validatedQuery.data;

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `session_analytics:${userId}:${sessionId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Session analytics rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Get user profile for context
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Verify session exists and user has access
    const session = await workoutSessionRepository.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check access permissions
    if (session.userId !== userId && session.organizationId !== (orgId || userProfile.organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    // Get comprehensive session analytics
    const analytics = await generateSessionAnalytics(session, sessionId, analyticsOptions);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        sessionId,
      },
    });
  } catch (error) {
    console.error('Error generating session analytics:', error);
    const authResult = await auth();
    const { sessionId: sessionIdForError } = await params;
    await logAuthEvent(
      'session_analytics_failed',
      'security',
      'Session analytics generation failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { 
        error: (error as Error).message,
        sessionId: sessionIdForError,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive analytics for a workout session
 */
async function generateSessionAnalytics(session: any, sessionId: string, options: any = {}) {
  const exercises = session.exercises || [];
  const now = new Date();

  // Basic session metrics
  const basicMetrics = {
    sessionId,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    scheduledDuration: session.scheduledDuration,
    actualDuration: session.actualDuration,
    completionPercentage: session.completionPercentage || 0,
  };

  // Exercise progress metrics
  const exerciseMetrics = calculateExerciseMetrics(exercises);

  // Performance metrics
  const performanceMetrics = calculatePerformanceMetrics(exercises, session);

  // Time-based analytics
  const timeAnalytics = calculateTimeAnalytics(session, exercises);

  // Effort and intensity metrics
  const effortMetrics = calculateEffortMetrics(exercises, session);

  // Muscle group analytics
  const muscleGroupAnalytics = await calculateMuscleGroupAnalytics(exercises);

  // Volume and load analytics
  const volumeAnalytics = calculateVolumeAnalytics(exercises);

  // Progress tracking
  const progressTracking = await calculateProgressTracking(sessionId, session.userId);

  // Real-time insights and recommendations
  const insights = generateRealTimeInsights(exercises, session);

  return {
    basic: basicMetrics,
    exercise: exerciseMetrics,
    performance: performanceMetrics,
    time: timeAnalytics,
    effort: effortMetrics,
    muscleGroups: muscleGroupAnalytics,
    volume: volumeAnalytics,
    progress: progressTracking,
    insights,
    generatedAt: now.toISOString(),
  };
}

/**
 * Calculate exercise-specific metrics
 */
function calculateExerciseMetrics(exercises: any[]) {
  const total = exercises.length;
  const completed = exercises.filter(ex => ex.status === 'completed').length;
  const skipped = exercises.filter(ex => ex.status === 'skipped').length;
  const inProgress = exercises.filter(ex => ex.status === 'in_progress').length;
  const pending = exercises.filter(ex => ex.status === 'pending').length;

  return {
    total,
    completed,
    skipped,
    inProgress,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    skipRate: total > 0 ? Math.round((skipped / total) * 100) : 0,
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(exercises: any[], session: any) {
  const completedExercises = exercises.filter(ex => ex.status === 'completed');
  
  if (completedExercises.length === 0) {
    return {
      averagePerceivedExertion: null,
      averageFormRating: null,
      totalSets: 0,
      totalReps: 0,
      averageRestTime: null,
    };
  }

  const allSets = completedExercises.flatMap(ex => ex.sets || []);
  const validPE = completedExercises
    .map(ex => ex.perceivedExertion)
    .filter(pe => pe !== null && pe !== undefined);
  const validFormRatings = completedExercises
    .map(ex => ex.formRating)
    .filter(rating => rating !== null && rating !== undefined);

  return {
    averagePerceivedExertion: validPE.length > 0 
      ? Math.round((validPE.reduce((sum, pe) => sum + pe, 0) / validPE.length) * 10) / 10 
      : null,
    averageFormRating: validFormRatings.length > 0 
      ? Math.round((validFormRatings.reduce((sum, rating) => sum + rating, 0) / validFormRatings.length) * 10) / 10 
      : null,
    totalSets: allSets.length,
    totalReps: allSets.reduce((sum, set) => sum + (set.reps || 0), 0),
    averageRestTime: calculateAverageRestTime(allSets),
  };
}

/**
 * Calculate time-based analytics
 */
function calculateTimeAnalytics(session: any, exercises: any[]) {
  const now = new Date();
  const startTime = session.startedAt ? new Date(session.startedAt) : null;
  const endTime = session.completedAt ? new Date(session.completedAt) : null;

  let currentDuration = 0;
  if (startTime) {
    currentDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60); // minutes
  }

  const exerciseDurations = exercises
    .filter(ex => ex.completedAt && ex.startedAt)
    .map(ex => ({
      exerciseId: ex.exerciseId,
      duration: Math.floor((new Date(ex.completedAt).getTime() - new Date(ex.startedAt).getTime()) / 1000 / 60),
    }));

  return {
    currentDuration,
    scheduledDuration: session.scheduledDuration,
    actualDuration: session.actualDuration,
    estimatedTimeRemaining: estimateRemainingTime(exercises, session.scheduledDuration),
    exerciseDurations,
    isOnTrack: currentDuration <= (session.scheduledDuration * 1.1), // 10% buffer
  };
}

/**
 * Calculate effort and intensity metrics
 */
function calculateEffortMetrics(exercises: any[], session: any) {
  const completedExercises = exercises.filter(ex => ex.status === 'completed');
  
  if (completedExercises.length === 0) {
    return {
      overallIntensity: 'low',
      effortDistribution: { low: 0, moderate: 0, high: 0 },
      fatigueLevel: 'low',
    };
  }

  const peValues = completedExercises
    .map(ex => ex.perceivedExertion)
    .filter(pe => pe !== null && pe !== undefined);

  const avgPE = peValues.length > 0 ? peValues.reduce((sum, pe) => sum + pe, 0) / peValues.length : 5;

  let overallIntensity = 'low';
  if (avgPE >= 7) overallIntensity = 'high';
  else if (avgPE >= 4) overallIntensity = 'moderate';

  const effortDistribution = {
    low: peValues.filter(pe => pe <= 3).length,
    moderate: peValues.filter(pe => pe > 3 && pe <= 6).length,
    high: peValues.filter(pe => pe > 6).length,
  };

  return {
    overallIntensity,
    averagePerceivedExertion: Math.round(avgPE * 10) / 10,
    effortDistribution,
    fatigueLevel: avgPE >= 8 ? 'high' : avgPE >= 5 ? 'moderate' : 'low',
  };
}

/**
 * Calculate muscle group analytics
 */
async function calculateMuscleGroupAnalytics(exercises: any[]) {
  const muscleGroupCounts: Record<string, number> = {};
  const muscleGroupLoad: Record<string, number> = {};

  exercises.forEach(exercise => {
    // This would ideally fetch exercise details to get muscle groups
    // For now, we'll use placeholder logic
    if (exercise.targetMuscleGroups) {
      exercise.targetMuscleGroups.forEach((muscle: string) => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
        
        // Calculate load based on sets and reps
        const totalVolume = (exercise.sets || []).reduce((sum: number, set: any) => {
          return sum + (set.reps || 0) * (set.weight || 1);
        }, 0);
        
        muscleGroupLoad[muscle] = (muscleGroupLoad[muscle] || 0) + totalVolume;
      });
    }
  });

  return {
    muscleGroupCounts,
    muscleGroupLoad,
    primaryFocus: Object.entries(muscleGroupCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
  };
}

/**
 * Calculate volume and load analytics
 */
function calculateVolumeAnalytics(exercises: any[]) {
  const completedExercises = exercises.filter(ex => ex.status === 'completed');
  
  let totalVolume = 0;
  let totalLoad = 0;
  let totalDistance = 0;
  let totalDuration = 0;

  completedExercises.forEach(exercise => {
    (exercise.sets || []).forEach((set: any) => {
      totalVolume += (set.reps || 0);
      totalLoad += (set.reps || 0) * (set.weight || 0);
      totalDistance += (set.distance || 0);
      totalDuration += (set.duration || 0);
    });
  });

  return {
    totalVolume,
    totalLoad,
    totalDistance,
    totalDuration,
    averageLoadPerSet: completedExercises.length > 0 ? Math.round(totalLoad / completedExercises.length) : 0,
  };
}

/**
 * Calculate progress tracking metrics
 */
async function calculateProgressTracking(sessionId: string, userId: string) {
  try {
    // Get recent sessions for comparison
    const recentSessions = await workoutSessionRepository.findByUserId(
      userId, 
      { limit: 5, orderBy: 'created_at', orderDirection: 'DESC' }
    );

    const currentSessionIndex = recentSessions.findIndex(s => s.id === sessionId);
    const previousSessions = recentSessions.slice(currentSessionIndex + 1);

    if (previousSessions.length === 0) {
      return {
        isFirstSession: true,
        trends: null,
        improvements: [],
      };
    }

    // Calculate trends and improvements
    const trends = calculateTrends(recentSessions);
    const improvements = identifyImprovements(recentSessions[0], previousSessions[0]);

    return {
      isFirstSession: false,
      trends,
      improvements,
      sessionsCompared: previousSessions.length,
    };
  } catch (error) {
    console.warn('Error calculating progress tracking:', error);
    return {
      isFirstSession: true,
      trends: null,
      improvements: [],
    };
  }
}

/**
 * Generate real-time insights and recommendations
 */
function generateRealTimeInsights(exercises: any[], session: any) {
  const insights = [];
  const recommendations = [];

  // Completion pace insights
  const completedCount = exercises.filter(ex => ex.status === 'completed').length;
  const totalCount = exercises.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) : 0;

  if (completionRate < 0.3 && session.status === 'in_progress') {
    insights.push('You\'re taking your time with each exercise - focus on form over speed!');
  } else if (completionRate > 0.8) {
    insights.push('Great progress! You\'re almost done with this session.');
  }

  // Effort level insights
  const avgPE = exercises
    .filter(ex => ex.perceivedExertion)
    .reduce((sum, ex) => sum + ex.perceivedExertion, 0) / exercises.filter(ex => ex.perceivedExertion).length;

  if (avgPE > 8) {
    recommendations.push('Consider longer rest periods between sets to maintain form');
  } else if (avgPE < 4) {
    recommendations.push('You might be able to increase intensity slightly');
  }

  // Form quality insights
  const avgForm = exercises
    .filter(ex => ex.formRating)
    .reduce((sum, ex) => sum + ex.formRating, 0) / exercises.filter(ex => ex.formRating).length;

  if (avgForm < 3) {
    recommendations.push('Focus on form over weight/reps for better results');
  }

  return {
    insights,
    recommendations,
    motivationalMessage: generateMotivationalMessage(completionRate, avgPE),
  };
}

/**
 * Helper functions
 */
function calculateAverageRestTime(sets: any[]): number | null {
  const restTimes = sets.filter(set => set.restSeconds).map(set => set.restSeconds);
  return restTimes.length > 0 ? Math.round(restTimes.reduce((sum, rest) => sum + rest, 0) / restTimes.length) : null;
}

function estimateRemainingTime(exercises: any[], scheduledDuration: number): number {
  const completed = exercises.filter(ex => ex.status === 'completed').length;
  const total = exercises.length;
  
  if (total === 0) return scheduledDuration;
  
  const completionRate = completed / total;
  const estimatedTotal = scheduledDuration / (completionRate || 0.1);
  
  return Math.max(0, Math.round(estimatedTotal - scheduledDuration));
}

function calculateTrends(sessions: any[]) {
  if (sessions.length < 2) return null;

  const recent = sessions[0];
  const previous = sessions[1];

  return {
    durationTrend: recent.actualDuration > previous.actualDuration ? 'increasing' : 'decreasing',
    completionTrend: recent.completionPercentage > previous.completionPercentage ? 'improving' : 'declining',
    effortTrend: recent.effortRating > previous.effortRating ? 'increasing' : 'decreasing',
  };
}

function identifyImprovements(current: any, previous: any) {
  const improvements = [];

  if (current.completionPercentage > previous.completionPercentage) {
    improvements.push({
      metric: 'completion',
      improvement: `${current.completionPercentage - previous.completionPercentage}% better completion`,
    });
  }

  if (current.actualDuration && previous.actualDuration && current.actualDuration < previous.actualDuration) {
    improvements.push({
      metric: 'efficiency',
      improvement: `${previous.actualDuration - current.actualDuration} minutes faster`,
    });
  }

  return improvements;
}

function generateMotivationalMessage(completionRate: number, avgPE: number): string {
  if (completionRate >= 0.9) {
    return "Outstanding work! You're crushing this session! 💪";
  } else if (completionRate >= 0.7) {
    return "Great job! Keep up the momentum! 🔥";
  } else if (completionRate >= 0.5) {
    return "You're halfway there! Stay strong! 💪";
  } else if (avgPE > 7) {
    return "High intensity work! Remember to focus on form! 🎯";
  } else {
    return "Every rep counts! Keep pushing forward! 🚀";
  }
}