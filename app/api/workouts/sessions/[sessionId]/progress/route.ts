/**
 * Session Progress Update API
 * Handles real-time progress updates during workout sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import WorkoutService from '@/lib/services/workout-service';
import { z } from 'zod';
import { ensureUserProfile } from '@/lib/middleware/user-profile-middleware';
import { getUserProfileByClerkId } from '@/lib/db/auth';

// Validation schema for session progress data
const ProgressUpdateSchema = z.object({
  currentExerciseIndex: z.number().int().min(0, 'Current exercise index must be non-negative').optional(),
  currentSet: z.number().int().min(0, 'Current set must be non-negative').optional(),
  elapsedTime: z.number().int().min(0, 'Elapsed time must be non-negative').optional(),
  exercisesCompleted: z.number().int().min(0, 'Exercises completed must be non-negative').optional(),
  setsCompleted: z.number().int().min(0, 'Sets completed must be non-negative').optional(),
  totalVolume: z.number().min(0, 'Total volume must be non-negative').optional(),
  completionPercentage: z.number().min(0).max(100, 'Completion percentage must be between 0-100').optional(),
});

/**
 * POST /api/workouts/sessions/[sessionId]/progress
 * Update session progress with real-time data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    // Validate session ID first - await params for Next.js 15 compatibility
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // Development Mode: Allow operation without authentication for valid UUID
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    
    if (isDevelopment && isValidUUID) {
      // Parse and validate request body for development
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in request body',
            code: 'INVALID_REQUEST',
          },
          { status: 400 }
        );
      }

      // Validate progress data
      const validationResult = ProgressUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.issues,
          },
          { status: 400 }
        );
      }

      const progressData = validationResult.data;

      // Check if there's any data to update
      if (Object.keys(progressData).length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No progress data provided',
            code: 'INVALID_REQUEST',
          },
          { status: 400 }
        );
      }

      // Return mock success response for development
      return NextResponse.json(
        {
          success: true,
          message: 'Session progress updated successfully (development mode)',
          data: {
            sessionId,
            ...progressData,
            updatedAt: new Date().toISOString(),
            mode: 'development'
          },
        },
        { status: 200 }
      );
    }

    // Production Mode: Full authentication required
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Ensure user profile exists in database
    try {
      await ensureUserProfile(userId);
    } catch (profileError) {
      console.error('User profile creation failed:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database initialization required. Please contact support.',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // Validate progress data
    const validationResult = ProgressUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const progressData = validationResult.data;

    // Check if there's any data to update
    if (Object.keys(progressData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No progress data provided',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
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

    // Initialize service
    const workoutService = new WorkoutService();
    const serviceContext = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Update session progress
    const result = await workoutService.updateSessionProgress(
      sessionId,
      progressData,
      serviceContext
    );

    if (!result.success) {
      const error = result.error;
      const statusCode = 
        error.code === 'NOT_FOUND' ? 404 :
        error.code === 'UNAUTHORIZED' ? 403 :
        error.code === 'INVALID_STATE' ? 409 :
        error.code === 'VALIDATION_ERROR' ? 400 :
        500;

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Session progress updated successfully',
        data: result.data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Progress update error:', error);
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
 * GET /api/workouts/sessions/[sessionId]/progress
 * Get current session progress (for recovery/sync purposes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Validate session ID - await params for Next.js 15 compatibility
    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
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

    // Initialize service
    const workoutService = new WorkoutService();
    const serviceContext = {
      userId,
      organizationId: orgId || userProfile.organizationId,
      userRole: userProfile.role,
    };

    // Get session with progress data
    const result = await workoutService.getWorkoutSession(sessionId, serviceContext);

    if (!result.success) {
      const error = result.error;
      const statusCode = 
        error.code === 'NOT_FOUND' ? 404 :
        error.code === 'UNAUTHORIZED' ? 403 :
        500;

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: statusCode }
      );
    }

    // Extract progress data from session_data
    const session = result.data;
    const progressData = {
      sessionId: session.id,
      status: session.status,
      startedAt: session.startedAt,
      elapsedTime: session.actualDuration ? session.actualDuration * 60 * 1000 : 0, // Convert minutes to milliseconds
      completionPercentage: session.completionPercentage,
      progress: session.sessionData?.progress || {},
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Session progress retrieved successfully',
        data: progressData,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Progress retrieval error:', error);
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
 * OPTIONS /api/workouts/sessions/[sessionId]/progress
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}