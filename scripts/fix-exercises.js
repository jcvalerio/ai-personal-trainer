#!/usr/bin/env node
/**
 * Fix exercises to set is_verified=true so they show up in API
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yH5e7CnVzcsu@ep-patient-king-ae8pv53n-pooler.c-2.us-east-2.aws.neon.tech/ai_trainer_db?sslmode=require&channel_binding=require';

async function fixExercises() {
  console.log('🔧 Fixing exercises to be verified...');
  
  try {
    const sql = neon(DATABASE_URL);
    
    // Update all exercises to be verified
    const updateResult = await sql`
      UPDATE exercise_library 
      SET is_verified = true 
      WHERE is_verified = false AND is_public = true AND is_active = true
    `;
    
    console.log(`✅ Updated exercises to be verified`);
    
    // Verify the fix
    const verifiedExercises = await sql`
      SELECT name, is_verified, is_public, is_active 
      FROM exercise_library 
      WHERE is_verified = true AND is_public = true AND is_active = true
    `;
    
    console.log(`🎯 Now ${verifiedExercises.length} exercises match API filter criteria:`);
    verifiedExercises.forEach(ex => {
      console.log(`  ✅ ${ex.name}`);
    });
    
  } catch (error) {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixExercises();
}