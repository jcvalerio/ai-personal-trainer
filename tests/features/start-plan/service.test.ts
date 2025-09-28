import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockWorkoutPlan = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
}));

const mockWorkoutSession = vi.hoisted(() => ({
  create: vi.fn(),
}));

const mockTransaction = vi.hoisted(() =>
  vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
);

vi.mock('@/lib/services/prisma', () => ({
  prisma: {
    workoutPlan: mockWorkoutPlan,
    workoutSession: mockWorkoutSession,
    $transaction: mockTransaction,
  },
}));

import { workoutPlanService } from '@/lib/services/workout-plan-service';

const template = {
  id: '33333333-4444-5555-6666-777777777777',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  name: 'Full Body Primer',
  description: 'Guided full-body machine workout.',
  category: 'strength' as const,
  difficulty: 'beginner' as const,
  estimatedDuration: 60,
  targetMuscleGroups: ['full_body'],
  workoutType: 'strength' as const,
  warmUpExercises: [],
  mainExercises: [
    {
      id: '44444444-5555-6666-7777-888888888888',
      exerciseId: '99999999-aaaa-bbbb-cccc-dddddddddddd',
      orderIndex: 0,
      phase: 'main' as const,
      sets: [
        {
          setNumber: 1,
          setType: 'working' as const,
          targetReps: 10,
          restPeriod: 90,
        },
      ],
      substitutions: [],
      modifications: [],
    },
  ],
  coolDownExercises: [],
  equipmentRequired: [],
  spaceRequired: 'moderate' as const,
  tags: [],
  isActive: true,
  isPublic: false,
};

const storedPlan = {
  id: '00000000-1111-2222-3333-444444444444',
  userId: '11111111-2222-3333-4444-555555555555',
  name: 'Sedentary Strength Builder',
  description: null,
  durationWeeks: 4,
  sessionsPerWeek: 3,
  primaryGoals: ['strength'],
  secondaryGoals: [] as string[],
  targetFitnessLevel: 'beginner' as const,
  difficulty: 'beginner' as const,
  estimatedSessionDuration: 60,
  macrocycle: {
    name: 'Sedentary Strength Builder Macrocycle',
    goal: 'build_strength',
    durationWeeks: 4,
    phases: [{ name: 'Foundation', weeks: 4, focus: 'build' }],
  },
  mesocycles: [] as unknown[],
  microcycles: [] as unknown[],
  workoutTemplates: [template],
  schedule: {
    startDate: '2025-01-01T00:00:00.000Z',
    timeZone: 'UTC',
    weeklySchedule: {
      monday: { workoutTemplateId: template.id, isRestDay: false, estimatedDuration: 60 },
      tuesday: { isRestDay: true },
      wednesday: { workoutTemplateId: template.id, isRestDay: false, estimatedDuration: 60 },
    },
    exceptions: [] as unknown[],
  },
  progressionRules: {},
  aiMetadata: { source: 'seed' },
  status: 'draft' as const,
  startedAt: null,
  completedAt: null,
  version: 1,
  parentPlanId: null,
  isTemplate: false,
  templateCategory: null,
  isPublic: false,
  locale: 'en' as const,
  units: 'metric' as const,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

describe('WorkoutPlanService.startPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkoutPlan.findFirst.mockResolvedValue({ ...storedPlan });
    mockWorkoutPlan.update.mockResolvedValue({
      ...storedPlan,
      status: 'active',
      startedAt: new Date('2025-01-08T00:00:00.000Z'),
      updatedAt: new Date('2025-01-08T00:00:00.000Z'),
    });
    mockWorkoutSession.create.mockImplementation(async (input) => input.data);
    mockTransaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  it('marks the plan active and creates sessions from the schedule', async () => {
    const result = await workoutPlanService.startPlan(
      storedPlan.userId,
      storedPlan.id,
      { startDate: '2025-01-08T00:00:00.000Z' }
    );

    expect(mockWorkoutPlan.findFirst).toHaveBeenCalledWith({
      where: { id: storedPlan.id, userId: storedPlan.userId },
    });
    expect(mockWorkoutPlan.update).toHaveBeenCalledWith({
      where: { id: storedPlan.id },
      data: expect.objectContaining({ status: 'active' }),
    });
    expect(mockWorkoutSession.create).toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalled();
    expect(result?.status).toBe('active');
    expect(result?.startedAt).toBeDefined();
  });

  it('returns null when plan does not exist', async () => {
    mockWorkoutPlan.findFirst.mockResolvedValueOnce(null);

    const result = await workoutPlanService.startPlan('user-123', 'missing-plan', {});
    expect(result).toBeNull();
    expect(mockWorkoutPlan.update).not.toHaveBeenCalled();
  });
});
