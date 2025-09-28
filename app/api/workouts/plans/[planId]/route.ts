import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { requireUser } from '@/lib/utils/auth';
import { success, failure } from '@/lib/utils/api-response';

type RouteParams = Promise<{ planId: string }> | { planId: string };

export async function GET(req: NextRequest, context: { params: RouteParams }) {
  try {
    const userId = requireUser(req);
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const plan = await workoutPlanService.getPlan(userId, resolvedParams.planId);

    if (!plan) {
      return failure('Workout plan not found', 'NOT_FOUND', 404);
    }

    return success({ workoutPlan: plan });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
