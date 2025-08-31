/**
 * Individual Workout Plan API Routes
 * Handles operations for a specific workout plan
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

const workoutService = new WorkoutService();

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
        `workout_plan_detail:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Workout plan detail API rate limit exceeded',
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

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Get workout plan by ID
    const result = await workoutService.getWorkoutPlan(planId, context);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Workout plan not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: result.error.message, code: result.error.code },
        { status: result.error.code === 'UNAUTHORIZED' ? 403 : 500 }
      );
    }

    // Calculate progress if plan is active
    let progress = null;
    if (result.data!.status === 'active') {
      const progressResult = await workoutService.getWorkoutPlanProgress(
        planId,
        context
      );
      if (progressResult.success) {
        progress = progressResult.data;
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        progress,
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_plan_detail_access_failed',
      'security',
      'Workout plan detail access failed',
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

export async function PUT(
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Update workout plan
    const result = await workoutService.updateWorkoutPlan(
      planId,
      body,
      context
    );

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Workout plan not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: result.error.message, code: result.error.code },
        { status: result.error.code === 'VALIDATION_ERROR' ? 400 : 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating workout plan:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_plan_update_failed',
      'security',
      'Workout plan update failed',
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

export async function DELETE(
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

    // Service context
    const context = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Delete workout plan (soft delete)
    const result = await workoutService.deleteWorkoutPlan(planId, context);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'Workout plan not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: result.error.message, code: result.error.code },
        { status: result.error.code === 'UNAUTHORIZED' ? 403 : 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Workout plan deleted successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    const authResult = await auth();
    await logAuthEvent(
      'workout_plan_delete_failed',
      'security',
      'Workout plan delete failed',
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
