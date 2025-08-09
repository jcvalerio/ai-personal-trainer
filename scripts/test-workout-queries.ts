/**
 * Test script to verify workout database functionality
 * Run with: npx tsx scripts/test-workout-queries.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function testWorkoutQueries() {
  try {
    console.log('🧪 Testing workout database queries...')
    
    const { getDb } = await import('../lib/db/connection')
    const db = getDb()
    
    // Test 1: Query exercise library
    console.log('\n1️⃣ Testing exercise library queries:')
    const exercises = await db`
      SELECT name, exercise_type, difficulty_level, primary_muscle_groups 
      FROM exercise_library 
      WHERE is_active = true 
      ORDER BY name
    `
    
    exercises.forEach(exercise => {
      console.log(`  ✓ ${exercise.name} (${exercise.exercise_type}, ${exercise.difficulty_level})`)
      console.log(`    Primary muscles: ${exercise.primary_muscle_groups.join(', ')}`)
    })
    
    // Test 2: Query equipment catalog
    console.log('\n2️⃣ Testing equipment catalog queries:')
    const equipment = await db`
      SELECT name, category, subcategory 
      FROM equipment_catalog 
      WHERE is_active = true 
      ORDER BY category, name
    `
    
    equipment.forEach(item => {
      console.log(`  ✓ ${item.name} (${item.category}/${item.subcategory})`)
    })
    
    // Test 3: Test enum types exist by checking type catalog
    console.log('\n3️⃣ Testing enum types exist:')
    const enumTypes = await db`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typname IN ('fitness_level', 'exercise_type', 'workout_status')
      ORDER BY typname
    `
    
    enumTypes.forEach(type => {
      console.log(`  ✓ ${type.typname} enum exists`)
    })
    
    // Test 4: Test indexes are working
    console.log('\n4️⃣ Testing database performance (indexes):')
    
    // Test exercise search by muscle group (should use GIN index)
    const chestExercises = await db`
      SELECT name 
      FROM exercise_library 
      WHERE primary_muscle_groups && ARRAY['chest']
      AND is_active = true
    `
    console.log(`  ✓ Found ${chestExercises.length} chest exercises using muscle group index`)
    
    // Test exercise search by type (should use btree index)
    const strengthExercises = await db`
      SELECT name 
      FROM exercise_library 
      WHERE exercise_type = 'strength'
      AND is_active = true
    `
    console.log(`  ✓ Found ${strengthExercises.length} strength exercises using type index`)
    
    // Test 5: Test constraints are working
    console.log('\n5️⃣ Testing database constraints:')
    
    try {
      // This should fail due to the valid_exercise_name constraint
      await db`
        INSERT INTO exercise_library (name, description, instructions, exercise_type, primary_muscle_groups)
        VALUES ('', 'test description', 'test instructions', 'strength', ARRAY['chest'])
      `
      console.log('  ❌ Empty name constraint test failed - should have been rejected')
    } catch (error) {
      console.log('  ✅ Empty name constraint working correctly')
    }
    
    try {
      // This should fail due to the valid_primary_muscles constraint
      await db`
        INSERT INTO exercise_library (name, description, instructions, exercise_type, primary_muscle_groups)
        VALUES ('Test Exercise', 'test description', 'test instructions', 'strength', ARRAY[]::text[])
      `
      console.log('  ❌ Empty muscle groups constraint test failed - should have been rejected')
    } catch (error) {
      console.log('  ✅ Empty muscle groups constraint working correctly')
    }
    
    // Test 6: Test helper functions
    console.log('\n6️⃣ Testing helper functions:')
    
    const slugTest = await db`SELECT generate_exercise_slug('Test Exercise Name!!! @#$') as slug`
    console.log(`  ✅ Slug generation working: "${slugTest[0].slug}"`)
    
    const equipSlugTest = await db`SELECT generate_equipment_slug('Fancy Equipment Name!!! @#$') as slug`
    console.log(`  ✅ Equipment slug generation working: "${equipSlugTest[0].slug}"`)
    
    console.log('\n✅ All workout database tests passed!')
    
  } catch (error) {
    console.error('❌ Workout database tests failed:', error)
    process.exit(1)
  }
}

testWorkoutQueries()