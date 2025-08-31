#!/usr/bin/env node
/**
 * Simple script to seed exercise_library table with basic exercises
 */

// Using the existing database connection that works with the app
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yH5e7CnVzcsu@ep-patient-king-ae8pv53n-pooler.c-2.us-east-2.aws.neon.tech/ai_trainer_db?sslmode=require&channel_binding=require';

async function seedExercises() {
  console.log('🌱 Starting exercise seeding...');
  
  try {
    const sql = neon(DATABASE_URL);
    
    // First check if exercises exist
    const countResult = await sql`SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true`;
    const count = parseInt(countResult[0]?.count || '0');
    
    console.log(`📊 Current exercises in database: ${count}`);
    
    if (count > 0) {
      console.log('✅ Exercises already exist, skipping seed');
      return;
    }
    
    console.log('📝 No exercises found, seeding basic exercises...');
    
    // Insert seed exercises one by one to avoid prepared statement issues
    const exercises = [
      {
        name: 'Push-ups',
        slug: 'push-ups', 
        description: 'Classic bodyweight chest exercise',
        instructions: 'Start in plank position, lower body to ground, push back up',
        exercise_type: 'strength',
        primary_muscle_groups: ['chest', 'shoulders', 'triceps'],
        difficulty_level: 'beginner',
        is_verified: true,
        is_public: true,
        is_active: true
      },
      {
        name: 'Squats',
        slug: 'squats',
        description: 'Fundamental lower body movement', 
        instructions: 'Stand with feet shoulder-width apart, lower as if sitting back, return to standing',
        exercise_type: 'strength',
        primary_muscle_groups: ['quadriceps', 'glutes'],
        difficulty_level: 'beginner',
        is_verified: true,
        is_public: true,
        is_active: true
      },
      {
        name: 'Plank',
        slug: 'plank',
        description: 'Core stability exercise',
        instructions: 'Hold straight line from head to heels in push-up position', 
        exercise_type: 'strength',
        primary_muscle_groups: ['core', 'shoulders'],
        difficulty_level: 'beginner',
        is_verified: true,
        is_public: true,
        is_active: true
      },
      {
        name: 'Burpees',
        slug: 'burpees',
        description: 'Full body cardio movement',
        instructions: 'Squat, jump back to plank, push-up, jump forward, stand and jump',
        exercise_type: 'cardio', 
        primary_muscle_groups: ['full_body'],
        difficulty_level: 'intermediate',
        is_verified: true,
        is_public: true,
        is_active: true
      },
      {
        name: 'Lunges',
        slug: 'lunges',
        description: 'Single leg strengthening exercise',
        instructions: 'Step forward, lower back knee toward ground, return to standing',
        exercise_type: 'strength',
        primary_muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
        difficulty_level: 'beginner', 
        is_verified: true,
        is_public: true,
        is_active: true
      }
    ];
    
    // Insert each exercise
    for (const exercise of exercises) {
      try {
        await sql`
          INSERT INTO exercise_library (
            name, slug, description, instructions, exercise_type, 
            primary_muscle_groups, difficulty_level, equipment_required, 
            is_verified, is_public, is_active
          ) VALUES (
            ${exercise.name}, ${exercise.slug}, ${exercise.description}, ${exercise.instructions}, ${exercise.exercise_type}, 
            ${exercise.primary_muscle_groups}, ${exercise.difficulty_level}, ${[]}, 
            ${exercise.is_verified}, ${exercise.is_public}, ${exercise.is_active}
          ) ON CONFLICT (slug) DO NOTHING
        `;
        
        console.log(`✅ Seeded: ${exercise.name}`);
      } catch (error) {
        console.log(`❌ Failed to seed ${exercise.name}:`, error.message);
      }
    }
    
    // Verify seeding
    const finalCountResult = await sql`SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true`;
    const finalCount = parseInt(finalCountResult[0]?.count || '0');
    
    console.log(`🎉 Seeding completed! Total exercises: ${finalCount}`);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedExercises();
}