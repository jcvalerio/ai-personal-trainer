import { NextRequest } from 'next/server';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { success, failure } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/utils/auth';
import { z } from 'zod';

const completeSchema = z.object({
  completionPercentage: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const userId = requireUser(req);
    const body = completeSchema.parse(await req.json().catch(() => ({})));
    const session = await workoutPlanService.markSessionComplete(userId, params.sessionId, body);
    return success({ workoutSession: session });
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
