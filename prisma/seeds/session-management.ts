import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PLAN_ID = 'session-test-plan-0001';
const TEST_SESSION_IDS = {
  draft: 'session-test-0001',
  active: 'session-test-0002',
  completed: 'session-test-0003',
};

export async function seed() {
  const userId = process.env.E2E_USER_ID ?? '11111111-2222-3333-4444-555555555555';

  // Ensure user exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      displayName: 'Session Test Coach',
      updatedAt: new Date(),
    },
    create: {
      id: userId,
      clerkUserId: `session-test-${userId}`,
      email: 'session-test@example.com',
      displayName: 'Session Test Coach',
      locale: 'en',
      units: 'metric',
    },
  });

  // Delete existing test data
  await prisma.workoutSession.deleteMany({
    where: {
      workoutPlanId: TEST_PLAN_ID
    }
  });

  await prisma.workoutPlan.deleteMany({
    where: {
      id: TEST_PLAN_ID
    }
  });

  // Create test plan with workout templates
  const workoutTemplates = [
    {
      id: 'template-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: 'Full Body Strength',
      description: 'Comprehensive strength training for all major muscle groups',
      category: 'strength' as const,
      difficulty: 'intermediate' as const,
      estimatedDuration: 60,
      targetMuscleGroups: ['full_body'],
      workoutType: 'strength' as const,
      warmUpExercises: [
        {
          id: 'warm-001',
          exerciseId: 'exercise-warm-001',
          orderIndex: 0,
          phase: 'warm_up' as const,
          sets: [
            {
              setNumber: 1,
              setType: 'warm_up' as const,
              targetDuration: 300, // 5 minutes
              notes: 'Light cardio and dynamic movements',
            },
          ],
          substitutions: [],
          modifications: [],
        },
      ],
      mainExercises: [
        {
          id: 'main-001',
          exerciseId: 'exercise-squat-001',
          orderIndex: 0,
          phase: 'main' as const,
          sets: [
            { setNumber: 1, setType: 'warm_up' as const, targetReps: 15, targetWeight: 20, restPeriod: 60 },
            { setNumber: 2, setType: 'working' as const, targetReps: 10, targetWeight: 50, restPeriod: 90 },
            { setNumber: 3, setType: 'working' as const, targetReps: 10, targetWeight: 50, restPeriod: 90 },
            { setNumber: 4, setType: 'working' as const, targetReps: 10, targetWeight: 50, restPeriod: 90 },
          ],
          substitutions: [],
          modifications: [],
        },
        {
          id: 'main-002',
          exerciseId: 'exercise-bench-001',
          orderIndex: 1,
          phase: 'main' as const,
          sets: [
            { setNumber: 1, setType: 'working' as const, targetReps: 8, targetWeight: 40, restPeriod: 90 },
            { setNumber: 2, setType: 'working' as const, targetReps: 8, targetWeight: 40, restPeriod: 90 },
            { setNumber: 3, setType: 'working' as const, targetReps: 8, targetWeight: 40, restPeriod: 90 },
          ],
          substitutions: [],
          modifications: [],
        },
        {
          id: 'main-003',
          exerciseId: 'exercise-row-001',
          orderIndex: 2,
          phase: 'main' as const,
          sets: [
            { setNumber: 1, setType: 'working' as const, targetReps: 12, targetWeight: 30, restPeriod: 60 },
            { setNumber: 2, setType: 'working' as const, targetReps: 12, targetWeight: 30, restPeriod: 60 },
            { setNumber: 3, setType: 'working' as const, targetReps: 12, targetWeight: 30, restPeriod: 60 },
          ],
          substitutions: [],
          modifications: [],
        },
      ],
      coolDownExercises: [
        {
          id: 'cool-001',
          exerciseId: 'exercise-cool-001',
          orderIndex: 0,
          phase: 'cool_down' as const,
          sets: [
            {
              setNumber: 1,
              setType: 'working' as const,
              targetDuration: 600, // 10 minutes
              notes: 'Static stretching and relaxation',
            },
          ],
          substitutions: [],
          modifications: [],
        },
      ],
      equipmentRequired: ['barbell', 'dumbbells', 'bench'],
      spaceRequired: 'moderate' as const,
      tags: ['strength', 'full-body'],
      isActive: true,
      isPublic: false,
    },
  ];

  // Create the test plan
  await prisma.workoutPlan.create({
    data: {
      id: TEST_PLAN_ID,
      userId,
      name: 'Session Management Test Plan',
      description: 'Plan for testing session management features',
      durationWeeks: 4,
      sessionsPerWeek: 3,
      primaryGoals: ['strength', 'muscle_building'],
      secondaryGoals: ['endurance'],
      targetFitnessLevel: 'intermediate',
      difficulty: 'intermediate',
      estimatedSessionDuration: 60,
      macrocycle: {
        name: 'Test Macrocycle',
        goal: 'build_strength',
        durationWeeks: 4,
        phases: [
          {
            name: 'Foundation',
            weeks: 4,
            focus: 'base',
            description: 'Building foundation strength',
          },
        ],
      },
      mesocycles: [],
      microcycles: [],
      workoutTemplates,
      schedule: {
        startDate: new Date().toISOString(),
        timeZone: 'UTC',
        weeklySchedule: {
          monday: { workoutTemplateId: 'template-001', isRestDay: false, estimatedDuration: 60 },
          wednesday: { workoutTemplateId: 'template-001', isRestDay: false, estimatedDuration: 60 },
          friday: { workoutTemplateId: 'template-001', isRestDay: false, estimatedDuration: 60 },
        },
        exceptions: [],
      },
      progressionRules: {},
      aiMetadata: {},
      status: 'active',
      startedAt: new Date(),
      locale: 'en',
      units: 'metric',
    },
  });

  // Create sessions in different states
  const sessionData = {
    totalExercises: 5,
    estimatedDuration: 60,
    targetMuscleGroups: ['full_body'],
    equipmentNeeded: ['barbell', 'dumbbells', 'bench'],
    difficultyLevel: 'intermediate' as const,
  };

  // Helper to create exercise data for sessions
  const createExerciseData = () => [
    {
      exerciseId: 'exercise-warm-001',
      exerciseName: 'Dynamic Stretching',
      orderIndex: 0,
      exercisePhase: 'warm_up' as const,
      plannedSets: 1,
      plannedDurationSeconds: 300,
    },
    {
      exerciseId: 'exercise-squat-001',
      exerciseName: 'Squats',
      orderIndex: 0,
      exercisePhase: 'main' as const,
      plannedSets: 4,
      plannedReps: 10,
      plannedWeightKg: 50,
      plannedRestSeconds: 90,
    },
    {
      exerciseId: 'exercise-bench-001',
      exerciseName: 'Bench Press',
      orderIndex: 1,
      exercisePhase: 'main' as const,
      plannedSets: 3,
      plannedReps: 8,
      plannedWeightKg: 40,
      plannedRestSeconds: 90,
    },
    {
      exerciseId: 'exercise-row-001',
      exerciseName: 'Barbell Rows',
      orderIndex: 2,
      exercisePhase: 'main' as const,
      plannedSets: 3,
      plannedReps: 12,
      plannedWeightKg: 30,
      plannedRestSeconds: 60,
    },
    {
      exerciseId: 'exercise-cool-001',
      exerciseName: 'Static Stretching',
      orderIndex: 0,
      exercisePhase: 'cool_down' as const,
      plannedSets: 1,
      plannedDurationSeconds: 600,
    },
  ];

  // Create draft session
  await prisma.workoutSession.create({
    data: {
      id: TEST_SESSION_IDS.draft,
      userId,
      workoutPlanId: TEST_PLAN_ID,
      name: 'Session 1: Full Body Strength',
      sessionType: 'workout',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledDuration: 60,
      sessionData,
      warmUpExercises: createExerciseData().filter(e => e.exercisePhase === 'warm_up'),
      mainExercises: createExerciseData().filter(e => e.exercisePhase === 'main'),
      coolDownExercises: createExerciseData().filter(e => e.exercisePhase === 'cool_down'),
      status: 'draft',
      completionPercentage: 0,
    },
  });

  // Create active session with some progress
  await prisma.workoutSession.create({
    data: {
      id: TEST_SESSION_IDS.active,
      userId,
      workoutPlanId: TEST_PLAN_ID,
      name: 'Session 2: Full Body Strength',
      sessionType: 'workout',
      scheduledDate: new Date(), // Today
      scheduledDuration: 60,
      sessionData,
      warmUpExercises: createExerciseData().filter(e => e.exercisePhase === 'warm_up'),
      mainExercises: createExerciseData().filter(e => e.exercisePhase === 'main'),
      coolDownExercises: createExerciseData().filter(e => e.exercisePhase === 'cool_down'),
      status: 'active',
      completionPercentage: 40,
      notes: 'In progress...',
    },
  });

  // Create completed session
  await prisma.workoutSession.create({
    data: {
      id: TEST_SESSION_IDS.completed,
      userId,
      workoutPlanId: TEST_PLAN_ID,
      name: 'Session 3: Full Body Strength',
      sessionType: 'workout',
      scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      scheduledDuration: 60,
      sessionData,
      warmUpExercises: createExerciseData().filter(e => e.exercisePhase === 'warm_up'),
      mainExercises: createExerciseData().filter(e => e.exercisePhase === 'main'),
      coolDownExercises: createExerciseData().filter(e => e.exercisePhase === 'cool_down'),
      status: 'completed',
      completionPercentage: 100,
      effortRating: 8,
      energyLevelBefore: 7,
      energyLevelAfter: 5,
      notes: 'Great session! Client showed excellent form and increased weight on squats.',
    },
  });

  console.log('Session management test data seeded successfully');
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}