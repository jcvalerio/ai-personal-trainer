/**
 * Complete Workout Session API
 * Handles completion of workout sessions with full metrics calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import WorkoutService from '@/lib/services/workout-service';
import { z } from 'zod';

// Validation schema for session completion data
const CompleteSessionSchema = z.object({
  effortRating: z.number().int().min(1).max(10, 'Effort rating must be between 1-10').optional(),
  energyLevelAfter: z.number().int().min(1).max(10, 'Energy level must be between 1-10').optional(),
  userNotes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
  totalVolume: z.number().min(0, 'Total volume must be non-negative').optional(),
  exercisesCompleted: z.number().int().min(0, 'Exercises completed must be non-negative').optional(),
  setsCompleted: z.number().int().min(0, 'Sets completed must be non-negative').optional(),
});

/**
 * POST /api/workouts/sessions/[sessionId]/complete
 * Complete a workout session with full metrics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    // Resolve params and validate session ID
    const resolvedParams = await params;
    const sessionId = resolvedParams.sessionId;

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

    // Development Mode: Allow session completion without authentication for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    
    if (isDevelopment && isValidUUID) {
      // Parse and validate request body for development
      let body = {};
      try {
        body = await request.json();
      } catch (error) {
        // Empty body is allowed for completion
        body = {};
      }

      // Validate completion data
      const validationResult = CompleteSessionSchema.safeParse(body);
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

      const completionData = validationResult.data;

      // Return mock success response for development
      return NextResponse.json(
        {
          success: true,
          message: 'Workout session completed successfully (development mode)',
          data: {
            id: sessionId,
            status: 'completed',
            completedAt: new Date().toISOString(),
            effortRating: completionData.effortRating,
            energyLevelAfter: completionData.energyLevelAfter,
            userNotes: completionData.userNotes,
            totalVolume: completionData.totalVolume,
            exercisesCompleted: completionData.exercisesCompleted,
            setsCompleted: completionData.setsCompleted,
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

    // Parse and validate request body
    let body = {};
    try {
      body = await request.json();
    } catch (error) {
      // Empty body is allowed for completion
      body = {};
    }

    // Validate completion data
    const validationResult = CompleteSessionSchema.safeParse(body);
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

    const completionData = validationResult.data;

    // Initialize service
    const workoutService = new WorkoutService();
    const serviceContext = {
      userId,
      organizationId: orgId || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    // Complete the session
    const result = await workoutService.completeWorkoutSession(
      sessionId,
      completionData,
      serviceContext
    );

    if (!result.success) {
      const statusCode = 
        result.code === 'NOT_FOUND' ? 404 :
        result.code === 'UNAUTHORIZED' ? 403 :
        result.code === 'INVALID_STATE' ? 409 :
        result.code === 'VALIDATION_ERROR' ? 400 :
        500;

      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Workout session completed successfully',
        data: result.data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Session completion error:', error);
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
 * OPTIONS /api/workouts/sessions/[sessionId]/complete
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
