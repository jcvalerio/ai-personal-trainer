/**
 * Dashboard Recent Activity API Route
 * Returns recent user activities for dashboard display
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

import { getUserProfileByClerkId } from '@/lib/db/auth';

interface ActivityItem {
  id: string;
  type: 'workout_completed' | 'plan_created' | 'session_started';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

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

    // Get user profile
    const userProfile = await getUserProfileByClerkId(userId);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const activities: ActivityItem[] = [];

    try {
      // Recent completed workouts
      const completedWorkouts = await db`
        SELECT 
          ws.id,
          ws.name,
          ws.completed_at,
          ws.actual_duration,
          ws.scheduled_duration,
          wp.name as plan_name
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'completed'
        AND ws.completed_at IS NOT NULL
        ORDER BY ws.completed_at DESC
        LIMIT 5
      `;

      completedWorkouts.forEach((workout) => {
        const duration = workout.actual_duration || workout.scheduled_duration || 0;
        activities.push({
          id: `workout-${workout.id}`,
          type: 'workout_completed',
          title: 'Workout Completed',
          description: `Finished "${workout.name}" ${duration ? `in ${duration} minutes` : ''}`,
          timestamp: workout.completed_at,
          metadata: {
            sessionId: workout.id,
            sessionName: workout.name,
            planName: workout.plan_name,
            duration: duration,
          },
        });
      });

      // Recent created plans
      const createdPlans = await db`
        SELECT 
          wp.id,
          wp.name,
          wp.created_at,
          wp.duration_weeks,
          wp.sessions_per_week
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        WHERE up.clerk_user_id = ${userId}
        AND wp.is_active = true
        ORDER BY wp.created_at DESC
        LIMIT 3
      `;

      createdPlans.forEach((plan) => {
        activities.push({
          id: `plan-${plan.id}`,
          type: 'plan_created',
          title: 'Workout Plan Created',
          description: `Created "${plan.name}" - ${plan.duration_weeks} weeks, ${plan.sessions_per_week} sessions/week`,
          timestamp: plan.created_at,
          metadata: {
            planId: plan.id,
            planName: plan.name,
            durationWeeks: plan.duration_weeks,
            sessionsPerWeek: plan.sessions_per_week,
          },
        });
      });

      // Recent started sessions
      const startedSessions = await db`
        SELECT 
          ws.id,
          ws.name,
          ws.started_at,
          ws.status,
          wp.name as plan_name
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        WHERE up.clerk_user_id = ${userId}
        AND ws.status = 'in_progress'
        AND ws.started_at IS NOT NULL
        ORDER BY ws.started_at DESC
        LIMIT 3
      `;

      startedSessions.forEach((session) => {
        activities.push({
          id: `session-${session.id}`,
          type: 'session_started',
          title: 'Session Started',
          description: `Started "${session.name}"${session.plan_name ? ` from ${session.plan_name}` : ''}`,
          timestamp: session.started_at,
          metadata: {
            sessionId: session.id,
            sessionName: session.name,
            planName: session.plan_name,
            status: session.status,
          },
        });
      });

    } catch (dbError) {
      console.warn('Database error fetching activities:', dbError);
      // Return empty activities rather than failing entirely
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to most recent 10 activities
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: recentActivities,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    
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