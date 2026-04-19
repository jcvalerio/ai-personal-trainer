import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { WorkoutPlanList } from '@/components/workouts/plan-list';
import { renderWithQueryClient } from '@/tests/utils/render-with-query-client';
import type { WorkoutPlan } from '@/lib/shared/types';

function buildPlan(overrides: Partial<WorkoutPlan> & Pick<WorkoutPlan, 'id' | 'name' | 'status'>): WorkoutPlan {
  return {
    id: overrides.id,
    userId: '22222222-2222-2222-2222-222222222222',
    organizationId: undefined,
    name: overrides.name,
    description: overrides.description,
    durationWeeks: overrides.durationWeeks ?? 4,
    sessionsPerWeek: overrides.sessionsPerWeek ?? 3,
    primaryGoals: overrides.primaryGoals ?? ['strength'],
    secondaryGoals: overrides.secondaryGoals ?? [],
    targetFitnessLevel: overrides.targetFitnessLevel ?? 'beginner',
    difficulty: overrides.difficulty ?? 'beginner',
    estimatedSessionDuration: overrides.estimatedSessionDuration ?? 60,
    macrocycle: overrides.macrocycle ?? { name: 'Macro', goal: 'Goal', durationWeeks: 4, phases: [] },
    mesocycles: overrides.mesocycles ?? [],
    microcycles: overrides.microcycles ?? [],
    workoutTemplates: overrides.workoutTemplates ?? [],
    schedule:
      overrides.schedule ??
      {
        startDate: new Date().toISOString(),
        timeZone: 'UTC',
        weeklySchedule: {
          monday: { workoutName: 'Workout', isRestDay: false },
        },
        exceptions: [],
      },
    progressionRules: overrides.progressionRules ?? {},
    aiMetadata: overrides.aiMetadata,
    status: overrides.status,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
    version: overrides.version ?? 1,
    parentPlanId: overrides.parentPlanId,
    isTemplate: overrides.isTemplate ?? false,
    templateCategory: overrides.templateCategory,
    isPublic: overrides.isPublic ?? false,
    locale: overrides.locale ?? 'en',
    units: overrides.units ?? 'metric',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

const mockPlans: WorkoutPlan[] = [
  buildPlan({
    id: '00000000-1111-2222-3333-444444444444',
    name: 'Sedentary Strength Builder',
    status: 'draft',
  }),
  buildPlan({
    id: '00000000-1111-2222-3333-555555555555',
    name: 'Mobility Builder',
    description: 'Active mobility progression for busy clients.',
    status: 'active',
  }),
  buildPlan({
    id: '00000000-1111-2222-3333-666666666666',
    name: 'Recovery Reset',
    description: 'Low-impact recovery and mobility work.',
    status: 'completed',
  }),
];

describe('Filter workout plans', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(requestUrl, 'http://localhost');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search')?.toLowerCase();

      const items = mockPlans.filter((plan) => {
        const matchesStatus = !status || plan.status === status;
        const matchesSearch =
          !search ||
          plan.name.toLowerCase().includes(search) ||
          plan.description?.toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
      });

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items,
            pagination: {
              page: 1,
              limit: 10,
              total: items.length,
              totalPages: items.length === 0 ? 0 : 1,
              hasNext: false,
              hasPrev: false,
            },
          },
        }),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters plans by status', async () => {
    renderWithQueryClient(<WorkoutPlanList />);

    await waitFor(() => {
      expect(screen.getByText('Sedentary Strength Builder')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Mobility Builder/i })).toBeInTheDocument();
    });

    expect(screen.queryByText('Sedentary Strength Builder')).not.toBeInTheDocument();
    expect(screen.queryByText('Recovery Reset')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('searches by name or description and combines with status filters', async () => {
    renderWithQueryClient(<WorkoutPlanList />);

    await waitFor(() => {
      expect(screen.getByText('Sedentary Strength Builder')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Search plans'), { target: { value: 'mobility' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => {
      expect(screen.getByText('Mobility Builder')).toBeInTheDocument();
    });

    expect(screen.getByText('Recovery Reset')).toBeInTheDocument();
    expect(screen.queryByText('Sedentary Strength Builder')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });

    await waitFor(() => {
      expect(screen.getByText('Mobility Builder')).toBeInTheDocument();
    });

    expect(screen.queryByText('Recovery Reset')).not.toBeInTheDocument();
  });

  it('shows a filtered empty state and allows clearing filters', async () => {
    renderWithQueryClient(<WorkoutPlanList />);

    await waitFor(() => {
      expect(screen.getByText('Sedentary Strength Builder')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Search plans'), { target: { value: 'no-match-value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => {
      expect(screen.getByText('No plans match the current filters')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sedentary Strength Builder')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(screen.getByText('Sedentary Strength Builder')).toBeInTheDocument();
    });

    expect(screen.getByText('Mobility Builder')).toBeInTheDocument();
    expect(screen.getByText('Recovery Reset')).toBeInTheDocument();
  });
});
