import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/hooks/use-workout-plan', () => ({
  useWorkoutPlan: vi.fn(),
}));

vi.mock('@/lib/hooks/use-plan-sessions', () => ({
  usePlanSessions: vi.fn(),
}));

import { PlanDetailScreen, PlanDetailView } from '@/components/workouts/plan-detail';
import type { WorkoutPlan } from '@/lib/shared/types';
import { useWorkoutPlan } from '@/lib/hooks/use-workout-plan';
import { usePlanSessions } from '@/lib/hooks/use-plan-sessions';
import { renderWithQueryClient } from '@/tests/utils/render-with-query-client';

const mockUseWorkoutPlan = vi.mocked(useWorkoutPlan);
const mockUsePlanSessions = vi.mocked(usePlanSessions);

const plan: WorkoutPlan = {
  id: '00000000-1111-2222-3333-444444444444',
  userId: '11111111-2222-3333-4444-555555555555',
  organizationId: undefined,
  name: 'Sedentary Strength Builder',
  description: undefined,
  durationWeeks: 4,
  sessionsPerWeek: 3,
  primaryGoals: ['strength'],
  secondaryGoals: [],
  targetFitnessLevel: 'beginner',
  difficulty: 'beginner',
  estimatedSessionDuration: 60,
  macrocycle: {
    name: 'Sedentary Strength Builder Macrocycle',
    goal: 'build_strength',
    durationWeeks: 4,
    phases: [{ name: 'Foundation', weeks: 4, focus: 'build', description: 'Baseline strength accrual.' }],
  },
  mesocycles: [],
  microcycles: [],
  workoutTemplates: [
    {
      id: '33333333-4444-5555-6666-777777777777',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      name: 'Full Body Primer',
      description: 'Guided machine-based full-body day.',
      category: 'strength',
      difficulty: 'beginner',
      estimatedDuration: 60,
      targetMuscleGroups: ['full_body'],
      workoutType: 'strength',
      warmUpExercises: [],
      mainExercises: [],
      coolDownExercises: [],
      equipmentRequired: [],
      spaceRequired: 'moderate',
      tags: [],
      isActive: true,
      isPublic: false,
    },
  ],
  schedule: {
    startDate: '2025-01-01T00:00:00.000Z',
    timeZone: 'UTC',
    weeklySchedule: {
      monday: {
        workoutTemplateId: '33333333-4444-5555-6666-777777777777',
        workoutName: 'Full Body Primer',
        isRestDay: false,
        estimatedDuration: 60,
      },
      tuesday: { isRestDay: true },
    },
    exceptions: [],
  },
  progressionRules: {},
  aiMetadata: { source: 'seed' },
  status: 'draft',
  startedAt: undefined,
  completedAt: undefined,
  version: 1,
  parentPlanId: undefined,
  isTemplate: false,
  templateCategory: undefined,
  isPublic: false,
  locale: 'en',
  units: 'metric',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('PlanDetailView header actions', () => {
  it('renders header actions when provided', () => {
    render(
      <PlanDetailView
        plan={plan}
        headerActions={<button type="button">Start plan</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Start plan' })).toBeInTheDocument();
  });

  it('renders an informational banner when provided', () => {
    render(
      <PlanDetailView
        plan={plan}
        banner={
          <div role="status" className="test-banner">
            Plan activated
          </div>
        }
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Plan activated');
  });
});

describe('PlanDetailScreen start plan confirmation', () => {
  beforeEach(() => {
    mockUseWorkoutPlan.mockReset();
    mockUsePlanSessions.mockReset();

    mockUseWorkoutPlan.mockReturnValue({ data: plan, isLoading: false, error: null } as any);
    mockUsePlanSessions.mockReturnValue({ data: [], isLoading: false, error: null } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a confirmation dialog and cancels without starting the plan', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    renderWithQueryClient(<PlanDetailScreen planId={plan.id} />);

    fireEvent.click(screen.getByRole('button', { name: /start plan/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Start workout plan?');
    expect(screen.getByText(/will activate the plan and generate the first week of scheduled sessions/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start plan/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls the start endpoint only after confirmation and preserves success feedback', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          workoutPlan: {
            ...plan,
            status: 'active',
            startedAt: '2025-01-08T00:00:00.000Z',
          },
        },
      }),
    } as unknown as Response);

    renderWithQueryClient(<PlanDetailScreen planId={plan.id} />);

    fireEvent.click(screen.getByRole('button', { name: /start plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm start/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/workouts/plans/${plan.id}/start`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-user-id': expect.any(String),
        }),
        body: JSON.stringify({}),
      })
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(`Plan ${plan.name} is now active.`);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
