import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { logApiError, logApiInfo, logApiWarn } from '@/lib/utils/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const startedAt = Date.now();
  let userId: string | undefined;
  let sessionId: string | undefined;

  try {
    userId = requireUser(req);
    ({ sessionId } = await params);
    const session = await workoutPlanService.markSessionStarted(userId, sessionId);
    if (!session) {
      logApiWarn('workout_session.start.not_found', req, startedAt, {
        userId,
        sessionId,
      });
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }

    logApiInfo('workout_session.start.succeeded', req, startedAt, {
      userId,
      sessionId,
      planId: session.workoutPlanId,
      status: session.status,
    });

    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_session.start.unauthorized', req, startedAt, { sessionId });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof Error && error.message.startsWith('INVALID_SESSION_STATE:')) {
      logApiWarn('workout_session.start.invalid_state', req, startedAt, {
        userId,
        sessionId,
        reason: error.message.replace('INVALID_SESSION_STATE: ', ''),
      });
      return failure(error.message.replace('INVALID_SESSION_STATE: ', ''), 'VALIDATION_ERROR', 400);
    }
    logApiError('workout_session.start.failed', req, startedAt, error, { userId, sessionId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
