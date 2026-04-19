'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { WorkoutSession } from '@/lib/shared/types';

async function fetchPlanSessions(planId: string): Promise<WorkoutSession[] | null> {
  const response = await fetch(`/api/workouts/plans/${planId}/sessions`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id':
        process.env.NEXT_PUBLIC_E2E_USER_ID || '11111111-2222-3333-4444-555555555555',
    },
  });

  if (response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Failed to load workout sessions');
  }

  return payload.data.sessions as WorkoutSession[];
}

type PlanSessionsQueryOptions = Omit<
  UseQueryOptions<WorkoutSession[] | null, Error, WorkoutSession[] | null, ['workout-plan-sessions', string]>,
  'queryKey' | 'queryFn'
>;

export function usePlanSessions(
  planId: string,
  options?: PlanSessionsQueryOptions
) {
  return useQuery<WorkoutSession[] | null, Error, WorkoutSession[] | null, ['workout-plan-sessions', string]>({
    queryKey: ['workout-plan-sessions', planId],
    queryFn: () => fetchPlanSessions(planId),
    ...options,
  });
}
