/**
 * Session Sets Recording API
 * Handles recording individual set performance data during workout sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import WorkoutService from '@/lib/services/workout-service';
import { z } from 'zod';
import { ensureUserProfile } from '@/lib/middleware/user-profile-middleware';

// Validation schema for set performance data
const RecordSetSchema = z.object({
  exerciseId: z.string().uuid('Exercise ID must be a valid UUID'),
  setIndex: z.number().int().min(0, 'Set index must be non-negative'),
  reps: z.number().int().min(0, 'Reps must be non-negative'),
  weight: z.number().min(0, 'Weight must be non-negative').optional(),
  distance: z.number().min(0, 'Distance must be non-negative').optional(),
  duration: z.number().int().min(0, 'Duration must be non-negative').optional(),
  perceivedExertion: z.number().int().min(1).max(10, 'Perceived exertion must be between 1-10').optional(),
  formRating: z.number().int().min(1).max(5, 'Form rating must be between 1-5').optional(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
  completedAt: z.string().datetime().optional(),
});

/**
 * POST /api/workouts/sessions/[sessionId]/sets
 * Record set performance data for a session exercise
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    // Validate session ID first
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

    // Development Mode: Allow set recording without authentication for testing
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

      // Validate set data
      const validationResult = RecordSetSchema.safeParse(body);
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

      const setData = validationResult.data;

      // Return mock success response for development
      return NextResponse.json(
        {
          success: true,
          message: 'Set performance recorded successfully (development mode)',
          data: {
            sessionId,
            exerciseId: setData.exerciseId,
            setIndex: setData.setIndex,
            reps: setData.reps,
            weight: setData.weight,
            perceivedExertion: setData.perceivedExertion,
            formRating: setData.formRating,
            completedAt: setData.completedAt || new Date().toISOString(),
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

    // Session ID already validated above

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

    // Validate set data
    const validationResult = RecordSetSchema.safeParse(body);
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

    const setData = validationResult.data;

    // Convert completedAt string to Date if provided
    const processedSetData = {
      ...setData,
      completedAt: setData.completedAt ? new Date(setData.completedAt) : undefined,
    };

    // Initialize service
    const workoutService = new WorkoutService();
    const serviceContext = {
      userId,
      organizationId: orgId || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    // Record set performance
    const result = await workoutService.recordSetPerformance(
      sessionId,
      setData.exerciseId,
      processedSetData,
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
        message: 'Set performance recorded successfully',
        data: result.data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Set recording error:', error);
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
 * OPTIONS /api/workouts/sessions/[sessionId]/sets
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