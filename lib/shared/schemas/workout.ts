import { z } from 'zod';
import {
  UUIDSchema,
  FitnessLevelSchema,
  WorkoutStatusSchema,
  SessionTypeSchema,
  LocaleSchema,
  UnitSystemSchema,
} from './common';

export const MacrocycleSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(1),
  durationWeeks: z.number().int().min(4).max(52),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  phases: z.array(
    z.object({
      name: z.string().min(1),
      weeks: z.number().int().positive(),
      focus: z.enum(['base', 'build', 'peak', 'recovery', 'transition']),
      description: z.string().optional(),
      intensityRange: z
        .object({
          min: z.number().min(0).max(100),
          max: z.number().min(0).max(100),
        })
        .optional(),
      volumeProgression: z.enum(['increase', 'maintain', 'decrease', 'undulating']).optional(),
    })
  ),
  progressionStrategy: z.enum(['linear', 'undulating', 'block', 'conjugate']).optional(),
});

export const MesocycleSchema = z.object({
  name: z.string().min(1),
  weekNumber: z.number().int().positive(),
  focus: z.enum(['strength', 'hypertrophy', 'power', 'endurance', 'recovery', 'technique']).optional(),
  volume: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  intensity: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  deloadWeek: z.boolean().optional(),
  keyMetrics: z.array(z.string()).optional(),
});

export const MicrocycleSchema = z.object({
  weekNumber: z.number().int().positive(),
  workoutDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  restDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  totalVolume: z.number().optional(),
  averageIntensity: z.number().optional(),
  pattern: z.enum(['accumulation', 'intensification', 'realization', 'recovery']).optional(),
});

export const WorkoutExerciseSchema = z.object({
  id: UUIDSchema,
  exerciseId: UUIDSchema,
  orderIndex: z.number().int().min(0),
  phase: z.enum(['warm_up', 'main', 'cool_down']).default('main'),
  sets: z.array(
    z.object({
      setNumber: z.number().int().positive(),
      setType: z.enum(['working', 'warm_up', 'back_off', 'drop', 'rest_pause', 'cluster']).default('working'),
      targetReps: z.number().int().positive().optional(),
      targetWeight: z.number().positive().optional(),
      targetDuration: z.number().positive().optional(),
      restPeriod: z.number().int().positive().optional(),
      notes: z.string().optional(),
      cues: z.array(z.string()).optional(),
    })
  ),
  substitutions: z.array(UUIDSchema).default([]),
  modifications: z
    .array(
      z.object({
        condition: z.string(),
        exerciseId: UUIDSchema,
        notes: z.string().optional(),
      })
    )
    .default([]),
});

export const WorkoutTemplateSchema = z.object({
  id: UUIDSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['strength', 'hypertrophy', 'power', 'endurance', 'mixed', 'recovery']),
  difficulty: FitnessLevelSchema,
  estimatedDuration: z.number().int().positive(),
  targetMuscleGroups: z.array(z.string()),
  workoutType: z.enum(['strength', 'hypertrophy', 'power', 'endurance', 'mixed', 'recovery']),
  trainingStyle: z.enum(['bodybuilding', 'powerlifting', 'crossfit', 'functional', 'sport_specific']).optional(),
  warmUpExercises: z.array(WorkoutExerciseSchema).default([]),
  mainExercises: z.array(WorkoutExerciseSchema).min(1),
  coolDownExercises: z.array(WorkoutExerciseSchema).default([]),
  equipmentRequired: z.array(z.string()).default([]),
  spaceRequired: z.enum(['minimal', 'moderate', 'large']).default('moderate'),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});

export const ScheduleDaySchema = z.object({
  workoutTemplateId: UUIDSchema.optional(),
  workoutName: z.string().optional(),
  isRestDay: z.boolean().default(false),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const ScheduleSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timeZone: z.string().default('UTC'),
  weeklySchedule: z.record(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    ScheduleDaySchema
  ),
  exceptions: z
    .array(
      z.object({
        date: z.string().datetime(),
        reason: z.string().optional(),
        replacementWorkout: UUIDSchema.optional(),
        isSkipped: z.boolean().default(false),
      })
    )
    .default([]),
});

