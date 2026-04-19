import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { z } from 'zod';
import { logApiError, logApiInfo, logApiWarn } from '@/lib/utils/observability';

const startSchema = z.object({
  startDate: z.string().datetime().optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ planId: string }> }) {
  const startedAt = Date.now();
  let userId: string | undefined;
  let planId: string | undefined;

  try {
    userId = requireUser(req);
    const body = startSchema.parse(await req.json().catch(() => ({})));
    ({ planId } = await context.params);
    const plan = await workoutPlanService.startPlan(userId, planId, body);
    if (!plan) {
      logApiWarn('workout_plan.start.not_found', req, startedAt, {
        userId,
        planId,
      });
      return failure('Workout plan not found', 'NOT_FOUND', 404);
    }

    logApiInfo('workout_plan.start.succeeded', req, startedAt, {
      userId,
      planId,
      status: plan.status,
      requestedStartDate: body.startDate,
      startedAt: plan.startedAt,
    });

    return success({ workoutPlan: plan });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_plan.start.unauthorized', req, startedAt, { planId });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      logApiWarn('workout_plan.start.validation_failed', req, startedAt, {
        userId,
        planId,
        issuesCount: error.issues.length,
      });
      return failure('Invalid payload', 'VALIDATION_ERROR', 400, error.issues);
    }
    logApiError('workout_plan.start.failed', req, startedAt, error, { userId, planId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
