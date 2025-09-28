import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockWorkoutPlan = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}));

const mockWorkoutSession = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/services/prisma', () => ({
  prisma: {
    workoutPlan: mockWorkoutPlan,
    workoutSession: mockWorkoutSession,
  },
}));

import { workoutPlanService } from '@/lib/services/workout-plan-service';

const baseTemplate = {
  id: '11111111-1111-1111-1111-111111111111',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  name: 'Upper Body Strength',
  description: 'Push session',
  category: 'strength' as const,
  difficulty: 'intermediate' as const,
  estimatedDuration: 60,
  targetMuscleGroups: ['chest', 'shoulders'],
  workoutType: 'strength' as const,
  warmUpExercises: [],
  mainExercises: [
    {
      id: '22222222-2222-2222-2222-222222222222',
      exerciseId: '33333333-3333-3333-3333-333333333333',
      orderIndex: 0,
      phase: 'main' as const,
      sets: [
        {
          setNumber: 1,
          setType: 'working' as const,
          targetReps: 8,
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
  name: '8 Week Strength Plan',
  description: 'Full body progressive plan',
  durationWeeks: 8,
  sessionsPerWeek: 4,
  primaryGoals: ['strength'],
  secondaryGoals: [] as string[],
  targetFitnessLevel: 'intermediate' as const,
  difficulty: 'intermediate' as const,
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
  status: 'draft' as const,
  locale: 'en' as const,
  units: 'metric' as const,
};

describe('WorkoutPlanService.createPlan', () => {
  const userId = '55555555-5555-5555-5555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: () => 'generated-plan-id' },
        configurable: true,
      });
    } else {
      vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('generated-plan-id');
    }

    mockWorkoutPlan.create.mockResolvedValue({
      ...basePlan,
      id: 'generated-plan-id',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('persists a plan using prisma with sanitized data', async () => {
    const result = await workoutPlanService.createPlan(userId, basePlan);

    expect(mockWorkoutPlan.create).toHaveBeenCalledTimes(1);
    const call = mockWorkoutPlan.create.mock.calls[0][0];
    expect(call.data.name).toBe('8 Week Strength Plan');
    expect(call.data.userId).toBe(userId);
    expect(Array.isArray(call.data.workoutTemplates)).toBe(true);
    expect(result.id).toBe('generated-plan-id');
  });

  it('throws on invalid payload', async () => {
    await expect(
      workoutPlanService.createPlan(userId, {
        ...basePlan,
        workoutTemplates: [],
      })
    ).rejects.toThrow();
  });

  it('throws when schedule lacks workout references', async () => {
    await expect(
      workoutPlanService.createPlan(userId, {
        ...basePlan,
        schedule: {
          ...basePlan.schedule,
          weeklySchedule: {
            monday: { isRestDay: true },
            tuesday: { isRestDay: true },
          },
        },
      })
    ).rejects.toThrow();
  });
});
