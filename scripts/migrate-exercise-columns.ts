#!/usr/bin/env tsx

/**
 * Migration Script: Convert TEXT[] columns to JSONB in exercise_library
 * 
 * This script addresses the issue where the repository code expects JSONB format
 * but the database columns are defined as TEXT[]. The error "cannot cast type 
 * text[] to jsonb" occurs during muscle group filtering.
 * 
 * Usage:
 *   npx tsx scripts/migrate-exercise-columns.ts
 *   
 * Environment:
 *   Requires DATABASE_URL in .env.local
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

interface MigrationResult {
  success: boolean;
  message: string;
  recordsAffected?: number;
  error?: string;
}

class ExerciseColumnMigrator {
  private sql: ReturnType<typeof neon>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    console.log('🔗 Connecting to NeonDB...');
    this.sql = neon(databaseUrl);
  }

  /**
   * Execute the migration step by step
   */
  async runMigration(): Promise<MigrationResult> {
    try {
      console.log('📋 Starting TEXT[] to JSONB migration for exercise_library...');
      
      // Step 1: Create backup table
      console.log('⚡ Step 1: Creating backup table...');
      await this.sql`
        CREATE TABLE IF NOT EXISTS exercise_library_backup AS 
        SELECT * FROM exercise_library
      `;
      
      // Step 2: Count records
      const recordCount = await this.sql`SELECT COUNT(*) as count FROM exercise_library`;
      const totalRecords = recordCount[0]?.count || 0;
      console.log(`📊 Total records to migrate: ${totalRecords}`);
      
      // Step 3: Add temporary JSONB columns
      console.log('⚡ Step 3: Adding temporary JSONB columns...');
      await this.sql`
        ALTER TABLE exercise_library 
        ADD COLUMN IF NOT EXISTS primary_muscle_groups_jsonb JSONB,
        ADD COLUMN IF NOT EXISTS secondary_muscle_groups_jsonb JSONB
      `;
      
      // Step 4: Convert data from TEXT[] to JSONB
      console.log('⚡ Step 4: Converting primary_muscle_groups...');
      await this.sql`
        UPDATE exercise_library 
        SET primary_muscle_groups_jsonb = to_jsonb(primary_muscle_groups)
        WHERE primary_muscle_groups IS NOT NULL
      `;
      
      console.log('⚡ Step 4b: Converting secondary_muscle_groups...');
      await this.sql`
        UPDATE exercise_library 
        SET secondary_muscle_groups_jsonb = to_jsonb(secondary_muscle_groups)
        WHERE secondary_muscle_groups IS NOT NULL
      `;
      
      // Set empty arrays for NULL values
      console.log('⚡ Step 4c: Setting default values...');
      await this.sql`
        UPDATE exercise_library 
        SET primary_muscle_groups_jsonb = '[]'::jsonb
        WHERE primary_muscle_groups IS NULL
      `;
      
      await this.sql`
        UPDATE exercise_library 
        SET secondary_muscle_groups_jsonb = '[]'::jsonb
        WHERE secondary_muscle_groups IS NULL
      `;
      
      // Step 5: Verify conversion
      const converted = await this.sql`
        SELECT 
          COUNT(*) as total,
          COUNT(primary_muscle_groups_jsonb) as primary_converted,
          COUNT(secondary_muscle_groups_jsonb) as secondary_converted
        FROM exercise_library
      `;
      
      const conversionStats = converted[0];
      console.log(`✅ Conversion stats: ${conversionStats.total} total, ${conversionStats.primary_converted} primary, ${conversionStats.secondary_converted} secondary`);
      
      // Step 6: Test JSONB query
      console.log('⚡ Step 6: Testing JSONB queries...');
      const testResult = await this.sql`
        SELECT COUNT(*) as count
        FROM exercise_library 
        WHERE primary_muscle_groups_jsonb ? 'chest'
      `;
      
      console.log(`🧪 Test query result: ${testResult[0]?.count || 0} exercises with 'chest'`);
      
      // Step 7: Drop old columns and rename new ones
      console.log('⚡ Step 7: Replacing columns...');
      await this.sql`ALTER TABLE exercise_library DROP COLUMN primary_muscle_groups`;
      await this.sql`ALTER TABLE exercise_library DROP COLUMN secondary_muscle_groups`;
      await this.sql`ALTER TABLE exercise_library RENAME COLUMN primary_muscle_groups_jsonb TO primary_muscle_groups`;
      await this.sql`ALTER TABLE exercise_library RENAME COLUMN secondary_muscle_groups_jsonb TO secondary_muscle_groups`;
      
      // Step 8: Add indexes
      console.log('⚡ Step 8: Adding optimized indexes...');
      await this.sql`DROP INDEX IF EXISTS idx_exercise_library_muscles`;
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_exercise_library_primary_muscle_groups_gin 
        ON exercise_library USING GIN (primary_muscle_groups)
      `;
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_exercise_library_secondary_muscle_groups_gin 
        ON exercise_library USING GIN (secondary_muscle_groups)
      `;
      
      console.log('✅ Migration completed successfully');
      return {
        success: true,
        message: 'Migration completed successfully',
        recordsAffected: totalRecords
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate the migration by testing JSONB queries
   */
  async validateMigration(): Promise<MigrationResult> {
    try {
      console.log('🧪 Validating migration results...');
      
      // Test 1: Check column types
      const columnInfo = await this.sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'exercise_library' 
        AND column_name IN ('primary_muscle_groups', 'secondary_muscle_groups')
        ORDER BY column_name
      `;
      
      console.log('📊 Column information after migration:');
      columnInfo.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Test 2: Count total records
      const totalRecords = await this.sql`SELECT COUNT(*) as count FROM exercise_library`;
      const count = totalRecords[0]?.count || 0;
      console.log(`📈 Total records in exercise_library: ${count}`);
      
      // Test 3: Test the exact repository query pattern
      const testMuscle = 'chest';
      const muscleGroupTest = await this.sql`
        SELECT COUNT(*) as count
        FROM exercise_library 
        WHERE (primary_muscle_groups::jsonb ? ${testMuscle} OR secondary_muscle_groups::jsonb ? ${testMuscle})
      `;
      
      const chestExercises = muscleGroupTest[0]?.count || 0;
      console.log(`🎯 Exercises with 'chest' muscle group: ${chestExercises}`);
      
      // Test 4: Sample data verification
      const sampleData = await this.sql`
        SELECT name, primary_muscle_groups, secondary_muscle_groups
        FROM exercise_library 
        WHERE primary_muscle_groups IS NOT NULL
        LIMIT 3
      `;
      
      console.log('📝 Sample converted data:');
      sampleData.forEach((exercise: any, index: number) => {
        console.log(`  ${index + 1}. ${exercise.name}:`);
        console.log(`     Primary: ${JSON.stringify(exercise.primary_muscle_groups)}`);
        console.log(`     Secondary: ${JSON.stringify(exercise.secondary_muscle_groups)}`);
      });
      
      // Test 5: Verify JSONB operators work
      const operatorTest = await this.sql`
        SELECT 
          COUNT(CASE WHEN primary_muscle_groups ? 'chest' THEN 1 END) as chest_primary,
          COUNT(CASE WHEN secondary_muscle_groups ? 'chest' THEN 1 END) as chest_secondary,
          COUNT(CASE WHEN primary_muscle_groups ? 'shoulders' THEN 1 END) as shoulders_primary
        FROM exercise_library
      `;
      
      const operatorResults = operatorTest[0];
      console.log('🔍 JSONB operator test results:');
      console.log(`  - Chest (primary): ${operatorResults?.chest_primary || 0}`);
      console.log(`  - Chest (secondary): ${operatorResults?.chest_secondary || 0}`);
      console.log(`  - Shoulders (primary): ${operatorResults?.shoulders_primary || 0}`);
      
      if (count === 0) {
        return {
          success: false,
          message: 'No records found in exercise_library table'
        };
      }
      
      console.log('✅ Migration validation passed');
      return {
        success: true,
        message: 'Migration validation passed',
        recordsAffected: count
      };
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return {
        success: false,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationStatus(): Promise<{ needsMigration: boolean; reason: string }> {
    try {
      console.log('🔍 Checking current database schema...');
      
      // Check current column data types
      const columnTypes = await this.sql`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'exercise_library' 
        AND column_name IN ('primary_muscle_groups', 'secondary_muscle_groups')
      `;
      
      const primaryType = columnTypes.find((col: any) => col.column_name === 'primary_muscle_groups')?.data_type;
      const secondaryType = columnTypes.find((col: any) => col.column_name === 'secondary_muscle_groups')?.data_type;
      
      console.log(`📋 Current column types:`);
      console.log(`  - primary_muscle_groups: ${primaryType}`);
      console.log(`  - secondary_muscle_groups: ${secondaryType}`);
      
      if (primaryType === 'ARRAY' || primaryType === 'text[]') {
        return {
          needsMigration: true,
          reason: `Columns are ${primaryType}, need to convert to JSONB`
        };
      }
      
      if (primaryType === 'jsonb') {
        return {
          needsMigration: false,
          reason: 'Columns are already JSONB format'
        };
      }
      
      return {
        needsMigration: true,
        reason: `Unknown column type: ${primaryType}`
      };
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
      return {
        needsMigration: true,
        reason: 'Could not determine current schema state'
      };
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Exercise Library Column Migration Tool');
  console.log('==========================================');
  
  try {
    const migrator = new ExerciseColumnMigrator();
    
    // Step 1: Check if migration is needed
    const status = await migrator.checkMigrationStatus();
    console.log(`📊 Migration status: ${status.reason}`);
    
    if (!status.needsMigration) {
      console.log('✅ No migration needed - columns are already in JSONB format');
      
      // Still run validation to verify everything works
      const validation = await migrator.validateMigration();
      if (!validation.success) {
        console.error('❌ Validation failed even though migration not needed');
        process.exit(1);
      }
      
      console.log('🎉 Database is ready for repository queries');
      return;
    }
    
    // Step 2: Run the migration
    const migrationResult = await migrator.runMigration();
    if (!migrationResult.success) {
      console.error('❌ Migration failed:', migrationResult.error);
      process.exit(1);
    }
    
    // Step 3: Validate the results
    const validationResult = await migrator.validateMigration();
    if (!validationResult.success) {
      console.error('❌ Migration validation failed:', validationResult.error);
      console.error('⚠️  Database may be in an inconsistent state');
      process.exit(1);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📝 Summary:');
    console.log('  - Created backup table: exercise_library_backup');
    console.log('  - Converted primary_muscle_groups: TEXT[] → JSONB');
    console.log('  - Converted secondary_muscle_groups: TEXT[] → JSONB');
    console.log('  - Added GIN indexes for optimal query performance');
    console.log('  - Repository queries should now work without casting errors');
    console.log('');
    console.log('⚠️  Remember to drop the backup table after verifying everything works:');
    console.log('   DROP TABLE exercise_library_backup;');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ExerciseColumnMigrator, type MigrationResult };