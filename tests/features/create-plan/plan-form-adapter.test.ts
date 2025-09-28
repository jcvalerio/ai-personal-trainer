import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CreateWorkoutPlanSchema } from '@/lib/shared/types';
import { buildPlanFromForm } from '@/lib/workouts/plan-form-adapter';

const FIXED_UUIDS = [
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
];

describe('buildPlanFromForm', () => {
  beforeEach(() => {
    let callIndex = 0;
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      const value = FIXED_UUIDS[callIndex] ?? `generated-${callIndex}`;
      callIndex += 1;
      return value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produces a CreateWorkoutPlan compatible payload from minimal form data', () => {
    const plan = buildPlanFromForm(
      {
        name: 'Sedentary Strength Builder',
        durationWeeks: 4,
        sessionsPerWeek: 3,
        description: 'Introductory strength block.',
      },
      '11111111-2222-3333-4444-555555555555'
    );

    expect(() => CreateWorkoutPlanSchema.parse(plan)).not.toThrow();
    expect(plan.userId).toBe('11111111-2222-3333-4444-555555555555');
    expect(plan.workoutTemplates[0].mainExercises).toHaveLength(1);
    expect(plan.schedule.weeklySchedule.monday?.workoutTemplateId).toBe(FIXED_UUIDS[0]);
    expect(plan.primaryGoals).toEqual(['strength']);
  });

  it('generates only as many workout days as requested', () => {
    const plan = buildPlanFromForm(
      {
        name: 'Two Day Strength',
        durationWeeks: 6,
        sessionsPerWeek: 2,
      },
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    );

    const days = Object.keys(plan.schedule.weeklySchedule);
    expect(days).toEqual(['monday', 'tuesday']);
  });
});
