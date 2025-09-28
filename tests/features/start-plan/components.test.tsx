import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PlanDetailView } from '@/components/workouts/plan-detail';
import type { WorkoutPlan } from '@/lib/shared/types';

const plan: WorkoutPlan = {
  id: '00000000-1111-2222-3333-444444444444',
  userId: '11111111-2222-3333-4444-555555555555',
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
  startedAt: null,
  completedAt: null,
  version: 1,
  parentPlanId: null,
  isTemplate: false,
  templateCategory: null,
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
