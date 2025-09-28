import { describe, it, expect } from 'vitest';
import { CreateWorkoutPlanSchema, CreateWorkoutSessionSchema } from '@/lib/shared/types';

const baseTemplate = {
  id: '11111111-1111-1111-1111-111111111111',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  name: 'Upper Body Strength',
  description: 'Push session',
  category: 'strength',
  difficulty: 'intermediate',
  estimatedDuration: 60,
  targetMuscleGroups: ['chest', 'shoulders'],
  workoutType: 'strength',
  warmUpExercises: [],
  mainExercises: [
    {
      id: '22222222-2222-2222-2222-222222222222',
      exerciseId: '33333333-3333-3333-3333-333333333333',
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
  equipmentRequired: ['bench'],
  tags: ['strength'],
  isActive: true,
  isPublic: false,
};

const basePlan = {
  userId: '44444444-4444-4444-4444-444444444444',
  name: '8 Week Strength Plan',
  description: 'Full body progressive plan',
  durationWeeks: 8,
  sessionsPerWeek: 4,
  primaryGoals: ['strength'],
  secondaryGoals: [] as string[],
  targetFitnessLevel: 'intermediate',
  difficulty: 'intermediate',
  estimatedSessionDuration: 60,
  macrocycle: {
    name: 'Strength Macro',
    goal: 'Increase compounds',
    durationWeeks: 8,
    phases: [{ name: 'Base', weeks: 4, focus: 'base' }],
  },
  mesocycles: [] as any[],
  microcycles: [] as any[],
  workoutTemplates: [baseTemplate],
  schedule: {
    startDate: new Date().toISOString(),
    timeZone: 'UTC',
    weeklySchedule: {
      monday: { workoutTemplateId: baseTemplate.id, isRestDay: false },
    },
    exceptions: [] as any[],
  },
  progressionRules: {},
  status: 'draft',
  locale: 'en',
  units: 'metric',
};

describe('CreateWorkoutPlanSchema', () => {
  it('accepts a valid plan payload', () => {
    expect(() => CreateWorkoutPlanSchema.parse(basePlan)).not.toThrow();
  });

  it('requires at least one workout template', () => {
    expect(() =>
      CreateWorkoutPlanSchema.parse({
        ...basePlan,
        workoutTemplates: [],
      })
    ).toThrow();
  });
  it('requires at least one schedule entry referencing a template or workout', () => {
    expect(() =>
      CreateWorkoutPlanSchema.parse({
        ...basePlan,
        schedule: {
          ...basePlan.schedule,
          weeklySchedule: {
            monday: { isRestDay: true },
            tuesday: { isRestDay: true },
          },
        },
      })
    ).toThrow();
  });
});

describe('CreateWorkoutSessionSchema', () => {
  it('accepts a valid session payload', () => {
    expect(() =>
      CreateWorkoutSessionSchema.parse({
        userId: basePlan.userId,
        workoutPlanId: basePlan.userId,
        name: 'Upper Body Session',
        sessionType: 'workout',
        scheduledDate: new Date().toISOString(),
        scheduledDuration: 60,
        sessionData: {
          totalExercises: 6,
          estimatedDuration: 60,
          targetMuscleGroups: ['chest', 'shoulders'],
          equipmentNeeded: ['bench'],
          difficultyLevel: 'intermediate',
        },
        warmUpExercises: [],
        mainExercises: [],
        coolDownExercises: [],
      })
    ).not.toThrow();
  });
});
