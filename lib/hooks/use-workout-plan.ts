'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { WorkoutPlan } from '@/lib/shared/types';

async function fetchWorkoutPlan(planId: string): Promise<WorkoutPlan | null> {
  const response = await fetch(`/api/workouts/plans/${planId}`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id':
        process.env.NEXT_PUBLIC_E2E_USER_ID || '11111111-2222-3333-4444-555555555555',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload.error === 'string' ? payload.error : 'Failed to load workout plan';
    throw new Error(message);
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error || 'Failed to load workout plan');
  }

  return payload.data.workoutPlan as WorkoutPlan;
}

type WorkoutPlanQueryOptions = Omit<
  UseQueryOptions<WorkoutPlan | null, Error, WorkoutPlan | null, ['workout-plan', string]>,
  'queryKey' | 'queryFn'
>;

export function useWorkoutPlan(
  planId: string,
  options?: WorkoutPlanQueryOptions
) {
  return useQuery<WorkoutPlan | null, Error, WorkoutPlan | null, ['workout-plan', string]>({
    queryKey: ['workout-plan', planId],
    queryFn: () => fetchWorkoutPlan(planId),
    ...options,
  });
}
