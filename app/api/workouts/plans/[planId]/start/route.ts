/**
 * Start Workout Plan API Route
 * Transitions a workout plan from draft to active status
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

const workoutService = new WorkoutService();

// Validation schema for start plan request
const startPlanSchema = z.object({
  scheduleStartDate: z.string().datetime().optional(),
  generateInitialSessions: z.boolean().default(true),
});

/**
 * POST /api/workouts/plans/[planId]/start
 * Start a workout plan and transition from draft to active
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const { planId } = await params;

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `start_workout_plan:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Start workout plan rate limit exceeded',
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

    // Parse and validate request body
    let body = {};
    try {
      const rawBody = await request.text();
      if (rawBody.trim()) {
        body = JSON.parse(rawBody);
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = startPlanSchema.parse(body);
    } catch (error) {
      await logAuthEvent(
        'start_plan_validation_failed',
        'security',
        'Invalid start plan data',
        userId,
        orgId || undefined,
        { errors: error instanceof z.ZodError ? error.issues : undefined }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Get the current plan to verify it exists and can be started
    console.log(`Attempting to start plan ${planId} for user ${userId}`);
    const planResult = await workoutService.getWorkoutPlan(planId, context);
    if (!planResult.success) {
      console.error(`Failed to get plan ${planId}:`, planResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: planResult.error, 
          code: planResult.error.code || 'PLAN_NOT_FOUND'
        },
        { status: planResult.error.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    const plan = planResult.data!;

    // Validate plan can be started
    if (plan.status !== 'draft') {
      await logAuthEvent(
        'invalid_plan_start_attempt',
        'security',
        `Attempt to start plan in ${plan.status} status`,
        userId,
        orgId || undefined,
        { planId, currentStatus: plan.status }
      );

      return NextResponse.json(
        {
          success: false,
          error: `Plan cannot be started from ${plan.status} status`,
          code: 'INVALID_PLAN_STATUS',
        },
        { status: 400 }
      );
    }

    // Update plan to active status
    console.log(`Updating plan ${planId} to active status`);
    const updateResult = await workoutService.updateWorkoutPlan(
      planId,
      {
        status: 'active',
        startedAt: validatedData.scheduleStartDate 
          ? new Date(validatedData.scheduleStartDate)
          : new Date(),
      },
      context
    );
    
    console.log(`Update result:`, updateResult.success ? 'Success' : `Error: ${JSON.stringify(updateResult.error)}`);

    if (!updateResult.success) {
      await logAuthEvent(
        'plan_start_failed',
        'error',
        'Failed to update plan to active status',
        userId,
        orgId || undefined,
        { planId, error: updateResult.error }
      );

      return NextResponse.json(
        { 
          success: false, 
          error: updateResult.error, 
          code: updateResult.error.code || 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    const updatedPlan = updateResult.data!;

    // Generate initial workout sessions based on weekly schedule
    if (validatedData.generateInitialSessions && plan.weeklySchedule) {
      try {
        const startDate = validatedData.scheduleStartDate 
          ? new Date(validatedData.scheduleStartDate)
          : new Date();

        // Generate sessions for the first week
        const firstWeekSchedule = plan.weeklySchedule['week-1'] || [];
        const sessionPromises = firstWeekSchedule
          .filter(daySchedule => daySchedule.type === 'workout')
          .map(async (daySchedule, index) => {
            const sessionDate = new Date(startDate);
            sessionDate.setDate(sessionDate.getDate() + index);

            return workoutService.createWorkoutSession({
              workoutPlanId: planId,
              name: daySchedule.sessionName,
              sessionType: 'workout',
              scheduledDate: sessionDate.toISOString().split('T')[0],
              scheduledDuration: daySchedule.duration,
              sessionData: {
                weekNumber: 1,
                dayOfWeek: index + 1,
                templateData: daySchedule,
                planPhase: plan.planData.phases?.[0]?.name || 'Phase 1',
              },
              mainExercises: daySchedule.exercises || [],
              warmUpExercises: daySchedule.warmUp || [],
              coolDownExercises: daySchedule.coolDown || [],
            }, context);
          });

        // Wait for all sessions to be created
        await Promise.all(sessionPromises);
      } catch (error) {
        console.warn('Failed to generate initial sessions:', error);
        // Don't fail the entire request if session generation fails
      }
    }

    // Get updated plan with progress information
    const planWithProgressResult = await workoutService.getWorkoutPlanProgress(
      planId,
      context
    );

    let planWithProgress = updatedPlan;
    if (planWithProgressResult.success) {
      planWithProgress = {
        ...updatedPlan,
        progress: planWithProgressResult.data!,
      };
    }

    const responseTime = Date.now() - startTime;

    // Log successful plan start
    await logAuthEvent(
      'workout_plan_started',
      'info',
      'Workout plan successfully started',
      userId,
      orgId || undefined,
      { 
        planId,
        planName: plan.name,
        generatedSessions: validatedData.generateInitialSessions,
        startDate: validatedData.scheduleStartDate || new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      data: planWithProgress,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
        sessionsGenerated: validatedData.generateInitialSessions,
      },
    });

  } catch (error) {
    console.error('Error starting workout plan:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_plan_start_failed',
      'error',
      'Workout plan start failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { 
        planId,
        error: (error as Error).message 
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