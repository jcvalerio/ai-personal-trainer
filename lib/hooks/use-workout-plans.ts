'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { WorkoutPlan } from '@/lib/shared/types';

export interface WorkoutPlansQueryResult {
  items: WorkoutPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WorkoutPlansFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

async function fetchWorkoutPlans(filters: WorkoutPlansFilters): Promise<WorkoutPlansQueryResult> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const response = await fetch(`/api/workouts/plans?${params.toString()}`, {
    headers: {
      'content-type': 'application/json',
      'x-user-id':
        process.env.NEXT_PUBLIC_E2E_USER_ID || '11111111-2222-3333-4444-555555555555',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workout plans');
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error || 'Failed to fetch workout plans');
  }

  return payload.data;
}

type WorkoutPlansQueryOptions = Omit<
  UseQueryOptions<WorkoutPlansQueryResult, Error, WorkoutPlansQueryResult, ['workout-plans', WorkoutPlansFilters]>,
  'queryKey' | 'queryFn'
>;

export function useWorkoutPlans(
  filters: WorkoutPlansFilters = {},
  options?: WorkoutPlansQueryOptions
) {
  return useQuery<WorkoutPlansQueryResult, Error, WorkoutPlansQueryResult, ['workout-plans', WorkoutPlansFilters]>({
    queryKey: ['workout-plans', filters],
    queryFn: () => fetchWorkoutPlans(filters),
    ...options,
  });
}
