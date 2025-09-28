import { prisma } from './prisma';
import {
  CreateWorkoutPlanSchema,
  UpdateWorkoutPlanSchema,
  CreateWorkoutPlan,
  UpdateWorkoutPlan,
  WorkoutPlan,
  WorkoutStatusSchema,
  CreateWorkoutSessionSchema,
  CreateWorkoutSession,
} from '@/lib/shared/types';
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  status: WorkoutStatusSchema.optional(),
  search: z.string().optional(),
});

export class WorkoutPlanService {
  async createPlan(userId: string, data: CreateWorkoutPlan) {
    const parsed = CreateWorkoutPlanSchema.parse({
      ...data,
      userId,
      macrocycle: data.macrocycle || {
        name: data.name,
        goal: data.primaryGoals?.[0] || 'general_fitness',
        durationWeeks: data.durationWeeks,
        phases: [],
      },
      mesocycles: data.mesocycles || [],
      microcycles: data.microcycles || [],
      workoutTemplates: data.workoutTemplates,
      schedule: data.schedule,
      status: data.status ?? 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        id: parsed.id,
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
        macrocycle: parsed.macrocycle,
        mesocycles: parsed.mesocycles,
        microcycles: parsed.microcycles,
        workoutTemplates: parsed.workoutTemplates,
        schedule: parsed.schedule,
        progressionRules: parsed.progressionRules ?? {},
        aiMetadata: parsed.aiMetadata ?? {},
        status: parsed.status,
        locale: parsed.locale ?? 'en',
        units: parsed.units ?? 'metric',
      },
    });

