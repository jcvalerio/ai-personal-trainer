/**
 * MSW Data Layer
 * Mock database using @mswjs/data for consistent test data
 */

import { factory, primaryKey } from '@mswjs/data';
import { faker } from '@faker-js/faker';

// Create mock database schema
export const db = factory({
  user: {
    id: primaryKey(() => faker.string.uuid()),
    clerkId: () => faker.string.uuid(),
    email: () => faker.internet.email(),
    name: () => faker.person.fullName(),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  workoutPlan: {
    id: primaryKey(() => faker.string.uuid()),
    userId: () => faker.string.uuid(),
    name: () => faker.company.buzzPhrase(),
    description: () => faker.lorem.sentence(),
    status: () => faker.helpers.arrayElement(['draft', 'active', 'completed', 'paused', 'archived']),
    targetFitnessLevel: () => faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    durationWeeks: () => faker.number.int({ min: 1, max: 52 }),
    sessionsPerWeek: () => faker.number.int({ min: 1, max: 7 }),
    fitnessGoals: () => faker.helpers.arrayElements(['strength', 'endurance', 'weight_loss', 'muscle_gain'], { min: 1, max: 3 }),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  workoutSession: {
    id: primaryKey(() => faker.string.uuid()),
    userId: () => faker.string.uuid(),
    workoutPlanId: () => faker.string.uuid(),
    name: () => faker.company.buzzPhrase(),
    status: () => faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'skipped', 'cancelled']),
    sessionType: () => faker.helpers.arrayElement(['workout', 'assessment', 'recovery']),
    scheduledDate: () => faker.date.future().toISOString(),
    scheduledDuration: () => faker.number.int({ min: 15, max: 120 }), // minutes
    actualDuration: () => faker.number.int({ min: 10, max: 150 }), // minutes
    completionPercentage: () => faker.number.int({ min: 0, max: 100 }),
    effortRating: () => faker.number.int({ min: 1, max: 10 }),
    energyLevelBefore: () => faker.number.int({ min: 1, max: 10 }),
    energyLevelAfter: () => faker.number.int({ min: 1, max: 10 }),
    userNotes: () => faker.lorem.sentence(),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  exercise: {
    id: primaryKey(() => faker.string.uuid()),
    name: () => faker.company.buzzPhrase(),
    description: () => faker.lorem.paragraph(),
    instructions: () => faker.lorem.paragraphs(3),
    exerciseType: () => faker.helpers.arrayElement(['strength', 'cardio', 'flexibility', 'sports']),
    primaryMuscleGroups: () => faker.helpers.arrayElements(['chest', 'back', 'legs', 'arms', 'core'], { min: 1, max: 2 }),
    secondaryMuscleGroups: () => faker.helpers.arrayElements(['chest', 'back', 'legs', 'arms', 'core'], { min: 0, max: 2 }),
    difficultyLevel: () => faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    equipmentRequired: () => faker.helpers.arrayElements(['dumbbells', 'barbell', 'resistance_bands', 'bodyweight'], { min: 0, max: 2 }),
    defaultSets: () => faker.number.int({ min: 1, max: 5 }),
    defaultRepsMin: () => faker.number.int({ min: 5, max: 12 }),
    defaultRepsMax: () => faker.number.int({ min: 12, max: 20 }),
    defaultRestSeconds: () => faker.number.int({ min: 30, max: 180 }),
    isPublic: () => faker.datatype.boolean(),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  progressMeasurement: {
    id: primaryKey(() => faker.string.uuid()),
    userId: () => faker.string.uuid(),
    measurementType: () => faker.helpers.arrayElement(['weight', 'body_fat', 'muscle_mass', 'circumference']),
    measurementLocation: () => faker.helpers.arrayElement(['waist', 'chest', 'arms', 'thighs']),
    value: () => faker.number.float({ min: 50, max: 120, multipleOf: 0.1 }),
    unit: () => faker.helpers.arrayElement(['kg', 'lbs', 'cm', '%']),
    measuredAt: () => faker.date.recent().toISOString(),
    measurementMethod: () => faker.helpers.arrayElement(['scale', 'tape_measure', 'caliper', 'dexa']),
    notes: () => faker.lorem.sentence(),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  achievement: {
    id: primaryKey(() => faker.string.uuid()),
    userId: () => faker.string.uuid(),
    achievementType: () => faker.helpers.arrayElement(['streak', 'milestone', 'pr', 'consistency']),
    achievementName: () => faker.company.buzzPhrase(),
    description: () => faker.lorem.sentence(),
    value: () => faker.number.float({ min: 1, max: 100, multipleOf: 0.1 }),
    unit: () => faker.helpers.arrayElement(['days', 'workouts', 'kg', 'minutes']),
    category: () => faker.helpers.arrayElement(['strength', 'endurance', 'consistency', 'milestone']),
    achievedAt: () => faker.date.recent().toISOString(),
    pointsAwarded: () => faker.number.int({ min: 10, max: 500 }),
    isPublic: () => faker.datatype.boolean(),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  },

  template: {
    id: primaryKey(() => faker.string.uuid()),
    name: () => faker.company.buzzPhrase(),
    description: () => faker.lorem.paragraph(),
    category: () => faker.helpers.arrayElement(['strength', 'cardio', 'flexibility', 'mixed']),
    targetFitnessLevel: () => faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    estimatedDuration: () => faker.number.int({ min: 15, max: 120 }),
    equipmentNeeded: () => faker.helpers.arrayElements(['dumbbells', 'barbell', 'resistance_bands', 'bodyweight'], { min: 0, max: 3 }),
    isPublic: () => faker.datatype.boolean(),
    popularity: () => faker.number.int({ min: 0, max: 1000 }),
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.recent().toISOString(),
  }
});

// Seed initial data
export const seedDatabase = () => {
  // Create test users
  const testUser = db.user.create({
    clerkId: 'test-user-clerk-id',
    email: 'test@example.com',
    name: 'Test User'
  });

  // Create test workout plans
  const testPlan = db.workoutPlan.create({
    userId: testUser.id,
    name: 'Test Workout Plan',
    description: 'A comprehensive workout plan for testing',
    status: 'active',
    targetFitnessLevel: 'intermediate',
    durationWeeks: 12,
    sessionsPerWeek: 4,
    fitnessGoals: ['strength', 'muscle_gain']
  });

  // Create test workout sessions
  const testSession = db.workoutSession.create({
    id: 'test-session-123',
    userId: testUser.id,
    workoutPlanId: testPlan.id,
    name: 'Test Workout Session',
    status: 'completed',
    sessionType: 'workout',
    scheduledDuration: 60,
    actualDuration: 58,
    completionPercentage: 95,
    effortRating: 8,
    energyLevelBefore: 7,
    energyLevelAfter: 6
  });

  // Create test exercises
  const exercises = [
    'Push-ups',
    'Squats',
    'Planks',
    'Bench Press',
    'Deadlifts',
    'Pull-ups',
    'Lunges',
    'Shoulder Press'
  ].map(name => db.exercise.create({
    name,
    description: `${name} exercise for strength training`,
    exerciseType: 'strength',
    primaryMuscleGroups: ['chest', 'arms'],
    difficultyLevel: 'intermediate',
    equipmentRequired: name.includes('Press') ? ['barbell'] : ['bodyweight'],
    isPublic: true
  }));

  // Create test progress measurements
  db.progressMeasurement.create({
    userId: testUser.id,
    measurementType: 'weight',
    value: 75.2,
    unit: 'kg',
    measurementMethod: 'scale'
  });

  db.progressMeasurement.create({
    userId: testUser.id,
    measurementType: 'body_fat',
    value: 15.8,
    unit: '%',
    measurementMethod: 'caliper'
  });

  // Create test achievements
  db.achievement.create({
    userId: testUser.id,
    achievementType: 'streak',
    achievementName: 'Consistency Champion',
    description: '5 workouts in a row!',
    value: 5,
    unit: 'days',
    category: 'consistency',
    pointsAwarded: 100
  });

  // Create test templates
  const templates = [
    'Full Body Beginner',
    'Upper Body Strength',
    'Lower Body Power',
    'Cardio HIIT',
    'Flexibility Flow'
  ].map(name => db.template.create({
    name,
    description: `${name} workout template`,
    category: name.includes('Cardio') ? 'cardio' : 'strength',
    targetFitnessLevel: name.includes('Beginner') ? 'beginner' : 'intermediate',
    estimatedDuration: 45,
    isPublic: true,
    popularity: faker.number.int({ min: 50, max: 500 })
  }));

  return {
    testUser,
    testPlan,
    testSession,
    exercises,
    templates
  };
};

// Helper functions for tests
export const resetDatabase = () => {
  db.user.deleteMany({ where: {} });
  db.workoutPlan.deleteMany({ where: {} });
  db.workoutSession.deleteMany({ where: {} });
  db.exercise.deleteMany({ where: {} });
  db.progressMeasurement.deleteMany({ where: {} });
  db.achievement.deleteMany({ where: {} });
  db.template.deleteMany({ where: {} });
};

export const createTestUser = (overrides: Partial<Parameters<typeof db.user.create>[0]> = {}) => {
  return db.user.create({
    clerkId: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides
  });
};

export const createTestWorkoutSession = (userId: string, overrides: Partial<Parameters<typeof db.workoutSession.create>[0]> = {}) => {
  return db.workoutSession.create({
    userId,
    name: faker.company.buzzPhrase(),
    status: 'completed',
    sessionType: 'workout',
    scheduledDuration: 60,
    actualDuration: 58,
    completionPercentage: 90,
    effortRating: 7,
    ...overrides
  });
};