import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWorkoutPlan = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

const mockWorkoutSession = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('@/lib/services/prisma', () => ({
  prisma: {
    workoutPlan: mockWorkoutPlan,
    workoutSession: mockWorkoutSession,
  },
}));

import { workoutPlanService } from '@/lib/services/workout-plan-service';

describe('WorkoutPlanService.listSessions', () => {
  const userId = 'user-123';
  const planId = 'plan-456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkoutPlan.findFirst.mockResolvedValue({ id: planId });
  });

  it('returns sessions ordered by scheduled date', async () => {
    mockWorkoutSession.findMany.mockResolvedValue([
      {
        id: 's2',
        userId,
        workoutPlanId: planId,
        name: 'Session B',
        sessionType: 'workout',
        scheduledDate: new Date('2025-01-02T12:00:00.000Z'),
        scheduledTime: null,
        scheduledDuration: 60,
        sessionData: {},
        warmUpExercises: [],
        mainExercises: [],
        coolDownExercises: [],
        status: 'active',
        completionPercentage: 0,
        effortRating: null,
        energyLevelBefore: null,
        energyLevelAfter: null,
        notes: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        id: 's1',
        userId,
        workoutPlanId: planId,
        name: 'Session A',
        sessionType: 'workout',
        scheduledDate: new Date('2025-01-01T12:00:00.000Z'),
        scheduledTime: null,
        scheduledDuration: 60,
        sessionData: {},
        warmUpExercises: [],
        mainExercises: [],
        coolDownExercises: [],
        status: 'active',
        completionPercentage: 0,
        effortRating: null,
        energyLevelBefore: null,
        energyLevelAfter: null,
        notes: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await workoutPlanService.listSessions(userId, planId);

    expect(mockWorkoutPlan.findFirst).toHaveBeenCalledWith({
      where: { id: planId, userId },
    });
    expect(mockWorkoutSession.findMany).toHaveBeenCalledWith({
      where: { userId, workoutPlanId: planId },
      orderBy: { scheduledDate: 'asc' },
    });
    expect(result.map((session) => session.id)).toEqual(['s2', 's1']);
  });

  it('returns an empty array when no sessions exist', async () => {
    mockWorkoutSession.findMany.mockResolvedValue([]);
    const result = await workoutPlanService.listSessions(userId, planId);
    expect(result).toEqual([]);
  });

  it('returns null when the plan does not belong to the user', async () => {
    mockWorkoutPlan.findFirst.mockResolvedValueOnce(null);

    const result = await workoutPlanService.listSessions(userId, planId);
    expect(result).toBeNull();
    expect(mockWorkoutSession.findMany).not.toHaveBeenCalled();
  });
});
