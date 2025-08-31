/**
 * Start Workout Session API Route
 * Handles starting a workout session
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import WorkoutService from '@/lib/services/workout-service';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

const workoutService = new WorkoutService();

// Mock session mapping for development - same as in route.ts
const MOCK_SESSIONS_MAP = {
  '1': 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Upper Body Power UUID
  '2': 'f47ac10b-58cc-4372-a567-0e02b2c3d480', // Lower Body Strength UUID  
  '3': 'f47ac10b-58cc-4372-a567-0e02b2c3d481', // Push Day Complete UUID
  'c8495f2b-4199-46c3-a06c-fa84f55be075': 'c8495f2b-4199-46c3-a06c-fa84f55be075', // Direct UUID for testing
};

// Helper function to resolve session ID (handle both UUID and integer mapping)
function resolveSessionId(sessionId: string): string {
  // If it's already a UUID format, return as-is
  if (sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return sessionId;
  }
  
  // If it's a numeric ID, map it to UUID
  const mappedId = MOCK_SESSIONS_MAP[sessionId as keyof typeof MOCK_SESSIONS_MAP];
  if (mappedId) {
    return mappedId;
  }
  
  // Return original if no mapping found (will likely fail in service)
  return sessionId;
}

/**
 * POST /api/workouts/sessions/[sessionId]/start
 * Start a workout session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get session ID from params
    const { sessionId } = await params;
    
    // Validate sessionId parameter
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing session ID',
          code: 'INVALID_PARAMETER',
        },
        { status: 400 }
      );
    }

    // Resolve session ID (handle integer to UUID mapping)
    const resolvedSessionId = resolveSessionId(sessionId);
    
    // Development Mode: Return mock session start response for valid UUIDs
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedSessionId);
    
    if (isDevelopment && isValidUUID) {
      // For development, return mock session start success
      const mockStartedSession = {
        id: resolvedSessionId,
        name: sessionId === 'c8495f2b-4199-46c3-a06c-fa84f55be075' 
          ? 'Full Body Functional Training' 
          : 'Development Session',
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        completionPercentage: 0
      };

      return NextResponse.json({
        success: true,
        data: mockStartedSession,
        message: 'Workout session started successfully (development mode)',
        meta: {
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          mode: 'development'
        },
      });
    }

    // Production Mode: Full authentication and database operations
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate resolved session ID is a proper UUID for production
    if (!isValidUUID) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid session ID format: "${sessionId}"`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Rate limiting for session actions
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `session_start:${userId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Session start rate limit exceeded',
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

    // Start workout session using resolved ID
    const result = await workoutService.startWorkoutSession(
      resolvedSessionId,
      context
    );

    if (!result.success) {
      const statusCode =
        result.error.code === 'NOT_FOUND'
          ? 404
          : result.error.code === 'INSUFFICIENT_PERMISSIONS'
            ? 403
            : result.error.code === 'INVALID_STATE'
              ? 409
              : 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          code: result.error.code,
          details: result.error.context,
        },
        { status: statusCode }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Workout session started successfully',
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error starting workout session:', error);
    
    // In development mode, don't try to log auth events if auth failed
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await auth();
      await logAuthEvent(
        'session_start_failed',
        'security',
        'Session start failed',
        authResult.userId || undefined,
        authResult.orgId || undefined,
        {
          sessionId: sessionId,
          error: (error as Error).message,
        }
      );
    }

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
