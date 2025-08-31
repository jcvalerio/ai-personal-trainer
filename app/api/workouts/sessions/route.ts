/**
 * Workout Sessions API Routes
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';
import {
  createWorkoutSessionSchema,
  workoutSessionFiltersSchema,
  paginationSchema,
} from '@/lib/validation/workout-schemas';

const workoutService = new WorkoutService();

/**
 * GET /api/workouts/sessions
 * Get user's workout sessions with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
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
        `workout_sessions:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout sessions API rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

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

    // Parse query
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

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

    let filters;
    try {
      filters = workoutSessionFiltersSchema.parse({
        status: queryParams.status,
        workoutPlanId: queryParams.workoutPlanId,
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

    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    const result = await workoutService.getWorkoutSessions(
      context,
      filters,
      paginationParams
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.error.code },
        { status: result.error.code === 'UNAUTHORIZED' ? 403 : 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data: result.data!.items,
      pagination: result.data!.pagination,
      meta: { responseTime, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error fetching workout sessions:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_sessions_access_failed',
      'security',
      'Workout sessions access failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message }
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts/sessions
 * Create a new workout session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `create_workout_session:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout session creation rate limit exceeded',
        userId
      );
      return NextResponse.json(
        { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = createWorkoutSessionSchema.parse(body);
    } catch (error) {
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

    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    const result = await workoutService.createWorkoutSession(
      {
        ...validatedData,
        scheduledDate:
          typeof validatedData.scheduledDate === 'string'
            ? new Date(validatedData.scheduledDate)
            : validatedData.scheduledDate,
      },
      context
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.error.code },
        { status: result.error.code === 'VALIDATION_ERROR' ? 400 : 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: 'Workout session created successfully',
        meta: { responseTime, timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workout session:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_session_creation_failed',
      'security',
      'Workout session creation failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { error: (error as Error).message }
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
