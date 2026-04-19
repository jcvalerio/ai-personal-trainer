import { Prisma, type WorkoutPlan as PrismaWorkoutPlanRecord, type WorkoutSession as PrismaWorkoutSessionRecord } from '@prisma/client';
import { z } from 'zod';
import { prisma } from './prisma';
import {
  CreateWorkoutPlanSchema,
  CreateWorkoutSessionSchema,
  type CreateWorkoutPlan,
  type CreateWorkoutSession,
  type SessionExercise,
  type UpdateSessionProgress,
  UpdateWorkoutPlanSchema,
  type WorkoutPlan,
  type WorkoutSession,
  WorkoutStatusSchema,
} from '@/lib/shared/types';

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  status: WorkoutStatusSchema.optional(),
  search: z.string().optional(),
});

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toNullableJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export class WorkoutPlanService {
  async createPlan(userId: string, data: unknown) {
    const source = (typeof data === 'object' && data !== null ? data : {}) as Partial<CreateWorkoutPlan>;
    const planId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const parsed = CreateWorkoutPlanSchema.parse({
      ...source,
      userId,
      macrocycle: source.macrocycle || {
        name: source.name,
        goal: source.primaryGoals?.[0] || 'general_fitness',
        durationWeeks: source.durationWeeks,
        phases: [],
      },
      mesocycles: source.mesocycles || [],
      microcycles: source.microcycles || [],
      workoutTemplates: source.workoutTemplates,
      schedule: source.schedule,
      status: source.status ?? 'draft',
      locale: source.locale ?? 'en',
      units: source.units ?? 'metric',
      isTemplate: source.isTemplate ?? false,
      isPublic: source.isPublic ?? false,
      id: planId,
      createdAt,
      updatedAt,
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        id: planId,
        userId,
        name: parsed.name,
        description: parsed.description,
        durationWeeks: parsed.durationWeeks,
        sessionsPerWeek: parsed.sessionsPerWeek,
        primaryGoals: parsed.primaryGoals,
        secondaryGoals: parsed.secondaryGoals ?? [],
        targetFitnessLevel: parsed.targetFitnessLevel,
        difficulty: parsed.difficulty ?? parsed.targetFitnessLevel,
        estimatedSessionDuration: parsed.estimatedSessionDuration,
        macrocycle: toJson(parsed.macrocycle),
        mesocycles: toJson(parsed.mesocycles),
        microcycles: toJson(parsed.microcycles),
        workoutTemplates: toJson(parsed.workoutTemplates),
        schedule: toJson(parsed.schedule),
        progressionRules: toNullableJson(parsed.progressionRules ?? {}),
        aiMetadata: toNullableJson(parsed.aiMetadata ?? {}),
        status: parsed.status,
        locale: parsed.locale ?? 'en',
        units: parsed.units ?? 'metric',
        isTemplate: source.isTemplate ?? false,
        isPublic: source.isPublic ?? false,
      },
    });

    return this.mapPlan(plan);
  }

  async listPlans(userId: string, params: unknown) {
    const { page, limit, status, search } = paginationSchema.parse(params);

    const where = {
      userId,
      status: status ?? undefined,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.workoutPlan.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workoutPlan.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapPlan(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getPlan(userId: string, planId: string) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });

    return plan ? this.mapPlan(plan) : null;
  }

  async updatePlan(userId: string, planId: string, data: unknown) {
    const parsed = UpdateWorkoutPlanSchema.parse(data);
    const existing = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
    if (!existing) {
      return null;
    }

    const plan = await prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        ...parsed,
        secondaryGoals: parsed.secondaryGoals ?? existing.secondaryGoals,
        progressionRules: toNullableJson(parsed.progressionRules ?? existing.progressionRules),
        aiMetadata: toNullableJson(parsed.aiMetadata ?? existing.aiMetadata),
      },
    });

    return this.mapPlan(plan);
  }

  async startPlan(userId: string, planId: string, options?: { startDate?: string }) {
    const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) {
      return null;
    }

    const startDate = options?.startDate ? new Date(options.startDate) : new Date();
    await prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        status: 'active',
        startedAt: startDate,
        updatedAt: new Date(),
      },
    });

    const sessionsToCreate = this.createSessionsFromSchedule(plan, startDate);

    if (sessionsToCreate.length > 0) {
      await prisma.$transaction(
        sessionsToCreate.map((session) => {
          const sessionId = crypto.randomUUID();
          return prisma.workoutSession.create({
            data: {
              id: sessionId,
              userId,
              workoutPlanId: planId,
              name: session.name,
              sessionType: session.sessionType,
              scheduledDate: session.scheduledDate,
              scheduledTime: session.scheduledTime ?? null,
              scheduledDuration: session.scheduledDuration ?? null,
              sessionData: toJson(session.sessionData),
              warmUpExercises: toJson(session.warmUpExercises ?? []),
              mainExercises: toJson(session.mainExercises ?? []),
              coolDownExercises: toJson(session.coolDownExercises ?? []),
              status: session.status ?? 'draft',
            },
          });
        })
      );
    }

    return this.mapPlan({ ...plan, status: 'active', startedAt: startDate });
  }

  async listSessions(userId: string, planId: string) {
    const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) {
      return null;
    }

    const sessions = await prisma.workoutSession.findMany({
      where: { userId, workoutPlanId: planId },
      orderBy: { scheduledDate: 'asc' },
    });

    return sessions.map((session) => this.mapSession(session));
  }

  async createSession(userId: string, planId: string, data: unknown) {
    const parsed = CreateWorkoutSessionSchema.parse({
      ...(typeof data === 'object' && data !== null ? data : {}),
      userId,
      workoutPlanId: planId,
    });
    const sessionId = crypto.randomUUID();

    const session = await prisma.workoutSession.create({
      data: {
        id: sessionId,
        userId,
        workoutPlanId: planId,
        name: parsed.name,
        sessionType: parsed.sessionType,
        scheduledDate: parsed.scheduledDate,
        scheduledTime: parsed.scheduledTime ?? null,
        scheduledDuration: parsed.scheduledDuration ?? null,
        sessionData: toJson(parsed.sessionData),
        warmUpExercises: toJson(parsed.warmUpExercises ?? []),
        mainExercises: toJson(parsed.mainExercises ?? []),
        coolDownExercises: toJson(parsed.coolDownExercises ?? []),
        status: parsed.status ?? 'draft',
      },
    });

    return this.mapSession(session);
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    return session ? this.mapSession(session) : null;
  }

  async updateSessionProgress(userId: string, sessionId: string, payload: UpdateSessionProgress) {
    const existing = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!existing) {
      return null;
    }
    if (existing.status !== 'active') {
      throw new Error('INVALID_SESSION_STATE: Session progress can only be updated while active');
    }

    const warmUpExercises = this.mergeSessionExercises(existing.warmUpExercises ?? [], payload.warmUpExercises);
    const mainExercises = this.mergeSessionExercises(existing.mainExercises ?? [], payload.mainExercises);
    const coolDownExercises = this.mergeSessionExercises(existing.coolDownExercises ?? [], payload.coolDownExercises);
    const completionPercentage =
      payload.completionPercentage ?? this.calculateCompletionPercentage(warmUpExercises, mainExercises, coolDownExercises);

    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        warmUpExercises: toJson(warmUpExercises),
        mainExercises: toJson(mainExercises),
        coolDownExercises: toJson(coolDownExercises),
        completionPercentage,
        notes: payload.notes ?? existing.notes,
        updatedAt: new Date(),
      },
    });

    return this.mapSession(session);
  }

  async markSessionStarted(userId: string, sessionId: string) {
    const existing = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!existing) {
      return null;
    }
    if (existing.status === 'active') {
      return this.mapSession(existing);
    }
    if (existing.status !== 'draft') {
      throw new Error('INVALID_SESSION_STATE: Only draft sessions can be started');
    }

    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

    return this.mapSession(session);
  }

  async markSessionComplete(
    userId: string,
    sessionId: string,
    payload: {
      completionPercentage?: number;
      notes?: string;
      effortRating?: number;
      energyLevelBefore?: number;
      energyLevelAfter?: number;
    }
  ) {
    const existing = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!existing) {
      return null;
    }
    if (existing.status !== 'active') {
      throw new Error('INVALID_SESSION_STATE: Only active sessions can be completed');
    }

    const session = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completionPercentage: payload.completionPercentage ?? 100,
        notes: payload.notes,
        effortRating: payload.effortRating,
        energyLevelBefore: payload.energyLevelBefore,
        energyLevelAfter: payload.energyLevelAfter,
        updatedAt: new Date(),
      },
    });

    return this.mapSession(session);
  }

  private createSessionsFromSchedule(plan: PrismaWorkoutPlanRecord, startDate: Date): CreateWorkoutSession[] {
    const schedule = this.asRecord(plan.schedule);
    const weeklySchedule = this.asRecord(schedule.weeklySchedule);
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const sessions: CreateWorkoutSession[] = [];

    days.forEach((day, index) => {
      const config = this.asRecord(weeklySchedule[day]);
      if (!config || config.isRestDay) return;

      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + index);

      const templateId = config.workoutTemplateId;
      const templates = this.asRecordArray(plan.workoutTemplates);
      const template = templates.find((candidate) => candidate.id === templateId);

      const configWorkoutName = this.asString(config.workoutName);
      const configEstimatedDuration = this.asNumber(config.estimatedDuration);

      sessions.push({
        name: configWorkoutName || this.asString(template?.name) || `${plan.name} Session`,
        sessionType: 'workout',
        scheduledDate: sessionDate.toISOString(),
        scheduledDuration: configEstimatedDuration || this.asNumber(template?.estimatedDuration),
        sessionData: template
          ? {
              totalExercises:
                (this.asRecordArray(template.mainExercises).length ?? 0) +
                (this.asRecordArray(template.warmUpExercises).length ?? 0) +
                (this.asRecordArray(template.coolDownExercises).length ?? 0),
              estimatedDuration: this.asNumber(template.estimatedDuration) ?? 60,
              targetMuscleGroups: this.asStringArray(template.targetMuscleGroups) ?? [],
              equipmentNeeded: this.asStringArray(template.equipmentRequired) ?? [],
              difficultyLevel:
                template.difficulty === 'beginner' ||
                template.difficulty === 'intermediate' ||
                template.difficulty === 'advanced'
                  ? template.difficulty
                  : 'intermediate',
            }
          : {
              totalExercises: 0,
              estimatedDuration: configEstimatedDuration ?? plan.estimatedSessionDuration ?? 60,
              targetMuscleGroups: plan.primaryGoals,
              equipmentNeeded: [],
              difficultyLevel: plan.difficulty ?? plan.targetFitnessLevel,
            },
        warmUpExercises: this.mapTemplateExercises(template?.warmUpExercises, 'warm_up'),
        mainExercises: this.mapTemplateExercises(template?.mainExercises, 'main'),
        coolDownExercises: this.mapTemplateExercises(template?.coolDownExercises, 'cool_down'),
        status: 'draft',
      });
    });

    return sessions;
  }

  private mapTemplateExercises(exercises: unknown, phase: SessionExercise['exercisePhase']): SessionExercise[] {
    return this.asRecordArray(exercises).map((exercise) => {
      const sets = this.asRecordArray(exercise.sets);
      const primarySet = sets.find((set) => set.setType === 'working') ?? sets[0];

      return {
        exerciseId: this.asString(exercise.exerciseId) ?? crypto.randomUUID(),
        exerciseName: this.asString(exercise.exerciseName) ?? this.asString(exercise.name),
        orderIndex: this.asNumber(exercise.orderIndex) ?? 0,
        exercisePhase: phase,
        plannedSets: sets.length || undefined,
        plannedReps: this.asNumber(primarySet?.targetReps),
        plannedWeightKg: this.asNumber(primarySet?.targetWeight),
        plannedDurationSeconds: this.asNumber(primarySet?.targetDuration),
        plannedRestSeconds: this.asNumber(primarySet?.restPeriod),
        isCompleted: false,
        equipmentAlternatives: this.asStringArray(exercise.equipmentAlternatives),
      };
    });
  }

  private mergeSessionExercises(existing: unknown, updates?: UpdateSessionProgress['warmUpExercises']): SessionExercise[] {
    const existingExercises = Array.isArray(existing) ? existing : [];
    if (!updates || updates.length === 0) {
      return existingExercises.map((exercise) => this.normalizeSessionExercise(exercise));
    }

    const updatesById = new Map(updates.map((exercise) => [exercise.exerciseId, exercise]));

    return existingExercises.map((exercise) => {
      const normalized = this.normalizeSessionExercise(exercise);
      const update = updatesById.get(normalized.exerciseId);
      return update ? { ...normalized, ...update } : normalized;
    });
  }

  private calculateCompletionPercentage(
    warmUpExercises: SessionExercise[],
    mainExercises: SessionExercise[],
    coolDownExercises: SessionExercise[]
  ) {
    const allExercises = [...warmUpExercises, ...mainExercises, ...coolDownExercises];
    if (allExercises.length === 0) {
      return 0;
    }

    const completedExercises = allExercises.filter((exercise) => exercise.isCompleted).length;
    return Math.round((completedExercises / allExercises.length) * 100);
  }

  private normalizeSessionExercise(exercise: unknown): SessionExercise {
    const record = this.asRecord(exercise);

    return {
      exerciseId: this.asString(record.exerciseId) ?? crypto.randomUUID(),
      exerciseName: this.asString(record.exerciseName),
      orderIndex: this.asNumber(record.orderIndex) ?? 0,
      exercisePhase:
        record.exercisePhase === 'warm_up' || record.exercisePhase === 'cool_down' || record.exercisePhase === 'main'
          ? record.exercisePhase
          : 'main',
      plannedSets: this.asNumber(record.plannedSets),
      plannedReps: this.asNumber(record.plannedReps),
      plannedWeightKg: this.asNumber(record.plannedWeightKg),
      plannedDurationSeconds: this.asNumber(record.plannedDurationSeconds),
      plannedRestSeconds: this.asNumber(record.plannedRestSeconds),
      actualSets: this.asNumber(record.actualSets),
      actualReps: this.asNumber(record.actualReps),
      actualWeightKg: this.asNumber(record.actualWeightKg),
      actualDurationSeconds: this.asNumber(record.actualDurationSeconds),
      isCompleted: record.isCompleted === true,
      exerciseNotes: this.asString(record.exerciseNotes),
      equipmentAlternatives: this.asStringArray(record.equipmentAlternatives),
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private asRecordArray(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value)
      ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      : [];
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }

  private asNumber(value: unknown) {
    return typeof value === 'number' ? value : undefined;
  }

  private asStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
  }

  private asISOString(value: unknown) {
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    return undefined;
  }

  private mapPlan(plan: PrismaWorkoutPlanRecord): WorkoutPlan {
    return {
      id: plan.id,
      userId: plan.userId,
      organizationId: undefined,
      name: plan.name,
      description: plan.description ?? undefined,
      durationWeeks: plan.durationWeeks,
      sessionsPerWeek: plan.sessionsPerWeek,
      primaryGoals: plan.primaryGoals ?? [],
      secondaryGoals: plan.secondaryGoals ?? [],
      targetFitnessLevel: plan.targetFitnessLevel,
      difficulty: plan.difficulty ?? plan.targetFitnessLevel,
      estimatedSessionDuration: plan.estimatedSessionDuration ?? undefined,
      macrocycle: plan.macrocycle as unknown as WorkoutPlan['macrocycle'],
      mesocycles: (plan.mesocycles ?? []) as unknown as WorkoutPlan['mesocycles'],
      microcycles: (plan.microcycles ?? []) as unknown as WorkoutPlan['microcycles'],
      workoutTemplates: (plan.workoutTemplates ?? []) as unknown as WorkoutPlan['workoutTemplates'],
      schedule: plan.schedule as unknown as WorkoutPlan['schedule'],
      progressionRules: plan.progressionRules as unknown as WorkoutPlan['progressionRules'],
      aiMetadata: plan.aiMetadata as unknown as WorkoutPlan['aiMetadata'],
      status: plan.status,
      startedAt: this.asISOString(plan.startedAt),
      completedAt: this.asISOString(plan.completedAt),
      version: plan.version ?? 1,
      parentPlanId: plan.parentPlanId ?? undefined,
      isTemplate: plan.isTemplate ?? false,
      templateCategory: plan.templateCategory ?? undefined,
      isPublic: plan.isPublic ?? false,
      locale: (plan.locale === 'en' || plan.locale === 'es' ? plan.locale : 'en'),
      units: (plan.units === 'metric' || plan.units === 'imperial' ? plan.units : 'metric'),
      createdAt: this.asISOString(plan.createdAt) ?? new Date().toISOString(),
      updatedAt: this.asISOString(plan.updatedAt) ?? new Date().toISOString(),
    };
  }

  private mapSession(session: PrismaWorkoutSessionRecord): WorkoutSession {
    const sessionData = this.asRecord(session.sessionData);

    return {
      id: session.id,
      userId: session.userId,
      workoutPlanId: session.workoutPlanId ?? undefined,
      name: session.name,
      sessionType: session.sessionType,
      scheduledDate: this.asISOString(session.scheduledDate) ?? new Date().toISOString(),
      scheduledTime: this.asISOString(session.scheduledTime),
      scheduledDuration: session.scheduledDuration ?? undefined,
      sessionData: {
        totalExercises: this.asNumber(sessionData.totalExercises) ?? 0,
        estimatedDuration: this.asNumber(sessionData.estimatedDuration) ?? session.scheduledDuration ?? 60,
        targetMuscleGroups: this.asStringArray(sessionData.targetMuscleGroups) ?? [],
        equipmentNeeded: this.asStringArray(sessionData.equipmentNeeded) ?? [],
        difficultyLevel:
          sessionData.difficultyLevel === 'beginner' ||
          sessionData.difficultyLevel === 'intermediate' ||
          sessionData.difficultyLevel === 'advanced'
            ? sessionData.difficultyLevel
            : 'beginner',
        notes: this.asString(sessionData.notes),
      },
      warmUpExercises: this.asRecordArray(session.warmUpExercises).map((exercise) => this.normalizeSessionExercise(exercise)),
      mainExercises: this.asRecordArray(session.mainExercises).map((exercise) => this.normalizeSessionExercise(exercise)),
      coolDownExercises: this.asRecordArray(session.coolDownExercises).map((exercise) => this.normalizeSessionExercise(exercise)),
      status: session.status,
      completionPercentage: session.completionPercentage ?? 0,
      effortRating: session.effortRating ?? undefined,
      energyLevelBefore: session.energyLevelBefore ?? undefined,
      energyLevelAfter: session.energyLevelAfter ?? undefined,
      notes: session.notes ?? undefined,
      createdAt: this.asISOString(session.createdAt) ?? new Date().toISOString(),
      updatedAt: this.asISOString(session.updatedAt) ?? new Date().toISOString(),
    };
  }
}

export const workoutPlanService = new WorkoutPlanService();
