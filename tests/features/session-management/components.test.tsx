import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/lib/hooks/use-workout-plan', () => ({
  useWorkoutPlan: vi.fn(),
}));

vi.mock('@/lib/hooks/use-plan-sessions', () => ({
  usePlanSessions: vi.fn(),
}));

import type { WorkoutSession } from '@/lib/shared/types';
import { SessionDetailView } from '@/components/workouts/session-detail';
import { PlanDetailScreen } from '@/components/workouts/plan-detail';
import { renderWithQueryClient } from '@/tests/utils/render-with-query-client';
import { useWorkoutPlan } from '@/lib/hooks/use-workout-plan';
import { usePlanSessions } from '@/lib/hooks/use-plan-sessions';

const mockUseWorkoutPlan = vi.mocked(useWorkoutPlan);
const mockUsePlanSessions = vi.mocked(usePlanSessions);

const baseSession: WorkoutSession = {
  id: '11111111-2222-3333-4444-555555555555',
  userId: '22222222-3333-4444-5555-666666666666',
  workoutPlanId: '33333333-4444-5555-6666-777777777777',
  name: 'Session 1: Full Body Strength',
  sessionType: 'workout',
  scheduledDate: '2025-01-08T10:00:00.000Z',
  scheduledDuration: 60,
  sessionData: {
    totalExercises: 3,
    estimatedDuration: 60,
    targetMuscleGroups: ['full_body'],
    equipmentNeeded: ['barbell'],
    difficultyLevel: 'beginner',
  },
  warmUpExercises: [
    {
      exerciseId: '44444444-5555-6666-7777-888888888888',
      exerciseName: 'Dynamic Stretching',
      orderIndex: 0,
      exercisePhase: 'warm_up',
      plannedSets: 1,
      plannedDurationSeconds: 300,
      isCompleted: false,
    },
  ],
  mainExercises: [
    {
      exerciseId: '55555555-6666-7777-8888-999999999999',
      exerciseName: 'Squats',
      orderIndex: 0,
      exercisePhase: 'main',
      plannedSets: 4,
      plannedReps: 10,
      plannedWeightKg: 50,
      plannedRestSeconds: 90,
      isCompleted: false,
    },
  ],
  coolDownExercises: [
    {
      exerciseId: '66666666-7777-8888-9999-aaaaaaaaaaaa',
      exerciseName: 'Static Stretching',
      orderIndex: 0,
      exercisePhase: 'cool_down',
      plannedSets: 1,
      plannedDurationSeconds: 600,
      isCompleted: false,
    },
  ],
  status: 'draft',
  completionPercentage: 0,
  createdAt: '2025-01-08T09:00:00.000Z',
  updatedAt: '2025-01-08T09:00:00.000Z',
};

const basePlan = {
  id: '33333333-4444-5555-6666-777777777777',
  userId: '22222222-3333-4444-5555-666666666666',
  name: 'Sedentary Strength Builder',
  durationWeeks: 4,
  sessionsPerWeek: 3,
  primaryGoals: ['strength'],
  secondaryGoals: [],
  targetFitnessLevel: 'beginner',
  difficulty: 'beginner',
  estimatedSessionDuration: 60,
  macrocycle: {
    name: 'Macro',
    goal: 'build_strength',
    durationWeeks: 4,
    phases: [{ name: 'Foundation', weeks: 4, focus: 'build', description: 'Intro' }],
  },
  mesocycles: [],
  microcycles: [],
  workoutTemplates: [],
  schedule: {
    startDate: new Date().toISOString(),
    timeZone: 'UTC',
    weeklySchedule: {},
    exceptions: [],
  },
  progressionRules: {},
  aiMetadata: {},
  status: 'active' as const,
  version: 1,
  isTemplate: false,
  isPublic: false,
  locale: 'en' as const,
  units: 'metric' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Session management components', () => {
  it('renders grouped session detail sections and start action for draft sessions', () => {
    renderWithQueryClient(<SessionDetailView session={baseSession} />);

    expect(screen.getByRole('heading', { name: /Session 1: Full Body Strength/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /warm-up/i })).toHaveTextContent('Dynamic Stretching');
    expect(screen.getByRole('region', { name: /main workout/i })).toHaveTextContent('Squats');
    expect(screen.getByRole('region', { name: /cool-down/i })).toHaveTextContent('Static Stretching');
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete workout/i })).not.toBeInTheDocument();
  });

  it('shows progress controls for active sessions', () => {
    renderWithQueryClient(
      <SessionDetailView
        session={{
          ...baseSession,
          status: 'active',
          warmUpExercises: [{ ...baseSession.warmUpExercises[0], isCompleted: true }],
          completionPercentage: 33,
        }}
      />
    );

    expect(screen.getByRole('button', { name: /complete workout/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /mark complete/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('33% complete')).toBeInTheDocument();
  });

  it('shows status badges and completion percentage in the plan sessions list', () => {
    mockUseWorkoutPlan.mockReturnValue({ data: basePlan, isLoading: false, error: null } as any);
    mockUsePlanSessions.mockReturnValue({
      data: [
        {
          ...baseSession,
          id: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
          status: 'active',
          completionPercentage: 50,
          name: 'Active Session',
        },
        {
          ...baseSession,
          id: '88888888-9999-aaaa-bbbb-cccccccccccc',
          status: 'completed',
          completionPercentage: 100,
          name: 'Completed Session',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    renderWithQueryClient(<PlanDetailScreen planId={basePlan.id} />);

    expect(screen.getByText('Active Session').closest('[data-session-status="active"]')).toBeInTheDocument();
    expect(screen.getByText('Completed Session').closest('[data-session-status="completed"]')).toBeInTheDocument();
    expect(screen.getByText('50% complete')).toBeInTheDocument();
    expect(screen.getByText('100% complete')).toBeInTheDocument();
  });
});
