/**
 * Session Exercise Update API Route
 * Handles updating individual exercises within a workout session
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { workoutSessionRepository } from '@/lib/repositories/workout-session.repository';
import { getUserProfileByClerkId, logAuthEvent } from '@/lib/db/auth';
import { RATE_LIMITS } from '@/lib/auth';

// Schema for updating session exercise
const updateSessionExerciseSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).optional(),
  sets: z.array(z.object({
    setNumber: z.number().min(1),
    reps: z.number().min(0).optional(),
    weight: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    distance: z.number().min(0).optional(),
    restSeconds: z.number().min(0).optional(),
    perceivedExertion: z.number().min(1).max(10).optional(),
    formRating: z.number().min(1).max(5).optional(),
    tempo: z.string().optional(),
    rangeOfMotion: z.number().min(1).max(5).optional(),
    timestamp: z.string().datetime().optional(),
    setNotes: z.string().max(500).optional(),
  })).optional(),
  exerciseNotes: z.string().max(1000).optional(),
  perceivedExertion: z.number().min(1).max(10).optional(),
  formRating: z.number().min(1).max(5).optional(),
  completedAt: z.string().datetime().optional(),
  skippedReason: z.string().max(500).optional(),
  modifications: z.record(z.any()).optional(),
});

/**
 * PUT /api/workouts/sessions/[sessionId]/exercises/[exerciseId]
 * Update progress for a specific exercise within a workout session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string; exerciseId: string } }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate route parameters
    const sessionId = params.sessionId;
    const exerciseId = params.exerciseId;

    if (!sessionId || !exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID or exercise ID', code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (
      !RATE_LIMITS.PROFILE_UPDATE.isAllowed(
        `update_session_exercise:${userId}:${sessionId}:${clientIp}`
      )
    ) {
      await logAuthEvent(
        'rate_limit_exceeded',
        'security',
        'Session exercise update rate limit exceeded',
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

    // Verify session exists and user has access
    const session = await workoutSessionRepository.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check access permissions
    if (session.userId !== userId && session.organizationId !== (orgId || userProfile.organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
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

    let validatedData;
    try {
      validatedData = updateSessionExerciseSchema.parse(body);
    } catch (error) {
      await logAuthEvent(
        'session_exercise_validation_failed',
        'security',
        'Invalid session exercise update data',
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

    // Update the exercise progress using the repository
    const updateData = {
      sessionId,
      exerciseId,
      updates: {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    };

    const updatedSession = await workoutSessionRepository.updateExerciseProgress(updateData);

    // Log the exercise update
    await logAuthEvent(
      'session_exercise_updated',
      'audit',
      'Session exercise progress updated',
      userId,
      orgId || undefined,
      { 
        sessionId,
        exerciseId,
        status: validatedData.status,
        setsCount: validatedData.sets?.length,
      }
    );

    // Update session status if needed
    let sessionStatus = session.status;
    const exercises = updatedSession.exercises || [];
    const completedExercises = exercises.filter(ex => ex.status === 'completed').length;
    const totalExercises = exercises.length;

    if (completedExercises === totalExercises && totalExercises > 0) {
      sessionStatus = 'completed';
      await workoutSessionRepository.updateSessionStatus(sessionId, 'completed');
    } else if (completedExercises > 0 && sessionStatus === 'scheduled') {
      sessionStatus = 'in_progress';
      await workoutSessionRepository.updateSessionStatus(sessionId, 'in_progress');
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        exerciseId,
        updates: validatedData,
        sessionStatus,
        progress: {
          completedExercises,
          totalExercises,
          completionPercentage: Math.round((completedExercises / totalExercises) * 100),
        },
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating session exercise:', error);
    const authResult = await auth();
    await logAuthEvent(
      'session_exercise_update_failed',
      'security',
      'Session exercise update failed',
      authResult.userId || undefined,
      authResult.orgId || undefined,
      { 
        error: (error as Error).message,
        sessionId: params.sessionId,
        exerciseId: params.exerciseId,
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

/**
 * GET /api/workouts/sessions/[sessionId]/exercises/[exerciseId]
 * Get detailed information about a specific exercise within a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string; exerciseId: string } }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Authentication
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate route parameters
    const sessionId = params.sessionId;
    const exerciseId = params.exerciseId;

    if (!sessionId || !exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID or exercise ID', code: 'INVALID_PARAMS' },
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

    // Get session and exercise details
    const exerciseDetails = await workoutSessionRepository.getExerciseDetails(sessionId, exerciseId);
    
    if (!exerciseDetails) {
      return NextResponse.json(
        {
          success: false,
          error: 'Exercise not found in session',
          code: 'EXERCISE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check access permissions
    if (exerciseDetails.userId !== userId && exerciseDetails.organizationId !== (orgId || userProfile.organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: exerciseDetails,
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching session exercise details:', error);
    
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