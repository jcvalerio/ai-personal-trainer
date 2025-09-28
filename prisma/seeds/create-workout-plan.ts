import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();

const SEED_PLAN_ID = '00000000-1111-2222-3333-444444444444';
const TEMPLATE_ID = '33333333-4444-5555-6666-777777777777';

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

  await prisma.workoutSession.deleteMany({ where: { workoutPlanId: SEED_PLAN_ID } });

  const macrocycle = {
    name: 'Sedentary Strength Builder Macrocycle',
    goal: 'build_strength',
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

  const workoutTemplate = {
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

  const weeklySchedule = {
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

  await prisma.workoutPlan.upsert({
    where: { id: SEED_PLAN_ID },
    update: {
      userId,
      name: 'Sedentary Strength Builder',
      description: null,
      durationWeeks: 4,
      sessionsPerWeek: 3,
      primaryGoals: ['strength'],
      secondaryGoals: [],
      targetFitnessLevel: 'beginner',
      difficulty: 'beginner',
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
      workoutTemplates: [workoutTemplate],
      schedule: {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: null,
        timeZone: 'UTC',
        weeklySchedule,
        exceptions: [],
      },
      progressionRules: { progression: 'linear' },
      aiMetadata: { source: 'seed' },
      status: 'draft',
      locale: 'en',
      units: 'metric',
      updatedAt: new Date(),
    },
    create: {
      id: SEED_PLAN_ID,
      userId,
      name: 'Sedentary Strength Builder',
      description: null,
      durationWeeks: 4,
      sessionsPerWeek: 3,
      primaryGoals: ['strength'],
      secondaryGoals: [],
      targetFitnessLevel: 'beginner',
      difficulty: 'beginner',
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
      workoutTemplates: [workoutTemplate],
      schedule: {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: null,
        timeZone: 'UTC',
        weeklySchedule,
        exceptions: [],
      },
      progressionRules: { progression: 'linear' },
      aiMetadata: { source: 'seed' },
      status: 'draft',
      locale: 'en',
      units: 'metric',
    },
  });
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