export const WorkoutPlanSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  organizationId: UUIDSchema.optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  durationWeeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
  primaryGoals: z.array(z.string()).min(1),
  secondaryGoals: z.array(z.string()).default([]),
  targetFitnessLevel: FitnessLevelSchema,
  difficulty: FitnessLevelSchema,
  estimatedSessionDuration: z.number().int().positive().optional(),
  macrocycle: MacrocycleSchema,
  mesocycles: z.array(MesocycleSchema),
  microcycles: z.array(MicrocycleSchema),
  workoutTemplates: z.array(WorkoutTemplateSchema).min(1),
  schedule: ScheduleSchema,
  progressionRules: z.record(z.any()).optional(),
  aiMetadata: z.record(z.any()).optional(),
  status: WorkoutStatusSchema,
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  version: z.number().int().positive().default(1),
  parentPlanId: UUIDSchema.optional(),
  isTemplate: z.boolean().default(false),
  templateCategory: z.string().optional(),
  isPublic: z.boolean().default(false),
  locale: LocaleSchema,
  units: UnitSystemSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const BaseCreateWorkoutPlanSchema = WorkoutPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  status: true,
  locale: true,
  units: true,
  startedAt: true,
  completedAt: true,
}).extend({
  locale: LocaleSchema.optional().default('en'),
  units: UnitSystemSchema.optional().default('metric'),
  status: WorkoutStatusSchema.optional().default('draft'),
});

export const CreateWorkoutPlanSchema = BaseCreateWorkoutPlanSchema.superRefine((plan, ctx) => {
  const weeklySchedule = plan.schedule?.weeklySchedule ?? {};
  const scheduleKeys = Object.keys(weeklySchedule);
  if (scheduleKeys.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Weekly schedule must include at least one day entry',
      path: ['schedule', 'weeklySchedule'],
    });
    return;
  }

  const templateIds = new Set(plan.workoutTemplates.map((template) => template.id));
  const hasTemplateReference = scheduleKeys.some((dayKey) => {
    const dayConfig = weeklySchedule[dayKey as keyof typeof weeklySchedule];
    if (!dayConfig || dayConfig.isRestDay) return false;
    if (dayConfig.workoutTemplateId && templateIds.has(dayConfig.workoutTemplateId)) {
      return true;
    }
    return Boolean(dayConfig.workoutName);
  });

  if (!hasTemplateReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Weekly schedule must reference at least one workout template',
      path: ['schedule', 'weeklySchedule'],
    });
  }
});

export const UpdateWorkoutPlanSchema = BaseCreateWorkoutPlanSchema.partial();

export const SessionExerciseSchema = z.object({
  exerciseId: UUIDSchema,
  orderIndex: z.number().int().min(0),
  exercisePhase: z.enum(['warm_up', 'main', 'cool_down']).default('main'),
  plannedSets: z.number().int().positive().optional(),
  plannedReps: z.number().int().positive().optional(),
  plannedWeightKg: z.number().positive().optional(),
  plannedDurationSeconds: z.number().positive().optional(),
  plannedRestSeconds: z.number().int().positive().optional(),
  equipmentAlternatives: z.array(z.string()).optional(),
});

export const SessionDataSchema = z.object({
  totalExercises: z.number().int().nonnegative(),
  estimatedDuration: z.number().int().positive(),
  targetMuscleGroups: z.array(z.string()),
  equipmentNeeded: z.array(z.string()),
  difficultyLevel: FitnessLevelSchema,
  notes: z.string().optional(),
});

export const WorkoutSessionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  workoutPlanId: UUIDSchema.optional(),
  name: z.string().min(1),
  sessionType: SessionTypeSchema,
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().datetime().optional(),
  scheduledDuration: z.number().int().positive().optional(),
  sessionData: SessionDataSchema,
  warmUpExercises: z.array(SessionExerciseSchema).default([]),
  mainExercises: z.array(SessionExerciseSchema).default([]),
  coolDownExercises: z.array(SessionExerciseSchema).default([]),
  status: WorkoutStatusSchema,
  completionPercentage: z.number().int().min(0).max(100).default(0),
  effortRating: z.number().int().min(1).max(10).optional(),
  energyLevelBefore: z.number().int().min(1).max(10).optional(),
  energyLevelAfter: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateWorkoutSessionSchema = WorkoutSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completionPercentage: true,
  status: true,
}).extend({
  status: WorkoutStatusSchema.optional().default('draft'),
});

export const UpdateWorkoutSessionSchema = CreateWorkoutSessionSchema.partial();

export type Macrocycle = z.infer<typeof MacrocycleSchema>;
export type Mesocycle = z.infer<typeof MesocycleSchema>;
export type Microcycle = z.infer<typeof MicrocycleSchema>;
export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;
export type CreateWorkoutPlan = z.infer<typeof CreateWorkoutPlanSchema>;
export type UpdateWorkoutPlan = z.infer<typeof UpdateWorkoutPlanSchema>;
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type CreateWorkoutSession = z.infer<typeof CreateWorkoutSessionSchema>;
export type UpdateWorkoutSession = z.infer<typeof UpdateWorkoutSessionSchema>;
