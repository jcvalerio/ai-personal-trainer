import { PrismaClient, type FitnessLevel, type WorkoutStatus } from '@prisma/client';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();

const SEED_PLAN_ID = '00000000-1111-2222-3333-444444444444';
const ACTIVE_PLAN_ID = '00000000-1111-2222-3333-555555555555';
const COMPLETED_PLAN_ID = '00000000-1111-2222-3333-666666666666';
const TEMPLATE_ID = '33333333-4444-5555-6666-777777777777';

function buildWorkoutTemplate() {
  return {
    id: TEMPLATE_ID,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    name: 'Full Body Primer',
    description: 'Guided machine-based full-body day.',
    category: 'strength',
    difficulty: 'beginner',
    estimatedDuration: 60,
    targetMuscleGroups: ['full_body'],
    workoutType: 'strength',
    trainingStyle: 'functional',
    warmUpExercises: [],
    mainExercises: [
      {
        id: '99999999-aaaa-bbbb-cccc-dddddddddddd',
        exerciseId: '88888888-9999-aaaa-bbbb-cccccccccccc',
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
    equipmentRequired: ['leg_press_machine'],
    spaceRequired: 'moderate',
    tags: ['strength'],
    isActive: true,
    isPublic: false,
  };
}

function buildWeeklySchedule() {
  return {
    monday: {
      workoutTemplateId: TEMPLATE_ID,
      workoutName: 'Full Body Primer',
      isRestDay: false,
      estimatedDuration: 60,
    },
    tuesday: {
      isRestDay: true,
    },
    wednesday: {
      workoutTemplateId: TEMPLATE_ID,
      workoutName: 'Full Body Primer',
      isRestDay: false,
      estimatedDuration: 60,
    },
    thursday: {
      isRestDay: true,
    },
    friday: {
      workoutTemplateId: TEMPLATE_ID,
      workoutName: 'Full Body Primer',
      isRestDay: false,
      estimatedDuration: 60,
    },
    saturday: {
      isRestDay: true,
    },
    sunday: {
      isRestDay: true,
    },
  };
}

function buildPlanRecord(input: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: WorkoutStatus;
  primaryGoals: string[];
  difficulty?: FitnessLevel;
}) {
  const macrocycle = {
    name: `${input.name} Macrocycle`,
    goal: input.primaryGoals[0] ?? 'general_fitness',
    durationWeeks: 4,
    phases: [
      {
        name: 'Foundation',
        weeks: 4,
        focus: 'build',
        description: 'Baseline strength accrual for sedentary clients.',
        intensityRange: { min: 60, max: 75 },
        volumeProgression: 'increase',
      },
    ],
    progressionStrategy: 'linear',
  };

  return {
    id: input.id,
    userId: input.userId,
    name: input.name,
    description: input.description,
    durationWeeks: 4,
    sessionsPerWeek: 3,
    primaryGoals: input.primaryGoals,
    secondaryGoals: [],
    targetFitnessLevel: 'beginner' as const,
    difficulty: input.difficulty ?? 'beginner',
    estimatedSessionDuration: 60,
    macrocycle,
    mesocycles: [
      {
        name: 'Block 1',
        weekNumber: 1,
        focus: 'strength',
        volume: 'moderate',
        intensity: 'moderate',
        deloadWeek: false,
        keyMetrics: [],
      },
    ],
    microcycles: [
      {
        weekNumber: 1,
        workoutDays: ['monday', 'wednesday', 'friday'],
        restDays: ['tuesday', 'thursday', 'saturday', 'sunday'],
        totalVolume: 1200,
        averageIntensity: 65,
        pattern: 'accumulation',
      },
    ],
    workoutTemplates: [buildWorkoutTemplate()],
    schedule: {
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: null,
      timeZone: 'UTC',
      weeklySchedule: buildWeeklySchedule(),
      exceptions: [],
    },
    progressionRules: { progression: 'linear' },
    aiMetadata: { source: 'seed' },
    status: input.status,
    locale: 'en' as const,
    units: 'metric' as const,
  };
}

async function upsertPlan(data: ReturnType<typeof buildPlanRecord>) {
  await prisma.workoutPlan.upsert({
    where: { id: data.id },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: data,
  });
}

export async function seed() {
  const userId = process.env.E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      displayName: 'E2E Coach',
      updatedAt: new Date(),
    },
    create: {
      id: userId,
      clerkUserId: `e2e-${userId}`,
      email: 'coach-e2e@example.com',
      displayName: 'E2E Coach',
      locale: 'en',
      units: 'metric',
    },
  });

  await prisma.workoutSession.deleteMany({
    where: {
      workoutPlanId: {
        in: [SEED_PLAN_ID, ACTIVE_PLAN_ID, COMPLETED_PLAN_ID],
      },
    },
  });

  await upsertPlan(
    buildPlanRecord({
      id: SEED_PLAN_ID,
      userId,
      name: 'Sedentary Strength Builder',
      description: null,
      status: 'draft',
      primaryGoals: ['strength'],
    })
  );

  await upsertPlan(
    buildPlanRecord({
      id: ACTIVE_PLAN_ID,
      userId,
      name: 'Mobility Builder',
      description: 'Active mobility progression for busy clients.',
      status: 'active',
      primaryGoals: ['mobility'],
    })
  );

  await upsertPlan(
    buildPlanRecord({
      id: COMPLETED_PLAN_ID,
      userId,
      name: 'Recovery Reset',
      description: 'Low-impact recovery and mobility work.',
      status: 'completed',
      primaryGoals: ['recovery'],
    })
  );
}

async function main() {
  try {
    await seed();
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
