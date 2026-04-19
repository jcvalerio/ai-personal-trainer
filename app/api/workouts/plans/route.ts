import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/utils/auth';
import { success, failure } from '@/lib/utils/api-response';
import { workoutPlanService } from '@/lib/services/workout-plan-service';
import { buildPlanFromForm } from '@/lib/workouts/plan-form-adapter';
import { logApiError, logApiInfo, logApiWarn } from '@/lib/utils/observability';

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
  const startedAt = Date.now();
  let userId: string | undefined;
  let params: z.infer<typeof listQuerySchema> | undefined;
  const rawParams = Object.fromEntries(req.nextUrl.searchParams);

  try {
    userId = requireUser(req);
    params = listQuerySchema.parse(rawParams);
    const result = await workoutPlanService.listPlans(userId, params);

    const hasStatusFilter = Boolean(params.status);
    const hasSearchFilter = Boolean(params.search?.trim());
    const filterType = hasStatusFilter && hasSearchFilter ? 'combined' : hasStatusFilter ? 'status' : hasSearchFilter ? 'search' : 'none';

    logApiInfo('workout_plan.list.succeeded', req, startedAt, {
      userId,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      itemCount: result.items.length,
      totalPlans: result.pagination.total,
      hasStatusFilter,
      hasSearchFilter,
      filterType,
      statusFilter: params.status,
      searchTermLength: params.search?.trim().length,
      zeroResults: result.items.length === 0,
    });

    return success(result);
  } catch (error) {
    const rawStatusFilter = typeof rawParams.status === 'string' ? rawParams.status : undefined;
    const rawSearchTerm = typeof rawParams.search === 'string' ? rawParams.search.trim() : undefined;
    const hasStatusFilter = Boolean(params?.status ?? rawStatusFilter);
    const hasSearchFilter = Boolean(params?.search?.trim() ?? rawSearchTerm);
    const filterType = hasStatusFilter && hasSearchFilter ? 'combined' : hasStatusFilter ? 'status' : hasSearchFilter ? 'search' : 'none';

    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_plan.list.unauthorized', req, startedAt, {
        page: params?.page,
        limit: params?.limit,
        hasStatusFilter,
        hasSearchFilter,
        filterType,
        statusFilter: params?.status ?? rawStatusFilter,
        searchTermLength: params?.search?.trim().length ?? rawSearchTerm?.length,
      });
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      logApiWarn('workout_plan.list.validation_failed', req, startedAt, {
        userId,
        issuesCount: error.issues.length,
        page: params?.page,
        limit: params?.limit,
        hasStatusFilter,
        hasSearchFilter,
        filterType,
        statusFilter: params?.status ?? rawStatusFilter,
        searchTermLength: params?.search?.trim().length ?? rawSearchTerm?.length,
      });
      return failure('Invalid query parameters', 'VALIDATION_ERROR', 400, error.issues);
    }
    logApiError('workout_plan.list.failed', req, startedAt, error, {
      userId,
      page: params?.page,
      limit: params?.limit,
      hasStatusFilter,
      hasSearchFilter,
      filterType,
      statusFilter: params?.status ?? rawStatusFilter,
      searchTermLength: params?.search?.trim().length ?? rawSearchTerm?.length,
    });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let userId: string | undefined;

  try {
    userId = requireUser(req);
    const body = await req.json();
    const form = PlanFormSchema.parse(body);

    const planInput = buildPlanFromForm(form, userId);
    const plan = await workoutPlanService.createPlan(userId, planInput);

    logApiInfo('workout_plan.create.succeeded', req, startedAt, {
      userId,
      planId: plan.id,
      status: plan.status,
      durationWeeks: form.durationWeeks,
      sessionsPerWeek: form.sessionsPerWeek,
      hasDescription: Boolean(form.description),
    });

    return success({ workoutPlan: plan }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      logApiWarn('workout_plan.create.unauthorized', req, startedAt);
      return failure('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (error instanceof z.ZodError) {
      logApiWarn('workout_plan.create.validation_failed', req, startedAt, {
        userId,
        issuesCount: error.issues.length,
      });
      return failure('Invalid workout plan data', 'VALIDATION_ERROR', 400, error.issues);
    }
    logApiError('workout_plan.create.failed', req, startedAt, error, { userId });
    return failure('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
