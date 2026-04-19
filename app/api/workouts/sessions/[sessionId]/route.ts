import { NextRequest } from 'next/server';
import { z } from 'zod';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { UpdateSessionProgressSchema } from '@/lib/shared/types';
import { logApiError, logApiInfo, logApiWarn } from '@/lib/utils/observability';

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const startedAt = Date.now();
  let userId: string | undefined;
  let sessionId: string | undefined;

  try {
    userId = requireUser(req);
    ({ sessionId } = await params);
    const session = await workoutPlanService.getSession(userId, sessionId);
    if (!session) {
      logApiWarn('workout_session.detail.not_found', req, startedAt, {
        userId,
        sessionId,
      });
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }

    logApiInfo('workout_session.detail.succeeded', req, startedAt, {
      userId,
      sessionId,
      planId: session.workoutPlanId,
      status: session.status,
      completionPercentage: session.completionPercentage,
      totalExercises:
        session.warmUpExercises.length + session.mainExercises.length + session.coolDownExercises.length,
    });

    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_session.detail.unauthorized', req, startedAt, { sessionId });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    logApiError('workout_session.detail.failed', req, startedAt, error, { userId, sessionId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const startedAt = Date.now();
  let userId: string | undefined;
  let sessionId: string | undefined;

  try {
    userId = requireUser(req);
    ({ sessionId } = await params);
    const body = UpdateSessionProgressSchema.parse(await req.json().catch(() => ({})));
    const session = await workoutPlanService.updateSessionProgress(userId, sessionId, body);

    if (!session) {
      logApiWarn('workout_session.progress.not_found', req, startedAt, {
        userId,
        sessionId,
      });
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }

    logApiInfo('workout_session.progress.updated', req, startedAt, {
      userId,
      sessionId,
      planId: session.workoutPlanId,
      completionPercentage: session.completionPercentage,
      updatedWarmUpExercises: body.warmUpExercises?.length ?? 0,
      updatedMainExercises: body.mainExercises?.length ?? 0,
      updatedCoolDownExercises: body.coolDownExercises?.length ?? 0,
      hasNotes: body.notes !== undefined,
    });

    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_session.progress.unauthorized', req, startedAt, { sessionId });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      logApiWarn('workout_session.progress.validation_failed', req, startedAt, {
        userId,
        sessionId,
        issuesCount: error.issues.length,
      });
      return failure('Invalid payload', 'VALIDATION_ERROR', 400, error.issues);
    }
    if (error instanceof Error && error.message.startsWith('INVALID_SESSION_STATE:')) {
      logApiWarn('workout_session.progress.invalid_state', req, startedAt, {
        userId,
        sessionId,
        reason: error.message.replace('INVALID_SESSION_STATE: ', ''),
      });
      return failure(error.message.replace('INVALID_SESSION_STATE: ', ''), 'VALIDATION_ERROR', 400);
    }
    logApiError('workout_session.progress.failed', req, startedAt, error, { userId, sessionId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
