#!/usr/bin/env node

/**
 * Check if 247 Fitness CR plan exists and is properly configured
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function check247Plan() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🔍 Searching for 247 Fitness CR plans...');
    const planResult = await client.query(`
      SELECT 
        id,
        name,
        status,
        is_active,
        is_template,
        is_public,
        created_at,
        user_id
      FROM workout_plans 
      WHERE name LIKE '%247%' OR name LIKE '%Sarcopenia%' 
      ORDER BY created_at DESC;
    `);
    
    if (planResult.rows.length === 0) {
      console.log('❌ No 247 Fitness CR plans found');
    } else {
      console.log(`✅ Found ${planResult.rows.length} 247 Fitness CR plan(s):`);
      planResult.rows.forEach((plan, index) => {
        console.log(`\n📋 Plan ${index + 1}:`);
        console.log(`  ID: ${plan.id}`);
        console.log(`  Name: ${plan.name}`);
        console.log(`  Status: ${plan.status}`);
        console.log(`  Active: ${plan.is_active}`);
        console.log(`  Template: ${plan.is_template}`);
        console.log(`  Public: ${plan.is_public}`);
        console.log(`  User ID: ${plan.user_id}`);
        console.log(`  Created: ${plan.created_at}`);
      });
    }
    
    // Check all user plans for comparison
    console.log('\n🔍 Checking all user plans...');
    const userResult = await client.query(`
      SELECT id FROM user_profiles WHERE clerk_user_id = $1
    `, ['user_01J6D1YHT7EW34QYZY5KQHX2PT']);
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const allPlansResult = await client.query(`
        SELECT 
          id,
          name,
          status,
          is_active,
          is_template,
          is_public,
          created_at
        FROM workout_plans 
        WHERE user_id = $1
        ORDER BY created_at DESC;
      `, [userId]);
      
      console.log(`\n📊 Total plans for user: ${allPlansResult.rows.length}`);
      allPlansResult.rows.forEach((plan, index) => {
        console.log(`  ${index + 1}. ${plan.name} (${plan.status}, active: ${plan.is_active}, template: ${plan.is_template})`);
      });
    }
    
    console.log('\n🎉 Database check complete!');
    
  } catch (error) {
    console.error('❌ Error checking plan:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
check247Plan().catch((error) => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});