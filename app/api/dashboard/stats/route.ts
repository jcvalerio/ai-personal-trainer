/**
 * Dashboard Statistics API Route
 * Returns aggregated user statistics for dashboard display
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

import { getUserProfileByClerkId } from '@/lib/db/auth';
import { dashboardStatsQuerySchema } from '@/lib/validation/workout-schemas';

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
      includeGoalProgress: queryParams.includeGoalProgress === 'true',
      includeStreakInfo: queryParams.includeStreakInfo === 'true',
      includeRecentActivity: queryParams.includeRecentActivity === 'true',
    };

    const validatedQuery = dashboardStatsQuerySchema.safeParse(processedParams);
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

    const { timeframe, includeGoalProgress, includeStreakInfo, includeRecentActivity } = validatedQuery.data;

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

    // Fetch statistics with proper error handling
    const stats = await Promise.all([
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

      // Total completed workouts
      db`
        SELECT COUNT(*) as count 
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
      `.catch(() => [{ count: '0' }]),

      // Active workout plans
      db`
        SELECT COUNT(*) as count 
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND wp.status = 'active'
        AND wp.is_active = true
      `.catch(() => [{ count: '0' }]),

      // Total workout hours (approximate from completed sessions)
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
      `.catch(() => [{ total_minutes: '0' }])
    ]);

    // Calculate current streak (simplified version)
    let currentStreak = 0;
    try {
      const streakResult = await db`
        WITH daily_workouts AS (
          SELECT 
            DATE(ws.completed_at) as workout_date,
            COUNT(*) as workouts_count
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

    const dashboardStats = {
      workoutsThisWeek: parseInt(stats[0][0]?.count || '0'),
      totalWorkouts: parseInt(stats[1][0]?.count || '0'),
      activeWorkoutPlans: parseInt(stats[2][0]?.count || '0'),
      totalHours: Math.round((parseInt(stats[3][0]?.total_minutes || '0')) / 60 * 10) / 10,
      currentStreak,
      completedSessions: parseInt(stats[1][0]?.count || '0'), // Same as total workouts
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
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