import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/utils/auth';
import { success, failure } from '@/lib/utils/api-response';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { buildPlanFromForm } from '@/lib/workouts/plan-form-adapter';

const PlanFormSchema = z.object({
  name: z.string().min(1),
  durationWeeks: z.coerce.number().int().min(4).max(52),
  sessionsPerWeek: z.coerce.number().int().min(1).max(7),
  description: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = requireUser(req);
    const params = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const result = await workoutPlanService.listPlans(userId, params);
    return success(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      return failure('Invalid query parameters', 'VALIDATION_ERROR', 400, error.issues);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = requireUser(req);
    const body = await req.json();
    const form = PlanFormSchema.parse(body);

    const planInput = buildPlanFromForm(form, userId);
    const plan = await workoutPlanService.createPlan(userId, planInput);
    return success({ workoutPlan: plan }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      return failure('Invalid workout plan data', 'VALIDATION_ERROR', 400, error.issues);
    }
    console.error(error);
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
