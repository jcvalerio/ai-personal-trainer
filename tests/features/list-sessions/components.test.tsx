import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/lib/hooks/use-workout-plan', () => ({
  useWorkoutPlan: vi.fn(),
}));

vi.mock('@/lib/hooks/use-plan-sessions', () => ({
  usePlanSessions: vi.fn(),
}));

import { PlanDetailScreen } from '@/components/workouts/plan-detail';
import { renderWithQueryClient } from '@/tests/utils/render-with-query-client';
import { useWorkoutPlan } from '@/lib/hooks/use-workout-plan';
import { usePlanSessions } from '@/lib/hooks/use-plan-sessions';

const mockUseWorkoutPlan = vi.mocked(useWorkoutPlan);
const mockUsePlanSessions = vi.mocked(usePlanSessions);

const basePlan = {
  id: 'plan-123',
  userId: 'user-123',
  organizationId: null,
  name: 'Sedentary Strength Builder',
  description: null,
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
  status: 'draft',
  startedAt: new Date().toISOString(),
  completedAt: null,
  version: 1,
  parentPlanId: null,
  isTemplate: false,
  templateCategory: null,
  isPublic: false,
  locale: 'en',
  units: 'metric',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PlanDetailScreen sessions list', () => {
  beforeEach(() => {
    mockUseWorkoutPlan.mockReset();
    mockUsePlanSessions.mockReset();
  });

  it('renders upcoming sessions when available', () => {
    mockUseWorkoutPlan.mockReturnValue({ data: { ...basePlan, status: 'active' as const }, isLoading: false, error: null });
    mockUsePlanSessions.mockReturnValue({
      data: [
        {
          id: 'session-1',
          name: 'Full Body Primer',
          scheduledDate: '2025-01-08T10:00:00.000Z',
          status: 'draft',
        },
      ],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<PlanDetailScreen planId={basePlan.id} />);

    expect(screen.getByRole('heading', { name: /sessions/i })).toBeInTheDocument();
    expect(screen.getByText(/Full Body Primer/)).toBeInTheDocument();
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
  });

  it('shows an empty state when no sessions exist', async () => {
    mockUseWorkoutPlan.mockReturnValue({ data: { ...basePlan, status: 'active' as const }, isLoading: false, error: null });
    mockUsePlanSessions.mockReturnValue({ data: [], isLoading: false, error: null });

    renderWithQueryClient(<PlanDetailScreen planId={basePlan.id} />);

    expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument();
  });
});
