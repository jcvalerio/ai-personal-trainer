import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { z } from 'zod';
import { CreateWorkoutSessionSchema } from '@/lib/shared/types';

export async function GET(req: NextRequest, context: { params: Promise<{ planId: string }> }) {
  try {
    const userId = requireUser(req);
    const { planId } = await context.params;
    const sessions = await workoutPlanService.listSessions(userId, planId);
    if (sessions === null) {
      return failure('Workout plan not found', 'NOT_FOUND', 404);
    }
    return success({ sessions });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ planId: string }> }) {
  try {
    const userId = requireUser(req);
    const body = CreateWorkoutSessionSchema.parse(await req.json());
    const { planId } = await context.params;
    const session = await workoutPlanService.createSession(userId, planId, body);
    return success({ workoutSession: session }, 201);
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
