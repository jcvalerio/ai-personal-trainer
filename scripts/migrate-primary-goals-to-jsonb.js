/**
 * Migration script to alter primary_goals column from TEXT[] to JSONB
 */

const { Pool } = require('pg');

async function migratePrimaryGoalsColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Starting migration of primary_goals column...');
    
    // First, let's check the current column type
    const checkColumnQuery = `
      SELECT data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'primary_goals'
    `;
    
    const columnInfo = await pool.query(checkColumnQuery);
    console.log('📊 Current column info:', columnInfo.rows[0]);
    
    // Step 1: Drop the default value first
    console.log('🔧 Dropping default value...');
    const dropDefaultQuery = `ALTER TABLE user_profiles ALTER COLUMN primary_goals DROP DEFAULT;`;
    await pool.query(dropDefaultQuery);
    console.log('✅ Default value dropped');
    
    // Step 2: Alter the column type
    console.log('🔧 Altering column type from TEXT[] to JSONB...');
    const alterQuery = `
      ALTER TABLE user_profiles 
      ALTER COLUMN primary_goals TYPE JSONB 
      USING CASE 
        WHEN primary_goals::TEXT = '{}' THEN '[]'::JSONB
        ELSE array_to_json(primary_goals)::JSONB
      END;
    `;
    
    await pool.query(alterQuery);
    console.log('✅ Column altered successfully');
    
    // Set default value for JSONB
    const setDefaultQuery = `
      ALTER TABLE user_profiles 
      ALTER COLUMN primary_goals SET DEFAULT '[]'::JSONB;
    `;
    
    await pool.query(setDefaultQuery);
    console.log('✅ Default value set to []');
    
    // Verify the change
    const verifyQuery = `
      SELECT data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'primary_goals'
    `;
    
    const verifiedInfo = await pool.query(verifyQuery);
    console.log('✅ Verified column info:', verifiedInfo.rows[0]);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migratePrimaryGoalsColumn()
  .then(() => {
    console.log('Migration process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });