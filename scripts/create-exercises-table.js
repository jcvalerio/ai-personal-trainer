#!/usr/bin/env node

/**
 * Simple script to create exercises table and seed basic data
 * This addresses the missing 'exercises' table issue
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createExercisesTable() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🏗️  Creating exercises table...');
    
    // Create exercises table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        instructions TEXT,
        exercise_type VARCHAR(50) NOT NULL DEFAULT 'strength',
        primary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
        secondary_muscle_groups TEXT[] DEFAULT '{}',
        difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        equipment_required TEXT[] DEFAULT '{}',
        equipment_optional TEXT[] DEFAULT '{}',
        equipment_alternatives TEXT[] DEFAULT '{}',
        default_sets INTEGER,
        default_reps_min INTEGER,
        default_reps_max INTEGER,
        default_weight_percentage DECIMAL(5,2),
        default_rest_seconds INTEGER,
        default_duration_seconds INTEGER,
        demo_video_url VARCHAR(500),
        demo_image_url VARCHAR(500),
        instruction_images TEXT[] DEFAULT '{}',
        contraindications TEXT[] DEFAULT '{}',
        modifications TEXT[] DEFAULT '{}',
        safety_tips TEXT[] DEFAULT '{}',
        created_by VARCHAR(255),
        organization_id UUID,
        is_verified BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Exercises table created');
    
    console.log('🌱 Seeding basic exercises...');
    
    // Seed basic exercises
    await client.query(`
      INSERT INTO exercises (name, slug, description, instructions, exercise_type, primary_muscle_groups, difficulty_level, equipment_required, is_verified, is_public) VALUES
      ('Push-ups', 'push-ups', 'Classic bodyweight chest exercise', 
       'Start in plank position, lower body to ground, push back up', 
       'strength', ARRAY['chest', 'shoulders', 'triceps'], 'beginner', ARRAY[]::TEXT[], true, true),
      ('Squats', 'squats', 'Fundamental lower body movement', 
       'Stand with feet shoulder-width apart, lower as if sitting back, return to standing', 
       'strength', ARRAY['quadriceps', 'glutes'], 'beginner', ARRAY[]::TEXT[], true, true),
      ('Pull-ups', 'pull-ups', 'Upper body pulling exercise', 
       'Hang from bar, pull body up until chin over bar, lower with control', 
       'strength', ARRAY['lats', 'biceps'], 'intermediate', ARRAY['pull_up_bar'], true, true),
      ('Plank', 'plank', 'Core stability exercise', 
       'Hold straight line from head to heels in push-up position', 
       'strength', ARRAY['core', 'shoulders'], 'beginner', ARRAY[]::TEXT[], true, true),
      ('Burpees', 'burpees', 'Full body cardio movement', 
       'Squat, jump back to plank, push-up, jump forward, stand and jump', 
       'cardio', ARRAY['full_body'], 'intermediate', ARRAY[]::TEXT[], true, true),
      ('Lunges', 'lunges', 'Single leg strengthening exercise', 
       'Step forward, lower back knee toward ground, return to standing', 
       'strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'beginner', ARRAY[]::TEXT[], true, true),
      ('Deadlift', 'deadlift', 'Hip hinge movement pattern', 
       'Hinge at hips, lower weight to ground, drive hips forward to stand', 
       'strength', ARRAY['hamstrings', 'glutes', 'erector_spinae'], 'intermediate', ARRAY['barbell', 'dumbbells'], true, true),
      ('Bench Press', 'bench-press', 'Horizontal pushing exercise', 
       'Lie on bench, lower bar to chest, press up to full extension', 
       'strength', ARRAY['chest', 'shoulders', 'triceps'], 'intermediate', ARRAY['barbell', 'bench'], true, true)
      ON CONFLICT (slug) DO NOTHING
    `);
    
    // Check count
    const result = await client.query('SELECT COUNT(*) as count FROM exercises WHERE is_active = true');
    const count = parseInt(result.rows[0].count);
    
    console.log(`✅ Seeded ${count} exercises successfully`);
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
createExercisesTable().catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});