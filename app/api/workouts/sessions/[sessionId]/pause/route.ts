/**
 * Session Pause API
 * Handles pausing active workout sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import WorkoutService from '@/lib/services/workout-service';

/**
 * POST /api/workouts/sessions/[sessionId]/pause
 * Pause an active workout session
 */
export async function POST(
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

    // Initialize service
    const workoutService = new WorkoutService();
    const serviceContext = {
      userId,
      organizationId: orgId || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    // Pause the session
    const result = await workoutService.pauseWorkoutSession(sessionId, serviceContext);

    if (!result.success) {
      const statusCode = 
        result.code === 'NOT_FOUND' ? 404 :
        result.code === 'UNAUTHORIZED' ? 403 :
        result.code === 'INVALID_STATE' ? 409 :
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
        message: 'Session paused successfully',
        data: result.data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Session pause error:', error);
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
 * OPTIONS /api/workouts/sessions/[sessionId]/pause
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