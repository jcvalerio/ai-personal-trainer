import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { WorkoutPlan } from '@/lib/shared/types';

import { PlanDetailView } from '@/components/workouts/plan-detail';

const TEMPLATE_ID = '33333333-4444-5555-6666-777777777777';

const demoPlan: WorkoutPlan = {
  id: '22222222-3333-4444-5555-666666666666',
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
    phases: [
      {
        name: 'Foundation',
        weeks: 4,
        focus: 'build',
        description: 'Baseline strength accrual.',
        intensityRange: { min: 60, max: 75 },
        volumeProgression: 'increase',
      },
    ],
    progressionStrategy: 'linear',
  },
  mesocycles: [
    {
      name: 'Block 1',
      weekNumber: 1,
      focus: 'strength',
      volume: 'moderate',
      intensity: 'moderate',
      deloadWeek: false,
      keyMetrics: [],
    },
  ],
  microcycles: [
    {
      weekNumber: 1,
      workoutDays: ['monday', 'wednesday', 'friday'],
      restDays: ['tuesday', 'thursday', 'saturday', 'sunday'],
      totalVolume: 1200,
      averageIntensity: 65,
      pattern: 'accumulation',
    },
  ],
  workoutTemplates: [
    {
      id: TEMPLATE_ID,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      name: 'Full Body Primer',
      description: 'Guided machine-based full-body day.',
      category: 'strength',
      difficulty: 'beginner',
      estimatedDuration: 60,
      targetMuscleGroups: ['full_body'],
      workoutType: 'strength',
      trainingStyle: 'functional',
      warmUpExercises: [],
      mainExercises: [
        {
          id: '99999999-aaaa-bbbb-cccc-dddddddddddd',
          exerciseId: '88888888-9999-aaaa-bbbb-cccccccccccc',
          orderIndex: 0,
          phase: 'main',
          sets: [
            {
              setNumber: 1,
              setType: 'working',
              targetReps: 10,
              restPeriod: 90,
            },
          ],
          substitutions: [],
          modifications: [],
        },
      ],
      coolDownExercises: [],
      equipmentRequired: ['leg_press_machine'],
      spaceRequired: 'moderate',
      tags: ['strength'],
      isActive: true,
      isPublic: false,
    },
  ],
  schedule: {
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: null,
    timeZone: 'UTC',
    weeklySchedule: {
      monday: {
        workoutTemplateId: TEMPLATE_ID,
        workoutName: 'Full Body Primer',
        isRestDay: false,
        estimatedDuration: 60,
      },
      tuesday: {
        isRestDay: true,
      },
      wednesday: {
        workoutTemplateId: TEMPLATE_ID,
        workoutName: 'Full Body Primer',
        isRestDay: false,
        estimatedDuration: 60,
      },
      thursday: {
        isRestDay: true,
      },
      friday: {
        workoutTemplateId: TEMPLATE_ID,
        workoutName: 'Full Body Primer',
        isRestDay: false,
        estimatedDuration: 60,
      },
      saturday: {
        isRestDay: true,
      },
      sunday: {
        isRestDay: true,
      },
    },
    exceptions: [],
  },
  progressionRules: { progression: 'linear' },
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

describe('PlanDetailView', () => {
  it('renders the summary, macrocycle, schedule, and templates', () => {
    render(<PlanDetailView plan={demoPlan} />);

    expect(screen.getByRole('heading', { name: demoPlan.name })).toBeInTheDocument();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
    expect(screen.getByText('No description provided.')).toBeInTheDocument();
    expect(screen.getAllByText('4 weeks').length).toBeGreaterThan(0);
    expect(screen.getByText('3 sessions / week')).toBeInTheDocument();

    const macrocycleSection = screen.getByRole('region', { name: /macrocycle overview/i });
    expect(within(macrocycleSection).getByText(/build_strength/i)).toBeInTheDocument();
    expect(within(macrocycleSection).getByText('Foundation')).toBeInTheDocument();
    expect(within(macrocycleSection).getByText(/Weeks: 4/)).toBeInTheDocument();

    const scheduleSection = screen.getByRole('region', { name: /weekly schedule/i });
    expect(within(scheduleSection).getByText(/Monday/)).toBeInTheDocument();
    expect(within(scheduleSection).getAllByText(/Full Body Primer/).length).toBeGreaterThan(0);
    expect(within(scheduleSection).getByText(/Tuesday/)).toBeInTheDocument();
    expect(within(scheduleSection).getAllByText(/Rest day/).length).toBeGreaterThan(0);

    const templatesSection = screen.getByRole('region', { name: /workout templates/i });
    expect(within(templatesSection).getByText('Full Body Primer')).toBeInTheDocument();
    expect(within(templatesSection).getByText(/strength/i)).toBeInTheDocument();
    expect(within(templatesSection).getByText(/60 min/)).toBeInTheDocument();
    expect(within(templatesSection).getByText(/full_body/)).toBeInTheDocument();
  });

  it('falls back when description missing and rest day flagged', () => {
    const plan: WorkoutPlan = {
      ...demoPlan,
      description: undefined,
    };

    render(<PlanDetailView plan={plan} />);

    expect(screen.getByText('No description provided.')).toBeInTheDocument();
    const scheduleSection = screen.getByRole('region', { name: /weekly schedule/i });
    expect(within(scheduleSection).getAllByText(/Rest day/).length).toBeGreaterThan(0);
  });
});
