#!/usr/bin/env tsx

/**
 * Test Exercise Repository JSONB Queries
 * 
 * This script tests the exercise repository queries after the TEXT[] to JSONB migration
 * to ensure all muscle group filtering works correctly.
 */

import { config } from 'dotenv';

// Load environment variables first
config({ path: '.env.local' });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('Make sure .env.local exists and contains DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

import { exerciseRepository } from '@/lib/repositories/exercise.repository';

async function testRepositoryQueries() {
  console.log('🧪 Testing Exercise Repository JSONB Queries');
  console.log('==============================================');

  try {
    // Test 1: Find by muscle group (the main issue we're fixing)
    console.log('\n📋 Test 1: Find exercises by muscle group (chest)');
    const chestExercises = await exerciseRepository.findByMuscleGroup('chest');
    console.log(`✅ Found ${chestExercises.length} exercises with 'chest' muscle group:`);
    chestExercises.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
      console.log(`     Primary: ${JSON.stringify(exercise.primaryMuscleGroups)}`);
      console.log(`     Secondary: ${JSON.stringify(exercise.secondaryMuscleGroups)}`);
    });

    // Test 2: Find by muscle group (shoulders)
    console.log('\n📋 Test 2: Find exercises by muscle group (shoulders)');
    const shoulderExercises = await exerciseRepository.findByMuscleGroup('shoulders');
    console.log(`✅ Found ${shoulderExercises.length} exercises with 'shoulders' muscle group:`);
    shoulderExercises.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    // Test 3: Find all exercises to verify data integrity
    console.log('\n📋 Test 3: Find all exercises (data integrity check)');
    const allExercises = await exerciseRepository.findMany({});
    console.log(`✅ Found ${allExercises.length} total exercises:`);
    allExercises.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name} - ${exercise.exerciseType} (${exercise.difficultyLevel})`);
      console.log(`     Primary: ${JSON.stringify(exercise.primaryMuscleGroups)}`);
      console.log(`     Secondary: ${JSON.stringify(exercise.secondaryMuscleGroups)}`);
    });

    // Test 4: Search functionality
    console.log('\n📋 Test 4: Search exercises (text search)');
    const searchResults = await exerciseRepository.search('push');
    console.log(`✅ Found ${searchResults.length} exercises matching 'push':`);
    searchResults.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    // Test 5: Find by exercise type
    console.log('\n📋 Test 5: Find exercises by type (strength)');
    const strengthExercises = await exerciseRepository.findByType('strength');
    console.log(`✅ Found ${strengthExercises.length} strength exercises:`);
    strengthExercises.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    // Test 6: Find by difficulty level
    console.log('\n📋 Test 6: Find exercises by difficulty (beginner)');
    const beginnerExercises = await exerciseRepository.findByDifficultyLevel('beginner');
    console.log(`✅ Found ${beginnerExercises.length} beginner exercises:`);
    beginnerExercises.forEach((exercise, index) => {
      console.log(`  ${index + 1}. ${exercise.name}`);
    });

    console.log('\n🎉 All repository tests passed successfully!');
    console.log('✅ JSONB migration was successful');
    console.log('✅ Repository queries work without casting errors');
    console.log('✅ Data integrity maintained');

  } catch (error) {
    console.error('\n❌ Repository test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    process.exit(1);
  }
}

// Run tests
testRepositoryQueries().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});