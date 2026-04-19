import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWorkoutSession = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/services/prisma', () => ({
  prisma: {
    workoutSession: mockWorkoutSession,
  },
}));

import { workoutPlanService } from '@/lib/services/workout-plan-service';

const userId = '11111111-2222-3333-4444-555555555555';
const sessionId = '22222222-3333-4444-5555-666666666666';
const exerciseId = '33333333-4444-5555-6666-777777777777';

function buildSession(status: 'draft' | 'active' | 'completed' = 'active') {
  return {
    id: sessionId,
    userId,
    workoutPlanId: '44444444-5555-6666-7777-888888888888',
    name: 'Full Body Strength',
    sessionType: 'workout',
    scheduledDate: new Date('2025-01-01T10:00:00.000Z'),
    scheduledTime: null,
    scheduledDuration: 60,
    sessionData: {
      totalExercises: 2,
      estimatedDuration: 60,
      targetMuscleGroups: ['full_body'],
      equipmentNeeded: ['barbell'],
      difficultyLevel: 'beginner',
    },
    warmUpExercises: [],
    mainExercises: [
      {
        exerciseId,
        exerciseName: 'Squat',
        orderIndex: 0,
        exercisePhase: 'main',
        plannedSets: 3,
        plannedReps: 10,
        plannedWeightKg: 40,
        isCompleted: false,
      },
      {
        exerciseId: '55555555-6666-7777-8888-999999999999',
        exerciseName: 'Row',
        orderIndex: 1,
        exercisePhase: 'main',
        plannedSets: 3,
        plannedReps: 12,
        plannedWeightKg: 30,
        isCompleted: false,
      },
    ],
    coolDownExercises: [],
    status,
    completionPercentage: 0,
    effortRating: null,
    energyLevelBefore: null,
    energyLevelAfter: null,
    notes: null,
    createdAt: new Date('2025-01-01T09:00:00.000Z'),
    updatedAt: new Date('2025-01-01T09:00:00.000Z'),
  };
}

describe('WorkoutPlanService session management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates session progress and recalculates completion percentage', async () => {
    mockWorkoutSession.findFirst.mockResolvedValue(buildSession('active'));
    mockWorkoutSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...buildSession('active'),
      ...data,
      updatedAt: new Date('2025-01-01T11:00:00.000Z'),
    }));

    const result = await workoutPlanService.updateSessionProgress(userId, sessionId, {
      mainExercises: [
        {
          exerciseId,
          actualReps: 10,
          actualWeightKg: 42.5,
          isCompleted: true,
          exerciseNotes: 'Felt strong',
        },
      ],
    });

    expect(mockWorkoutSession.update).toHaveBeenCalledTimes(1);
    const updateCall = mockWorkoutSession.update.mock.calls[0][0];
    expect(updateCall.data.completionPercentage).toBe(50);
    expect(result?.completionPercentage).toBe(50);
    expect(result?.mainExercises[0]).toMatchObject({
      exerciseId,
      actualReps: 10,
      actualWeightKg: 42.5,
      isCompleted: true,
      exerciseNotes: 'Felt strong',
    });
  });

  it('rejects progress updates when the session is not active', async () => {
    mockWorkoutSession.findFirst.mockResolvedValue(buildSession('draft'));

    await expect(
      workoutPlanService.updateSessionProgress(userId, sessionId, {
        mainExercises: [
          {
            exerciseId,
            actualReps: 10,
            isCompleted: true,
          },
        ],
      })
    ).rejects.toThrow('Session progress can only be updated while active');
  });

  it('starts a draft session', async () => {
    mockWorkoutSession.findFirst.mockResolvedValue(buildSession('draft'));
    mockWorkoutSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...buildSession('draft'),
      ...data,
      updatedAt: new Date('2025-01-01T10:05:00.000Z'),
    }));

    const result = await workoutPlanService.markSessionStarted(userId, sessionId);

    expect(mockWorkoutSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: expect.objectContaining({ status: 'active' }),
    });
    expect(result?.status).toBe('active');
  });

  it('completes an active session with feedback metadata', async () => {
    mockWorkoutSession.findFirst.mockResolvedValue(buildSession('active'));
    mockWorkoutSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...buildSession('active'),
      ...data,
      updatedAt: new Date('2025-01-01T11:30:00.000Z'),
    }));

    const result = await workoutPlanService.markSessionComplete(userId, sessionId, {
      completionPercentage: 100,
      effortRating: 8,
      energyLevelBefore: 7,
      energyLevelAfter: 5,
      notes: 'Great session',
    });

    expect(result).toMatchObject({
      status: 'completed',
      completionPercentage: 100,
      effortRating: 8,
      energyLevelBefore: 7,
      energyLevelAfter: 5,
      notes: 'Great session',
    });
  });

  it('rejects completing a draft session', async () => {
    mockWorkoutSession.findFirst.mockResolvedValue(buildSession('draft'));

    await expect(
      workoutPlanService.markSessionComplete(userId, sessionId, { completionPercentage: 100 })
    ).rejects.toThrow('Only active sessions can be completed');
  });
});
