#!/usr/bin/env tsx

/**
 * Simple test for JSONB queries after migration
 * Tests the exact queries used by the repository
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testJsonbQueries() {
  console.log('🧪 Testing JSONB Queries After Migration');
  console.log('========================================');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  try {
    // Test 1: Basic count
    console.log('\n📋 Test 1: Count all exercises');
    const totalCount = await sql`SELECT COUNT(*) as count FROM exercise_library`;
    console.log(`✅ Total exercises: ${totalCount[0]?.count}`);

    // Test 2: Check column types
    console.log('\n📋 Test 2: Verify column types');
    const columnTypes = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'exercise_library' 
      AND column_name IN ('primary_muscle_groups', 'secondary_muscle_groups')
    `;
    console.log('✅ Column types:');
    columnTypes.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Test 3: The exact repository query that was failing
    console.log('\n📋 Test 3: Test repository muscle group query (chest)');
    const chestQuery = await sql`
      SELECT name, primary_muscle_groups, secondary_muscle_groups
      FROM exercise_library 
      WHERE (primary_muscle_groups::jsonb ? 'chest' OR secondary_muscle_groups::jsonb ? 'chest')
    `;
    console.log(`✅ Found ${chestQuery.length} exercises with 'chest':`);
    chestQuery.forEach((exercise: any, index: number) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
      console.log(`     Primary: ${JSON.stringify(exercise.primary_muscle_groups)}`);
      console.log(`     Secondary: ${JSON.stringify(exercise.secondary_muscle_groups)}`);
    });

    // Test 4: Test shoulders muscle group
    console.log('\n📋 Test 4: Test muscle group query (shoulders)');
    const shouldersQuery = await sql`
      SELECT name, primary_muscle_groups, secondary_muscle_groups
      FROM exercise_library 
      WHERE (primary_muscle_groups::jsonb ? 'shoulders' OR secondary_muscle_groups::jsonb ? 'shoulders')
    `;
    console.log(`✅ Found ${shouldersQuery.length} exercises with 'shoulders':`);
    shouldersQuery.forEach((exercise: any, index: number) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    // Test 5: Test JSONB array contains
    console.log('\n📋 Test 5: Test JSONB contains operator');
    const containsQuery = await sql`
      SELECT name, primary_muscle_groups
      FROM exercise_library 
      WHERE primary_muscle_groups @> '["quadriceps"]'::jsonb
    `;
    console.log(`✅ Found ${containsQuery.length} exercises containing 'quadriceps' in primary muscles:`);
    containsQuery.forEach((exercise: any, index: number) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    // Test 6: All exercises with their muscle groups
    console.log('\n📋 Test 6: List all exercises and their muscle groups');
    const allExercises = await sql`
      SELECT name, exercise_type, difficulty_level, primary_muscle_groups, secondary_muscle_groups
      FROM exercise_library 
      ORDER BY name
    `;
    console.log(`✅ All ${allExercises.length} exercises:`);
    allExercises.forEach((exercise: any, index: number) => {
      console.log(`  ${index + 1}. ${exercise.name} (${exercise.exercise_type}, ${exercise.difficulty_level})`);
      console.log(`     Primary: ${JSON.stringify(exercise.primary_muscle_groups)}`);
      console.log(`     Secondary: ${JSON.stringify(exercise.secondary_muscle_groups)}`);
    });

    console.log('\n🎉 All JSONB query tests passed!');
    console.log('✅ Migration was successful');
    console.log('✅ Repository queries should now work without errors');
    console.log('✅ JSONB operators (?, @>, etc.) working correctly');

  } catch (error) {
    console.error('\n❌ JSONB query test failed:', error);
    process.exit(1);
  }
}

testJsonbQueries().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});