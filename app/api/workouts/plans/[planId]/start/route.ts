import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { z } from 'zod';

const startSchema = z.object({
  startDate: z.string().datetime().optional(),
});

type RouteParams = Promise<{ planId: string }> | { planId: string };

export async function POST(req: NextRequest, context: { params: RouteParams }) {
  try {
    const userId = requireUser(req);
    const body = startSchema.parse(await req.json().catch(() => ({})));
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const plan = await workoutPlanService.startPlan(userId, resolvedParams.planId, body);
    if (!plan) {
      return failure('Workout plan not found', 'NOT_FOUND', 404);
    }
    return success({ workoutPlan: plan });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      return failure('Invalid payload', 'VALIDATION_ERROR', 400, error.issues);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
