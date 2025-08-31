/**
 * Workout Plan Sessions API Routes
 * Handles sessions related to a specific workout plan
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import {
  workoutSessionFiltersSchema,
  paginationSchema,
} from '@/lib/validation/workout-schemas';

const workoutService = new WorkoutService();

/**
 * GET /api/workouts/plans/[planId]/sessions
 * Get all sessions for a specific workout plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { planId } = await params;
    
    // Validate planId format
    if (!planId || planId.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID format', code: 'INVALID_PLAN_ID' },
        { status: 400 }
      );
    }

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
        `workout_plan_sessions:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout plan sessions API rate limit exceeded',
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Parse pagination params
    let paginationParams;
    try {
      paginationParams = paginationSchema.parse({
        page: queryParams.page ? parseInt(queryParams.page) : undefined,
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters',
          code: 'VALIDATION_ERROR',
          details: error instanceof z.ZodError ? error.issues : undefined,
        },
        { status: 400 }
      );
    }

    // Parse filters and inject planId
    let filters;
    try {
      filters = workoutSessionFiltersSchema.parse({
        status: queryParams.status,
        workoutPlanId: planId, // Force this planId
        sessionType: queryParams.sessionType,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filter parameters',
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

    // First, verify the plan exists and user has access
    const planResult = await workoutService.getWorkoutPlan(planId, context);
    if (!planResult.success) {
      if (planResult.error.code === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Workout plan not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: planResult.error.message, code: planResult.error.code },
        { status: planResult.error.code === 'UNAUTHORIZED' ? 403 : 500 }
      );
    }

    // Get sessions for this plan
    const result = await workoutService.getWorkoutSessions(
      context,
      filters,
      paginationParams
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message, code: result.error.code },
        { status: result.error.code === 'UNAUTHORIZED' ? 403 : 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data!.items,
      pagination: result.data!.pagination,
      planInfo: {
        id: planResult.data!.id,
        name: planResult.data!.name,
        status: planResult.data!.status,
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching workout plan sessions:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_plan_sessions_access_failed',
      'security',
      'Workout plan sessions access failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message, planId: (await params).planId }
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