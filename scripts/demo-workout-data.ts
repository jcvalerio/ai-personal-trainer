/**
 * Demo script to create sample workout data
 * This demonstrates the full workout system in action
 * Run with: npx tsx scripts/demo-workout-data.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function createDemoWorkoutData() {
  try {
    console.log('🏋️  Creating demo workout data...')
    
    const { getDb } = await import('../lib/db/connection')
    const db = getDb()
    
    // First, check if we have a user to work with
    const users = await db`
      SELECT id, display_name, clerk_user_id 
      FROM user_profiles 
      WHERE is_active = true 
      LIMIT 1
    `
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database. Please create a user first.')
      console.log('   You can do this by signing up through the application.')
      return
    }
    
    const user = users[0]
    console.log(`👤 Using user: ${user.display_name} (${user.clerk_user_id})`)
    
    // Get some exercises to work with
    const exercises = await db`
      SELECT id, name, exercise_type 
      FROM exercise_library 
      WHERE is_active = true 
      LIMIT 3
    `
    
    if (exercises.length === 0) {
      console.log('⚠️  No exercises found in database.')
      return
    }
    
    console.log(`📚 Found ${exercises.length} exercises to work with`)
    
    // Create a sample workout plan
    console.log('\n📋 Creating a sample workout plan...')
    const workoutPlan = await db`
      INSERT INTO workout_plans (
        user_id, name, description, duration_weeks, sessions_per_week,
        fitness_goals, target_fitness_level, estimated_session_duration,
        plan_data, weekly_schedule
      ) VALUES (
        ${user.id},
        'Beginner Full Body Routine',
        'A comprehensive beginner-friendly workout plan focusing on building strength and endurance',
        8,
        3,
        ARRAY['strength', 'fitness', 'health'],
        'beginner',
        45,
        '{"phase": "foundation", "focus": "full-body"}',
        '{"monday": {"type": "workout", "exercises": 5}, "wednesday": {"type": "workout", "exercises": 5}, "friday": {"type": "workout", "exercises": 5}}'
      )
      RETURNING id, name
    `
    
    console.log(`  ✅ Created workout plan: ${workoutPlan[0].name}`)
    
    // Create a sample workout session
    console.log('\n🏃 Creating a sample workout session...')
    const workoutSession = await db`
      INSERT INTO workout_sessions (
        user_id, workout_plan_id, name, session_type,
        scheduled_date, scheduled_time, scheduled_duration,
        session_data, status
      ) VALUES (
        ${user.id},
        ${workoutPlan[0].id},
        'Day 1: Full Body Foundation',
        'workout',
        CURRENT_DATE + INTERVAL '1 day',
        '08:00:00',
        45,
        '{"intensity": "moderate", "focus": "technique"}',
        'scheduled'
      )
      RETURNING id, name, scheduled_date
    `
    
    console.log(`  ✅ Created workout session: ${workoutSession[0].name} (scheduled for ${workoutSession[0].scheduled_date})`)
    
    // Add exercises to the session
    console.log('\n💪 Adding exercises to the session...')
    let orderIndex = 0
    
    for (const exercise of exercises) {
      await db`
        INSERT INTO session_exercises (
          session_id, exercise_id, order_index, exercise_phase,
          planned_sets, planned_reps, planned_rest_seconds,
          status
        ) VALUES (
          ${workoutSession[0].id},
          ${exercise.id},
          ${orderIndex},
          'main',
          3,
          ${exercise.exercise_type === 'cardio' ? null : 10},
          ${exercise.exercise_type === 'cardio' ? null : 60},
          'pending'
        )
      `
      console.log(`  ✅ Added ${exercise.name} to session`)
      orderIndex++
    }
    
    // Create a sample progress measurement
    console.log('\n📊 Creating a sample progress measurement...')
    const measurement = await db`
      INSERT INTO progress_measurements (
        user_id, measurement_type, value, unit,
        measured_at, notes
      ) VALUES (
        ${user.id},
        'weight',
        75.5,
        'kg',
        CURRENT_TIMESTAMP,
        'Starting weight measurement'
      )
      RETURNING measurement_type, value, unit, measured_at
    `
    
    console.log(`  ✅ Recorded ${measurement[0].measurement_type}: ${measurement[0].value} ${measurement[0].unit}`)
    
    // Create a sample achievement
    console.log('\n🏆 Creating a sample achievement...')
    const achievement = await db`
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, description,
        achieved_at, badge_icon, points_awarded
      ) VALUES (
        ${user.id},
        'milestone',
        'First Workout Planned',
        'Congratulations on creating your first workout plan!',
        CURRENT_TIMESTAMP,
        '🎯',
        50
      )
      RETURNING achievement_name, points_awarded
    `
    
    console.log(`  ✅ Earned achievement: ${achievement[0].achievement_name} (+${achievement[0].points_awarded} points)`)
    
    // Display summary
    console.log('\n📋 Demo data summary:')
    console.log('  ✓ 1 workout plan created')
    console.log('  ✓ 1 workout session scheduled')
    console.log(`  ✓ ${exercises.length} exercises added to session`)
    console.log('  ✓ 1 progress measurement recorded')
    console.log('  ✓ 1 achievement earned')
    
    // Show the complete workout plan structure
    console.log('\n🔍 Workout plan structure:')
    const planDetails = await db`
      SELECT 
        wp.name as plan_name,
        wp.duration_weeks,
        wp.sessions_per_week,
        ws.name as session_name,
        ws.scheduled_date,
        COUNT(se.id) as exercise_count
      FROM workout_plans wp
      LEFT JOIN workout_sessions ws ON wp.id = ws.workout_plan_id
      LEFT JOIN session_exercises se ON ws.id = se.session_id
      WHERE wp.id = ${workoutPlan[0].id}
      GROUP BY wp.id, wp.name, wp.duration_weeks, wp.sessions_per_week, ws.name, ws.scheduled_date
    `
    
    planDetails.forEach(detail => {
      console.log(`  📋 ${detail.plan_name} (${detail.duration_weeks} weeks, ${detail.sessions_per_week}x/week)`)
      if (detail.session_name) {
        console.log(`    └── ${detail.session_name} (${detail.scheduled_date}) - ${detail.exercise_count} exercises`)
      }
    })
    
    console.log('\n✅ Demo workout data created successfully!')
    console.log('🎉 The workout database system is ready to use!')
    
  } catch (error) {
    console.error('❌ Failed to create demo workout data:', error)
    process.exit(1)
  }
}

createDemoWorkoutData()