#!/usr/bin/env node
/**
 * Simple script to check what exercises are in the database
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yH5e7CnVzcsu@ep-patient-king-ae8pv53n-pooler.c-2.us-east-2.aws.neon.tech/ai_trainer_db?sslmode=require&channel_binding=require';

async function checkExercises() {
  console.log('🔍 Checking exercises in database...');
  
  try {
    const sql = neon(DATABASE_URL);
    
    // Check all exercises
    const allExercises = await sql`SELECT id, name, slug, is_verified, is_public, is_active FROM exercise_library`;
    console.log(`📊 Total exercises: ${allExercises.length}`);
    
    if (allExercises.length > 0) {
      console.log('\n📋 All exercises:');
      allExercises.forEach(ex => {
        console.log(`  - ${ex.name} (${ex.slug}): verified=${ex.is_verified}, public=${ex.is_public}, active=${ex.is_active}`);
      });
      
      // Check filtered exercises (what the API is looking for)
      const filteredExercises = await sql`
        SELECT id, name, slug, is_verified, is_public, is_active 
        FROM exercise_library 
        WHERE is_verified = true AND is_public = true AND is_active = true
      `;
      console.log(`\n🎯 Filtered exercises (verified=true, public=true, active=true): ${filteredExercises.length}`);
      
      if (filteredExercises.length === 0) {
        console.log('\n❗ No exercises match the API filter criteria!');
        console.log('   The API is looking for exercises where:');
        console.log('   - is_verified = true');
        console.log('   - is_public = true'); 
        console.log('   - is_active = true');
      }
    } else {
      console.log('❌ No exercises found in database');
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkExercises();
}