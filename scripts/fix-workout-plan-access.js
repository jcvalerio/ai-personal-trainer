#!/usr/bin/env node
/**
 * Fix workout plan access by making it public or transferring ownership
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

async function fixWorkoutPlanAccess() {
  console.log('🔧 Fixing workout plan access...\n');

  try {
    // Get test user ID
    console.log('1. Getting test user information...');
    const testUser = await sql`
      SELECT id, clerk_user_id, email, display_name
      FROM user_profiles
      WHERE email = ${TEST_USER_EMAIL}
    `;

    if (testUser.length === 0) {
      console.log('❌ Test user not found');
      return;
    }

    const user = testUser[0];
    console.log(`✅ Test user found: ${user.display_name} (${user.email})`);
    console.log(`   Clerk ID: ${user.clerk_user_id}`);
    console.log(`   User ID: ${user.id}`);

    // Option 1: Transfer ownership to test user
    console.log(`\n2. Transferring workout plan ownership...`);
    const transferResult = await sql`
      UPDATE workout_plans
      SET 
        user_id = ${user.id},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${WORKOUT_PLAN_ID}
      RETURNING id, name, user_id, is_public
    `;

    if (transferResult.length === 0) {
      console.log('❌ Failed to transfer ownership');
    } else {
      console.log('✅ Ownership transferred successfully');
      console.log(`   Plan: ${transferResult[0].name}`);
      console.log(`   New owner: ${transferResult[0].user_id}`);
    }

    // Also make it public for good measure
    console.log(`\n3. Making workout plan public...`);
    const publicResult = await sql`
      UPDATE workout_plans
      SET 
        is_public = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${WORKOUT_PLAN_ID}
      RETURNING id, name, is_public
    `;

    if (publicResult.length === 0) {
      console.log('❌ Failed to make plan public');
    } else {
      console.log('✅ Plan made public successfully');
      console.log(`   Plan: ${publicResult[0].name}`);
      console.log(`   Public: ${publicResult[0].is_public}`);
    }

    // Verify the fix
    console.log(`\n4. Verifying the fix...`);
    const verifyResult = await sql`
      SELECT 
        wp.id,
        wp.name,
        wp.status,
        wp.is_active,
        wp.is_public,
        wp.user_id,
        up.email,
        up.clerk_user_id
      FROM workout_plans wp
      LEFT JOIN user_profiles up ON wp.user_id = up.id
      WHERE wp.id = ${WORKOUT_PLAN_ID}
    `;

    if (verifyResult.length === 0) {
      console.log('❌ Verification failed - plan not found');
    } else {
      const plan = verifyResult[0];
      console.log('✅ Verification successful:');
      console.log(`   - Plan: ${plan.name}`);
      console.log(`   - Status: ${plan.status}`);
      console.log(`   - Active: ${plan.is_active}`);
      console.log(`   - Public: ${plan.is_public}`);
      console.log(`   - Owner: ${plan.email} (${plan.clerk_user_id})`);
      
      // Check if test user can now access it
      const testUserOwns = plan.user_id === user.id;
      const planIsPublic = plan.is_public === true;
      const hasAccess = testUserOwns || planIsPublic;
      
      console.log(`   - Test user owns plan: ${testUserOwns}`);
      console.log(`   - Plan is public: ${planIsPublic}`);
      console.log(`   - Access granted: ${hasAccess ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n✅ Workout plan access fix completed!');

  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  }
}

fixWorkoutPlanAccess();