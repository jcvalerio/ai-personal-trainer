import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { z } from 'zod';
import { logApiError, logApiInfo, logApiWarn } from '@/lib/utils/observability';

const completeSchema = z.object({
  completionPercentage: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  effortRating: z.number().int().min(1).max(10).optional(),
  energyLevelBefore: z.number().int().min(1).max(10).optional(),
  energyLevelAfter: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const startedAt = Date.now();
  let userId: string | undefined;
  let sessionId: string | undefined;

  try {
    userId = requireUser(req);
    ({ sessionId } = await params);
    const body = completeSchema.parse(await req.json().catch(() => ({})));
    const session = await workoutPlanService.markSessionComplete(userId, sessionId, body);
    if (!session) {
      logApiWarn('workout_session.complete.not_found', req, startedAt, {
        userId,
        sessionId,
      });
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }

    logApiInfo('workout_session.complete.succeeded', req, startedAt, {
      userId,
      sessionId,
      planId: session.workoutPlanId,
      status: session.status,
      completionPercentage: session.completionPercentage,
      effortRating: session.effortRating,
      energyLevelBefore: session.energyLevelBefore,
      energyLevelAfter: session.energyLevelAfter,
      hasNotes: body.notes !== undefined,
    });

    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_session.complete.unauthorized', req, startedAt, { sessionId });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      logApiWarn('workout_session.complete.validation_failed', req, startedAt, {
        userId,
        sessionId,
        issuesCount: error.issues.length,
      });
      return failure('Invalid payload', 'VALIDATION_ERROR', 400, error.issues);
    }
    if (error instanceof Error && error.message.startsWith('INVALID_SESSION_STATE:')) {
      logApiWarn('workout_session.complete.invalid_state', req, startedAt, {
        userId,
        sessionId,
        reason: error.message.replace('INVALID_SESSION_STATE: ', ''),
      });
      return failure(error.message.replace('INVALID_SESSION_STATE: ', ''), 'VALIDATION_ERROR', 400);
    }
    logApiError('workout_session.complete.failed', req, startedAt, error, { userId, sessionId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
