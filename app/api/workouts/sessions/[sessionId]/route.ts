import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const userId = requireUser(req);
    const session = await workoutPlanService.getSession(userId, params.sessionId);
    if (!session) {
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }
    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
