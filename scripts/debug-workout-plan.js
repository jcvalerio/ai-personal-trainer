#!/usr/bin/env node
/**
 * Debug script for workout plan API issues
 * Checks database state and authentication
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
const WORKOUT_PLAN_ID = '2180ff54-2a72-4788-bf0d-987e003d1e82';
const TEST_USER_EMAIL = 'appttitude@gmail.com';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function debugWorkoutPlan() {
  console.log('🔍 Debugging workout plan API issues...\n');

  try {
    // 1. Check if the specific workout plan exists
    console.log(`1. Checking workout plan ${WORKOUT_PLAN_ID}...`);
    const workoutPlan = await sql`
      SELECT 
        wp.id,
        wp.name,
        wp.status,
        wp.is_active,
        wp.user_id,
        wp.created_at,
        up.clerk_user_id,
        up.email,
        up.display_name
      FROM workout_plans wp
      LEFT JOIN user_profiles up ON wp.user_id = up.id
      WHERE wp.id = ${WORKOUT_PLAN_ID}
    `;

    if (workoutPlan.length === 0) {
      console.log('❌ Workout plan not found in database');
      
      // Check if any similar IDs exist
      console.log('\n   Checking for similar workout plan IDs...');
      const similarPlans = await sql`
        SELECT id, name, status, is_active
        FROM workout_plans
        WHERE id LIKE '%2180%' OR name ILIKE '%strength%'
        LIMIT 5
      `;
      
      if (similarPlans.length > 0) {
        console.log('   Found similar plans:');
        similarPlans.forEach(plan => {
          console.log(`   - ${plan.id}: ${plan.name} (${plan.status}, active: ${plan.is_active})`);
        });
      } else {
        console.log('   No similar plans found');
      }
    } else {
      const plan = workoutPlan[0];
      console.log('✅ Workout plan found:');
      console.log(`   - ID: ${plan.id}`);
      console.log(`   - Name: ${plan.name}`);
      console.log(`   - Status: ${plan.status}`);
      console.log(`   - Active: ${plan.is_active}`);
      console.log(`   - Owner: ${plan.display_name} (${plan.email})`);
      console.log(`   - Clerk User ID: ${plan.clerk_user_id}`);
      console.log(`   - Created: ${plan.created_at}`);
    }

    // 2. Check test user profile
    console.log(`\n2. Checking test user profile...`);
    const testUser = await sql`
      SELECT id, clerk_user_id, email, display_name, organization_id
      FROM user_profiles
      WHERE email = ${TEST_USER_EMAIL}
    `;

    if (testUser.length === 0) {
      console.log('❌ Test user profile not found');
      
      // Show all users to help identify the issue
      console.log('\n   All user profiles:');
      const allUsers = await sql`
        SELECT id, email, display_name, clerk_user_id
        FROM user_profiles
        LIMIT 10
      `;
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.display_name}) - Clerk: ${user.clerk_user_id}`);
      });
    } else {
      const user = testUser[0];
      console.log('✅ Test user found:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.display_name}`);
      console.log(`   - Clerk ID: ${user.clerk_user_id}`);
      // console.log(`   - Role: ${user.role}`); // Role column doesn't exist
      console.log(`   - Organization: ${user.organization_id}`);
      
      // 3. Check user's workout plans
      console.log(`\n3. Checking user's workout plans...`);
      const userPlans = await sql`
        SELECT id, name, status, is_active, created_at
        FROM workout_plans
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;
      
      console.log(`✅ Found ${userPlans.length} workout plans for user`);
      userPlans.forEach(plan => {
        console.log(`   - ${plan.id}: ${plan.name} (${plan.status}, active: ${plan.is_active})`);
      });

      // 4. Test access permission logic
      if (workoutPlan.length > 0 && testUser.length > 0) {
        console.log(`\n4. Testing access permissions...`);
        const plan = workoutPlan[0];
        const userOwnsplan = plan.user_id === user.id;
        const planIsPublic = plan.is_public;
        
        console.log(`   - User owns plan: ${userOwnsplan}`);
        console.log(`   - Plan is public: ${planIsPublic}`);
        console.log(`   - Access should be: ${userOwnsplan || planIsPublic ? 'ALLOWED' : 'DENIED'}`);
      }
    }

    // 5. Check database constraints and indexes
    console.log(`\n5. Checking database structure...`);
    
    // Check workout_plans table structure
    const planStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'workout_plans'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ workout_plans table structure:');
    planStructure.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 6. Test the exact query from the service
    console.log(`\n6. Testing service query pattern...`);
    try {
      const serviceQuery = await sql`
        SELECT wp.*, up.display_name as creator_name
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        WHERE wp.id = ${WORKOUT_PLAN_ID} AND wp.is_active = true
      `;
      
      if (serviceQuery.length === 0) {
        console.log('❌ Service query returned no results');
        
        // Test without JOIN to isolate the issue
        const noJoinQuery = await sql`
          SELECT * FROM workout_plans
          WHERE id = ${WORKOUT_PLAN_ID} AND is_active = true
        `;
        
        if (noJoinQuery.length === 0) {
          console.log('   - Plan not found or inactive');
        } else {
          console.log('   - Plan exists but JOIN failed');
        }
      } else {
        console.log('✅ Service query successful');
        const result = serviceQuery[0];
        console.log(`   - Found: ${result.name} by ${result.creator_name}`);
      }
    } catch (error) {
      console.log('❌ Service query failed:', error.message);
    }

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  }
}

debugWorkoutPlan();