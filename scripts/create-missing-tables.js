#!/usr/bin/env node

/**
 * Create missing tables for workout plan functionality
 * session_templates, template_exercises, workout_schedule
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createMissingTables() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🏗️ Creating session_templates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workout_plan_id UUID NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        session_type VARCHAR(50) NOT NULL DEFAULT 'workout',
        duration_minutes INTEGER,
        difficulty_level VARCHAR(50) DEFAULT 'beginner',
        target_muscle_groups TEXT[] DEFAULT '{}',
        equipment_needed TEXT[] DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ session_templates table created');

    console.log('🏗️ Creating template_exercises table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL,
        exercise_id UUID NOT NULL,
        order_index INTEGER NOT NULL,
        sets INTEGER NOT NULL DEFAULT 3,
        reps_min INTEGER,
        reps_max INTEGER,
        weight_kg DECIMAL(5,2),
        duration_seconds INTEGER,
        rest_seconds INTEGER DEFAULT 60,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (template_id) REFERENCES session_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ template_exercises table created');

    console.log('🏗️ Creating workout_schedule table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_schedule (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workout_plan_id UUID NOT NULL,
        week_number INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
        session_template_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (session_template_id) REFERENCES session_templates(id) ON DELETE CASCADE,
        UNIQUE(workout_plan_id, week_number, day_of_week)
      );
    `);
    console.log('✅ workout_schedule table created');

    console.log('🔍 Verifying tables exist...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('session_templates', 'template_exercises', 'workout_schedule')
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    console.log('🎉 Missing tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
createMissingTables().catch((error) => {
  console.error('💥 Table creation failed:', error);
  process.exit(1);
});