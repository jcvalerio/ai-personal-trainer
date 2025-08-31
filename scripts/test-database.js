#!/usr/bin/env node

/**
 * Database Connection and Schema Test Script
 * Tests NeonDB connection and verifies required tables exist
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing NeonDB PostgreSQL connection...\n');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found in .env.local');
    process.exit(1);
  }

  console.log('📡 Connecting to database...');
  const sql = neon(DATABASE_URL);

  try {
    // Test basic connection
    const healthCheck = await sql`SELECT 1 as health_check, current_timestamp as connected_at`;
    console.log('✅ Database connection successful');
    console.log(`⏰ Connected at: ${healthCheck[0].connected_at}\n`);

    // Check required tables exist
    const requiredTables = [
      'user_profiles',
      'organizations', 
      'exercises',
      'workout_plans',
      'workout_sessions',
      'session_exercises'
    ];

    console.log('🔍 Checking required tables...');
    const tableCheck = await sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY(${requiredTables})
      ORDER BY tablename
    `;

    const existingTables = tableCheck.map(row => row.tablename);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    console.log(`✅ Found ${existingTables.length}/${requiredTables.length} required tables:`);
    existingTables.forEach(table => console.log(`   ✓ ${table}`));

    if (missingTables.length > 0) {
      console.log(`\n❌ Missing ${missingTables.length} critical tables:`);
      missingTables.forEach(table => console.log(`   ✗ ${table}`));
      console.log('\n🔧 TO FIX: Run the database initialization script:');
      console.log('   psql $DATABASE_URL -f scripts/init-database.sql');
      process.exit(1);
    }

    // Test user profile function exists
    console.log('\n🔍 Checking helper functions...');
    const functionCheck = await sql`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'create_user_profile_if_not_exists'
    `;

    if (functionCheck.length === 0) {
      console.log('❌ User profile creation function missing');
      console.log('🔧 TO FIX: Run the database initialization script');
      process.exit(1);
    } else {
      console.log('✅ User profile creation function exists');
    }

    // Test sample data
    console.log('\n🔍 Checking sample data...');
    const exerciseCount = await sql`SELECT COUNT(*) as count FROM exercises`;
    console.log(`✅ Found ${exerciseCount[0].count} exercises in database`);

    console.log('\n🎉 Database is properly initialized and ready for use!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n🔧 SOLUTION: The database schema needs to be initialized.');
      console.log('   Run: psql $DATABASE_URL -f scripts/init-database.sql');
    } else if (error.message.includes('connection')) {
      console.log('\n🔧 SOLUTION: Check your DATABASE_URL in .env.local');
      console.log('   Make sure NeonDB instance is running and accessible');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();