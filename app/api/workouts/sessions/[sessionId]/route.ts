import { NextRequest } from 'next/server';
import { z } from 'zod';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { UpdateSessionProgressSchema } from '@/lib/shared/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const userId = requireUser(req);
    const { sessionId } = await params;
    const session = await workoutPlanService.getSession(userId, sessionId);
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const userId = requireUser(req);
    const { sessionId } = await params;
    const body = UpdateSessionProgressSchema.parse(await req.json().catch(() => ({})));
    const session = await workoutPlanService.updateSessionProgress(userId, sessionId, body);

    if (!session) {
      return failure('Workout session not found', 'NOT_FOUND', 404);
    }

    return success({ workoutSession: session });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      return failure('Invalid payload', 'VALIDATION_ERROR', 400, error.issues);
    }
    if (error instanceof Error && error.message.startsWith('INVALID_SESSION_STATE:')) {
      return failure(error.message.replace('INVALID_SESSION_STATE: ', ''), 'VALIDATION_ERROR', 400);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