    return this.mapPlan(plan);
  }

  async listPlans(userId: string, params: z.infer<typeof paginationSchema>) {
    const { page, limit, status, search } = paginationSchema.parse(params);

    const where = {
      userId,
      status: status ?? undefined,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
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
      items: items.map(this.mapPlan),
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
    if (!plan) {
      return null;
    }
    return this.mapPlan(plan);
  }

  async updatePlan(userId: string, planId: string, data: UpdateWorkoutPlan) {
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
        progressionRules: parsed.progressionRules ?? existing.progressionRules,
        aiMetadata: parsed.aiMetadata ?? existing.aiMetadata,
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
        sessionsToCreate.map((session) =>
          prisma.workoutSession.create({
            data: {
              ...session,
              userId,
              workoutPlanId: planId,
            },
          })
        )
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
    return sessions.map(this.mapSession);
  }

  async createSession(userId: string, planId: string, data: CreateWorkoutSession) {
    const parsed = CreateWorkoutSessionSchema.parse({
      ...data,
      userId,
      workoutPlanId: planId,
      id: crypto.randomUUID(),
      status: data.status ?? 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const session = await prisma.workoutSession.create({
      data: {
        id: parsed.id,
        userId,
        workoutPlanId: planId,
        name: parsed.name,
        sessionType: parsed.sessionType,
        scheduledDate: parsed.scheduledDate,
        scheduledTime: parsed.scheduledTime ?? null,
        scheduledDuration: parsed.scheduledDuration ?? null,
        sessionData: parsed.sessionData,
        warmUpExercises: parsed.warmUpExercises,
        mainExercises: parsed.mainExercises,
        coolDownExercises: parsed.coolDownExercises,
        status: parsed.status,
      },
    });

    return this.mapSession(session);
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    return session ? this.mapSession(session) : null;
  }

  async markSessionStarted(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.update({
      where: { id: sessionId, userId },
      data: {
        status: 'active',
        updatedAt: new Date(),
      },
    });
    return this.mapSession(session);
  }

  async markSessionComplete(userId: string, sessionId: string, payload: { completionPercentage?: number; notes?: string }) {
    const session = await prisma.workoutSession.update({
      where: { id: sessionId, userId },
      data: {
        status: 'completed',
        completionPercentage: payload.completionPercentage ?? 100,
        notes: payload.notes,
        updatedAt: new Date(),
        completedAt: new Date(),
      },
    });
    return this.mapSession(session);
  }

  private createSessionsFromSchedule(plan: any, startDate: Date) {
    const weeklySchedule = plan.schedule?.weeklySchedule ?? {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sessions: CreateWorkoutSession[] = [];

    days.forEach((day, index) => {
      const config = weeklySchedule[day];
      if (!config || config.isRestDay) return;

      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + index);

      const templateId = config.workoutTemplateId;
      const template = Array.isArray(plan.workoutTemplates)
        ? plan.workoutTemplates.find((t: any) => t.id === templateId)
        : undefined;

      const base: CreateWorkoutSession = {
        userId: plan.userId,
        workoutPlanId: plan.id,
        name: config.workoutName || template?.name || `${plan.name} Session`,
        sessionType: 'workout',
        scheduledDate: sessionDate.toISOString(),
        scheduledDuration: config.estimatedDuration || template?.estimatedDuration,
        sessionData: template
          ? {
              totalExercises: (template.mainExercises?.length ?? 0) + (template.warmUpExercises?.length ?? 0) + (template.coolDownExercises?.length ?? 0),
              estimatedDuration: template.estimatedDuration,
              targetMuscleGroups: template.targetMuscleGroups ?? [],
              equipmentNeeded: template.equipmentRequired ?? [],
              difficultyLevel: template.difficulty ?? 'intermediate',
            }
          : {
              totalExercises: 0,
              estimatedDuration: config.estimatedDuration ?? plan.estimatedSessionDuration ?? 60,
              targetMuscleGroups: plan.primaryGoals,
              equipmentNeeded: [],
              difficultyLevel: plan.difficulty ?? plan.targetFitnessLevel,
            },
        warmUpExercises: template?.warmUpExercises ?? [],
        mainExercises: template?.mainExercises ?? [],
        coolDownExercises: template?.coolDownExercises ?? [],
        status: 'active',
      };

      sessions.push(base);
    });

    return sessions;
  }

  private mapPlan(plan: any): WorkoutPlan {
    return {
      id: plan.id,
      userId: plan.userId,
      organizationId: plan.organizationId ?? undefined,
      name: plan.name,
      description: plan.description ?? undefined,
      durationWeeks: plan.durationWeeks,
      sessionsPerWeek: plan.sessionsPerWeek,
      primaryGoals: plan.primaryGoals ?? [],
      secondaryGoals: plan.secondaryGoals ?? [],
      targetFitnessLevel: plan.targetFitnessLevel,
      difficulty: plan.difficulty ?? plan.targetFitnessLevel,
      estimatedSessionDuration: plan.estimatedSessionDuration ?? undefined,
      macrocycle: plan.macrocycle,
      mesocycles: plan.mesocycles ?? [],
      microcycles: plan.microcycles ?? [],
      workoutTemplates: plan.workoutTemplates ?? [],
      schedule: plan.schedule,
      progressionRules: plan.progressionRules ?? {},
      aiMetadata: plan.aiMetadata ?? undefined,
      status: plan.status,
      startedAt: plan.startedAt ? plan.startedAt.toISOString?.() ?? plan.startedAt : undefined,
      completedAt: plan.completedAt ? plan.completedAt.toISOString?.() ?? plan.completedAt : undefined,
      version: plan.version ?? 1,
      parentPlanId: plan.parentPlanId ?? undefined,
      isTemplate: plan.isTemplate ?? false,
      templateCategory: plan.templateCategory ?? undefined,
      isPublic: plan.isPublic ?? false,
      locale: plan.locale ?? 'en',
      units: plan.units ?? 'metric',
      createdAt: plan.createdAt?.toISOString?.() ?? plan.createdAt,
      updatedAt: plan.updatedAt?.toISOString?.() ?? plan.updatedAt,
    };
  }

  private mapSession(session: any) {
    return {
      id: session.id,
      userId: session.userId,
      workoutPlanId: session.workoutPlanId ?? undefined,
      name: session.name,
      sessionType: session.sessionType,
      scheduledDate: session.scheduledDate?.toISOString?.() ?? session.scheduledDate,
      scheduledTime: session.scheduledTime?.toISOString?.() ?? session.scheduledTime,
      scheduledDuration: session.scheduledDuration ?? undefined,
      sessionData: session.sessionData,
      warmUpExercises: session.warmUpExercises ?? [],
      mainExercises: session.mainExercises ?? [],
      coolDownExercises: session.coolDownExercises ?? [],
      status: session.status,
      completionPercentage: session.completionPercentage ?? 0,
      effortRating: session.effortRating ?? undefined,
      energyLevelBefore: session.energyLevelBefore ?? undefined,
      energyLevelAfter: session.energyLevelAfter ?? undefined,
      notes: session.notes ?? undefined,
      createdAt: session.createdAt?.toISOString?.() ?? session.createdAt,
      updatedAt: session.updatedAt?.toISOString?.() ?? session.updatedAt,
    };
  }
}

export const workoutPlanService = new WorkoutPlanService();
