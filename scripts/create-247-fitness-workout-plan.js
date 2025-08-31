#!/usr/bin/env node

/**
 * Create 247 Fitness CR Sarcopenia Treatment Program directly in database
 * This bypasses the UI exercise loading issue and creates a complete workout plan
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Get user ID - from database query (appttitude@gmail.com)
const TEST_USER_ID = 'user_01J6D1YHT7EW34QYZY5KQHX2PT';

async function create247FitnessPlan() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('👤 Getting user profile...');
    const userResult = await client.query(`
      SELECT id FROM user_profiles WHERE clerk_user_id = $1
    `, [TEST_USER_ID]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found. Please login first to create profile.');
    }
    
    const userId = userResult.rows[0].id;
    console.log('✅ Found user:', userId);
    
    console.log('🏗️ Creating workout plan...');
    
    // Create the workout plan
    const planResult = await client.query(`
      INSERT INTO workout_plans (
        id,
        user_id,
        name,
        description,
        duration_weeks,
        sessions_per_week,
        target_fitness_level,
        fitness_goals,
        estimated_session_duration,
        status,
        created_at,
        updated_at,
        started_at,
        is_active,
        is_template,
        is_public
      ) VALUES (
        gen_random_uuid(),
        $1,
        '247 Fitness CR - Sarcopenia Treatment Program',
        'Specialized 4-week program designed for sarcopenia treatment and muscle imbalance correction. Features 5 sessions per week (3 lower body, 2 upper body) with progressive resistance training. Focus on compound movements, unilateral exercises, and functional strength patterns. Developed by 247 Fitness CR for older adults and rehabilitation.',
        4,
        2,
        'intermediate',
        ARRAY['strength', 'muscle_gain', 'flexibility'],
        70,
        'active',
        NOW(),
        NOW(),
        NOW(),
        true,
        false,
        false
      ) RETURNING id
    `, [userId]);
    
    const planId = planResult.rows[0].id;
    console.log('✅ Created workout plan:', planId);
    
    console.log('📝 Creating session templates...');
    
    // Get some exercises for our templates
    const exercisesResult = await client.query(`
      SELECT id, name, slug FROM exercises 
      WHERE is_active = true 
      ORDER BY name 
      LIMIT 8
    `);
    
    const exercises = exercisesResult.rows;
    console.log('✅ Found', exercises.length, 'exercises');
    
    // Create Lower Body Session Template
    const lowerBodyTemplateResult = await client.query(`
      INSERT INTO session_templates (
        id,
        workout_plan_id,
        name,
        description,
        session_type,
        duration_minutes,
        difficulty_level,
        target_muscle_groups,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        'Lower Body - Quad Focus',
        'Quadriceps emphasis with imbalance correction',
        'workout',
        75,
        'intermediate',
        ARRAY['quadriceps', 'glutes', 'hamstrings', 'calves'],
        NOW(),
        NOW()
      ) RETURNING id
    `, [planId]);
    
    const lowerBodyTemplateId = lowerBodyTemplateResult.rows[0].id;
    console.log('✅ Created lower body template:', lowerBodyTemplateId);
    
    // Add exercises to the lower body template
    const lowerBodyExercises = exercises.slice(0, 4); // First 4 exercises
    
    for (let i = 0; i < lowerBodyExercises.length; i++) {
      const exercise = lowerBodyExercises[i];
      await client.query(`
        INSERT INTO template_exercises (
          id,
          template_id,
          exercise_id,
          order_index,
          sets,
          reps_min,
          reps_max,
          rest_seconds,
          notes,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          3,
          8,
          12,
          90,
          'Focus on proper form and controlled movement',
          NOW(),
          NOW()
        )
      `, [lowerBodyTemplateId, exercise.id, i + 1]);
      
      console.log(`  ✅ Added exercise: ${exercise.name}`);
    }
    
    // Create Upper Body Session Template  
    const upperBodyTemplateResult = await client.query(`
      INSERT INTO session_templates (
        id,
        workout_plan_id,
        name,
        description,
        session_type,
        duration_minutes,
        difficulty_level,
        target_muscle_groups,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        'Upper Body - Push Focus',
        'Chest, shoulders, and triceps development',
        'workout',
        70,
        'intermediate',
        ARRAY['chest', 'shoulders', 'triceps', 'core'],
        NOW(),
        NOW()
      ) RETURNING id
    `, [planId]);
    
    const upperBodyTemplateId = upperBodyTemplateResult.rows[0].id;
    console.log('✅ Created upper body template:', upperBodyTemplateId);
    
    // Add exercises to the upper body template
    const upperBodyExercises = exercises.slice(4, 8); // Last 4 exercises
    
    for (let i = 0; i < upperBodyExercises.length; i++) {
      const exercise = upperBodyExercises[i];
      await client.query(`
        INSERT INTO template_exercises (
          id,
          template_id,
          exercise_id,
          order_index,
          sets,
          reps_min,
          reps_max,
          rest_seconds,
          notes,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          3,
          8,
          15,
          75,
          'Maintain steady tempo and full range of motion',
          NOW(),
          NOW()
        )
      `, [upperBodyTemplateId, exercise.id, i + 1]);
      
      console.log(`  ✅ Added exercise: ${exercise.name}`);
    }
    
    console.log('📅 Creating weekly schedule...');
    
    // Create weekly schedule for 4 weeks
    for (let week = 1; week <= 4; week++) {
      // Monday - Lower Body
      await client.query(`
        INSERT INTO workout_schedule (
          id,
          workout_plan_id,
          week_number,
          day_of_week,
          session_template_id,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          1,
          $3,
          NOW(),
          NOW()
        )
      `, [planId, week, lowerBodyTemplateId]);
      
      // Wednesday - Upper Body
      await client.query(`
        INSERT INTO workout_schedule (
          id,
          workout_plan_id,
          week_number,
          day_of_week,
          session_template_id,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          3,
          $3,
          NOW(),
          NOW()
        )
      `, [planId, week, upperBodyTemplateId]);
    }
    
    console.log('✅ Created 4-week schedule (8 total sessions)');
    
    // Verify the plan
    console.log('🔍 Verifying created plan...');
    
    const verifyResult = await client.query(`
      SELECT 
        p.name,
        p.duration_weeks,
        p.sessions_per_week,
        COUNT(DISTINCT st.id) as template_count,
        COUNT(DISTINCT te.id) as exercise_count,
        COUNT(DISTINCT ws.id) as scheduled_sessions
      FROM workout_plans p
      LEFT JOIN session_templates st ON p.id = st.workout_plan_id
      LEFT JOIN template_exercises te ON st.id = te.template_id
      LEFT JOIN workout_schedule ws ON p.id = ws.workout_plan_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.duration_weeks, p.sessions_per_week
    `, [planId]);
    
    const plan = verifyResult.rows[0];
    console.log('📊 Plan verification:');
    console.log(`  📋 Name: ${plan.name}`);
    console.log(`  📅 Duration: ${plan.duration_weeks} weeks`);
    console.log(`  📝 Templates: ${plan.template_count}`);
    console.log(`  💪 Exercises: ${plan.exercise_count}`);
    console.log(`  🗓️ Scheduled sessions: ${plan.scheduled_sessions}`);
    
    console.log('🎉 247 Fitness CR workout plan created successfully!');
    console.log('Plan ID:', planId);
    
  } catch (error) {
    console.error('❌ Error creating workout plan:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
create247FitnessPlan().catch((error) => {
  console.error('💥 Creation failed:', error);
  process.exit(1);
});