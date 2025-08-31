/**
 * Workout Statistics API Route
 * Returns workout statistics and trends for the user
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

import { getUserProfileByClerkId } from '@/lib/db/auth';
import { workoutStatsQuerySchema } from '@/lib/validation/workout-schemas';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Convert string booleans to actual booleans for validation
    const processedParams = {
      ...queryParams,
      includeExerciseBreakdown: queryParams.includeExerciseBreakdown === 'true',
      includeMuscleGroupAnalysis: queryParams.includeMuscleGroupAnalysis === 'true',
    };

    const validatedQuery = workoutStatsQuerySchema.safeParse(processedParams);
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

    const statsOptions = validatedQuery.data;

    // Get user profile
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);

    // Fetch statistics with proper error handling
    const stats = await Promise.all([
      // Total completed workouts
      db`
        SELECT COUNT(*) as count 
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
      `.catch(() => [{ count: '0' }]),

      // Workouts this week
      db`
        SELECT COUNT(*) as count 
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
        AND ws.completed_at >= ${weekStart.toISOString()}
        AND ws.completed_at < ${weekEnd.toISOString()}
      `.catch(() => [{ count: '0' }]),

      // Workouts last week (for trends)
      db`
        SELECT COUNT(*) as count 
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
        AND ws.completed_at >= ${lastWeekStart.toISOString()}
        AND ws.completed_at < ${lastWeekEnd.toISOString()}
      `.catch(() => [{ count: '0' }]),

      // Total workout minutes
      db`
        SELECT COALESCE(SUM(
          CASE 
            WHEN ws.actual_duration IS NOT NULL THEN ws.actual_duration
            ELSE ws.scheduled_duration
          END
        ), 0) as total_minutes
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
      `.catch(() => [{ total_minutes: '0' }]),

      // Average effort rating
      db`
        SELECT COALESCE(AVG(ws.effort_rating), 0) as avg_rating
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
        AND ws.effort_rating IS NOT NULL
      `.catch(() => [{ avg_rating: '0' }]),

      // Completion rate (completed vs scheduled)
      db`
        SELECT 
          COUNT(CASE WHEN ws.status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.created_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
      `.catch(() => [{ completed: '0', total: '1' }])
    ]);

    // Calculate current streak
    let currentStreak = 0;
    try {
      const streakResult = await db`
        WITH daily_workouts AS (
          SELECT 
            DATE(ws.completed_at) as workout_date
          FROM workout_sessions ws
          JOIN user_profiles up ON ws.user_id = up.id
          WHERE up.clerk_user_id = ${userId}
          AND ws.status = 'completed'
          AND ws.completed_at IS NOT NULL
          GROUP BY DATE(ws.completed_at)
          ORDER BY workout_date DESC
          LIMIT 30
        ),
        streak_calc AS (
          SELECT 
            workout_date,
            ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn,
            DATE(NOW()) - workout_date as days_ago
          FROM daily_workouts
        )
        SELECT COUNT(*) as streak_days
        FROM streak_calc
        WHERE days_ago = rn - 1
      `;
      
      currentStreak = parseInt(streakResult[0]?.streak_days || '0');
    } catch (error) {
      console.warn('Error calculating streak:', error);
      currentStreak = 0;
    }

    // Calculate workout stats
    const totalWorkouts = parseInt(stats[0][0]?.count || '0');
    const weeklyWorkouts = parseInt(stats[1][0]?.count || '0');
    const lastWeekWorkouts = parseInt(stats[2][0]?.count || '0');
    const totalMinutes = parseInt(stats[3][0]?.total_minutes || '0');
    const avgRating = parseFloat(stats[4][0]?.avg_rating || '0');
    const completed = parseInt(stats[5][0]?.completed || '0');
    const total = parseInt(stats[5][0]?.total || '1');
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate trends
    const workoutTrend = lastWeekWorkouts === 0 
      ? (weeklyWorkouts > 0 ? 'up' : 'same')
      : weeklyWorkouts > lastWeekWorkouts ? 'up' 
      : weeklyWorkouts < lastWeekWorkouts ? 'down' : 'same';

    const workoutTrendValue = lastWeekWorkouts === 0 
      ? weeklyWorkouts 
      : Math.abs(weeklyWorkouts - lastWeekWorkouts);

    const workoutStats = {
      stats: {
        totalWorkouts,
        weeklyWorkouts,
        currentStreak,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        averageIntensity: Math.round(avgRating * 10) / 10,
        completionRate,
      },
      trends: {
        workouts: { 
          value: workoutTrendValue, 
          direction: workoutTrend as 'up' | 'down' | 'same'
        },
        streak: { 
          value: 0, // TODO: Calculate streak trend
          direction: 'same' as 'up' | 'down' | 'same'
        },
        intensity: { 
          value: 0, // TODO: Calculate intensity trend
          direction: 'same' as 'up' | 'down' | 'same'
        },
        completion: { 
          value: completionRate > 80 ? 5 : completionRate > 60 ? 0 : -5, 
          direction: completionRate > 80 ? 'up' as const : completionRate > 60 ? 'same' as const : 'down' as const
        },
      }
    };

    return NextResponse.json({
      success: true,
      data: workoutStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching workout stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}