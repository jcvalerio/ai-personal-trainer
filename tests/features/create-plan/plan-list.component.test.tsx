import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { WorkoutPlanList } from '@/components/workouts/plan-list';
import { renderWithQueryClient } from '@/tests/utils/render-with-query-client';

const mockPlans = {
  success: true,
  data: {
    items: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        userId: '22222222-2222-2222-2222-222222222222',
        organizationId: undefined,
        name: 'Strength Plan',
        description: 'Build strength',
        durationWeeks: 8,
        sessionsPerWeek: 3,
        primaryGoals: ['strength'],
        secondaryGoals: [],
        targetFitnessLevel: 'intermediate',
        difficulty: 'intermediate',
        estimatedSessionDuration: 60,
        macrocycle: { name: 'Macro', goal: 'Goal', durationWeeks: 8, phases: [] },
        mesocycles: [],
        microcycles: [],
        workoutTemplates: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            name: 'Template',
            description: 'Session',
            category: 'strength',
            difficulty: 'intermediate',
            estimatedDuration: 60,
            targetMuscleGroups: ['chest'],
            workoutType: 'strength',
            warmUpExercises: [],
            mainExercises: [],
            coolDownExercises: [],
            equipmentRequired: [],
            tags: [],
            isActive: true,
            isPublic: false,
            spaceRequired: 'moderate',
          },
        ],
        schedule: {
          startDate: new Date().toISOString(),
          timeZone: 'UTC',
          weeklySchedule: {
            monday: { workoutTemplateId: '33333333-3333-3333-3333-333333333333', isRestDay: false },
          },
          exceptions: [],
        },
        progressionRules: {},
        aiMetadata: undefined,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  },
};

describe('WorkoutPlanList component', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockPlans,
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders plans from the API', async () => {
    renderWithQueryClient(<WorkoutPlanList />);

    await waitFor(() => {
      expect(screen.getByText('Strength Plan')).toBeInTheDocument();
    });

    const planLink = screen.getByRole('link', { name: /Strength Plan/i });
    expect(planLink).toHaveAttribute('href', '/workouts/plans/11111111-1111-1111-1111-111111111111');
  });

  it('renders an error state when fetch fails', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as unknown as Response);

    renderWithQueryClient(<WorkoutPlanList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error loading plans');
    });
  });
});
