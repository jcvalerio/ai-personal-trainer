#!/usr/bin/env tsx
/**
 * Database Migration Script - Migrate to Optimized Schema
 * Safely migrates from existing schema to optimized schema with performance improvements
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { optimizedDb } from '../lib/db/optimized-connection';
import { db } from '../lib/db/connection';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface MigrationStep {
  name: string;
  description: string;
  sql: string;
  rollback?: string;
  validate?: string;
}

class DatabaseMigration {
  private migrationSteps: MigrationStep[] = [
    {
      name: 'create_migration_tracking',
      description: 'Create migration tracking table',
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64)
        );
      `,
      validate: `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'schema_migrations'`
    },
    {
      name: 'add_performance_indexes',
      description: 'Add performance-optimized indexes',
      sql: `
        -- User profile covering index for auth lookups
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_clerk_id_covering 
        ON user_profiles(clerk_user_id, id, organization_id);
        
        -- Session queries optimization
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_user_date_status 
        ON workout_sessions(user_id, scheduled_date DESC, status) WHERE is_active = true;
        
        -- Session ID lookups
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_id_active 
        ON workout_sessions(id) WHERE is_active = true;
        
        -- Session exercises N+1 prevention
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_exercises_session_order 
        ON session_exercises(session_id, order_index, exercise_phase);
        
        -- Session exercises by status
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_exercises_status_completed 
        ON session_exercises(session_id, status, completed_at);
      `,
      rollback: `
        DROP INDEX CONCURRENTLY IF EXISTS idx_user_profiles_clerk_id_covering;
        DROP INDEX CONCURRENTLY IF EXISTS idx_workout_sessions_user_date_status;
        DROP INDEX CONCURRENTLY IF EXISTS idx_workout_sessions_id_active;
        DROP INDEX CONCURRENTLY IF EXISTS idx_session_exercises_session_order;
        DROP INDEX CONCURRENTLY IF EXISTS idx_session_exercises_status_completed;
      `,
      validate: `
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE indexname IN (
          'idx_user_profiles_clerk_id_covering',
          'idx_workout_sessions_user_date_status',
          'idx_workout_sessions_id_active',
          'idx_session_exercises_session_order',
          'idx_session_exercises_status_completed'
        )
      `
    },
    {
      name: 'optimize_jsonb_indexes',
      description: 'Add JSONB optimization indexes',
      sql: `
        -- GIN indexes for JSONB columns
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_session_data_gin 
        ON workout_sessions USING GIN (session_data);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_exercises_set_data_gin 
        ON session_exercises USING GIN (set_data);
        
        -- Specific JSONB path indexes for common queries
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_progress_percentage 
        ON workout_sessions ((session_data->'progress'->>'completionPercentage'));
      `,
      rollback: `
        DROP INDEX CONCURRENTLY IF EXISTS idx_workout_sessions_session_data_gin;
        DROP INDEX CONCURRENTLY IF EXISTS idx_session_exercises_set_data_gin;
        DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_progress_percentage;
      `,
      validate: `
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE indexname LIKE '%_gin' OR indexname LIKE '%_progress_%'
      `
    },
    {
      name: 'add_partial_indexes',
      description: 'Add partial indexes for filtered queries',
      sql: `
        -- Partial indexes for active sessions
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_in_progress 
        ON workout_sessions(user_id, started_at) WHERE status = 'in_progress';
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_completed 
        ON workout_sessions(user_id, completed_at DESC) WHERE status = 'completed';
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_exercises_pending 
        ON session_exercises(session_id, order_index) WHERE status = 'pending';
        
        -- Active exercises index
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercise_library_active 
        ON exercise_library(exercise_type, difficulty_level) WHERE is_active = true;
      `,
      rollback: `
        DROP INDEX CONCURRENTLY IF EXISTS idx_workout_sessions_in_progress;
        DROP INDEX CONCURRENTLY IF EXISTS idx_workout_sessions_completed;
        DROP INDEX CONCURRENTLY IF EXISTS idx_session_exercises_pending;
        DROP INDEX CONCURRENTLY IF EXISTS idx_exercise_library_active;
      `,
      validate: `
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE indexdef LIKE '%WHERE%' AND schemaname = 'public'
      `
    },
    {
      name: 'create_materialized_views',
      description: 'Create materialized views for aggregations',
      sql: `
        -- Session statistics materialized view
        CREATE MATERIALIZED VIEW IF NOT EXISTS session_statistics AS
        SELECT 
          user_id,
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration,
          AVG(CASE WHEN effort_rating IS NOT NULL THEN effort_rating END) as avg_effort,
          MAX(completed_at) as last_workout_date,
          date_trunc('month', CURRENT_DATE) as month_calculated
        FROM workout_sessions 
        WHERE is_active = true 
        GROUP BY user_id, date_trunc('month', CURRENT_DATE);
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_session_stats_user_month 
        ON session_statistics(user_id, month_calculated);
        
        -- Function to refresh materialized view
        CREATE OR REPLACE FUNCTION refresh_session_statistics()
        RETURNS void AS $$
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY session_statistics;
        END;
        $$ LANGUAGE plpgsql;
      `,
      rollback: `
        DROP FUNCTION IF EXISTS refresh_session_statistics();
        DROP MATERIALIZED VIEW IF EXISTS session_statistics;
      `,
      validate: `
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'session_statistics' AND table_type = 'MATERIALIZED VIEW'
      `
    },
    {
      name: 'optimize_constraints',
      description: 'Optimize constraints and add missing ones',
      sql: `
        -- Add check constraints for data quality
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'workout_sessions_valid_progress'
          ) THEN
            ALTER TABLE workout_sessions 
            ADD CONSTRAINT workout_sessions_valid_progress 
            CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'session_exercises_valid_order'
          ) THEN
            ALTER TABLE session_exercises 
            ADD CONSTRAINT session_exercises_valid_order 
            CHECK (order_index >= 0);
          END IF;
        END $$;
      `,
      rollback: `
        ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_valid_progress;
        ALTER TABLE session_exercises DROP CONSTRAINT IF EXISTS session_exercises_valid_order;
      `,
      validate: `
        SELECT COUNT(*) as count FROM information_schema.check_constraints 
        WHERE constraint_name IN ('workout_sessions_valid_progress', 'session_exercises_valid_order')
      `
    }
  ];

  /**
   * Check if migration has already been applied
   */
  private async isMigrationApplied(version: string): Promise<boolean> {
    try {
      const result = await optimizedDb.executeQuery(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [version],
        { cacheable: false }
      );
      return result.length > 0;
    } catch (error) {
      // If table doesn't exist, no migrations have been applied
      return false;
    }
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(step: MigrationStep): Promise<void> {
    await optimizedDb.executeQuery(
      `INSERT INTO schema_migrations (version, description, applied_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (version) DO NOTHING`,
      [step.name, step.description],
      { cacheable: false }
    );
  }

  /**
   * Validate migration step
   */
  private async validateMigration(step: MigrationStep): Promise<boolean> {
    if (!step.validate) return true;
    
    try {
      const result = await optimizedDb.executeQuery(step.validate, [], { cacheable: false });
      const count = parseInt(result[0]?.count || '0');
      return count > 0;
    } catch (error) {
      console.error(`❌ Validation failed for ${step.name}:`, error);
      return false;
    }
  }

  /**
   * Execute a single migration step
   */
  private async executeMigrationStep(step: MigrationStep): Promise<boolean> {
    try {
      console.log(`📋 Executing: ${step.description}`);
      
      // Check if already applied
      if (await this.isMigrationApplied(step.name)) {
        console.log(`   ⏭️  Already applied, skipping`);
        return true;
      }
      
      const startTime = Date.now();
      
      // Execute migration SQL
      await optimizedDb.executeQuery(step.sql, [], { 
        cacheable: false,
        timeout: 120000 // 2 minute timeout for migrations
      });
      
      const duration = Date.now() - startTime;
      
      // Validate if validation query provided
      const isValid = await this.validateMigration(step);
      if (!isValid) {
        console.error(`❌ Validation failed for ${step.name}`);
        return false;
      }
      
      // Record migration as completed
      await this.recordMigration(step);
      
      console.log(`   ✅ Completed in ${duration}ms`);
      return true;
    } catch (error) {
      console.error(`❌ Migration step failed: ${step.name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Rollback a migration step
   */
  private async rollbackMigrationStep(step: MigrationStep): Promise<boolean> {
    if (!step.rollback) {
      console.log(`⚠️  No rollback defined for ${step.name}`);
      return true;
    }
    
    try {
      console.log(`🔄 Rolling back: ${step.description}`);
      
      await optimizedDb.executeQuery(step.rollback, [], { 
        cacheable: false,
        timeout: 120000
      });
      
      // Remove migration record
      await optimizedDb.executeQuery(
        'DELETE FROM schema_migrations WHERE version = $1',
        [step.name],
        { cacheable: false }
      );
      
      console.log(`   ✅ Rollback completed`);
      return true;
    } catch (error) {
      console.error(`❌ Rollback failed: ${step.name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Run all migration steps
   */
  public async migrate(): Promise<void> {
    console.log('🚀 Starting Database Migration to Optimized Schema\n');
    
    // Check database connectivity
    try {
      await optimizedDb.executeQuery('SELECT 1', [], { cacheable: false, timeout: 5000 });
      console.log('✅ Database connection verified\n');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
    
    let successCount = 0;
    let totalSteps = this.migrationSteps.length;
    
    for (const step of this.migrationSteps) {
      const success = await this.executeMigrationStep(step);
      
      if (success) {
        successCount++;
      } else {
        console.error(`\n💥 Migration failed at step: ${step.name}`);
        console.error('Migration aborted. Previous steps remain applied.');
        process.exit(1);
      }
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`   Applied: ${successCount}/${totalSteps} steps`);
    console.log('\n📊 Migration Summary:');
    
    // Show applied migrations
    const appliedMigrations = await optimizedDb.executeQuery(
      'SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at',
      [],
      { cacheable: false }
    );
    
    appliedMigrations.forEach((migration: any, index) => {
      console.log(`   ${index + 1}. ${migration.description} (${migration.applied_at})`);
    });
    
    console.log('\n🔍 Next Steps:');
    console.log('   1. Test application: pnpm dev');
    console.log('   2. Run performance analysis: tsx scripts/analyze-database-performance.ts');
    console.log('   3. Update application to use OptimizedWorkoutService');
    console.log('   4. Monitor performance improvements');
  }

  /**
   * Rollback migrations
   */
  public async rollback(steps: number = 1): Promise<void> {
    console.log(`🔄 Rolling back last ${steps} migration step(s)\n`);
    
    // Get applied migrations in reverse order
    const appliedMigrations = await optimizedDb.executeQuery(
      'SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT $1',
      [steps],
      { cacheable: false }
    );
    
    if (appliedMigrations.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }
    
    for (const migration of appliedMigrations) {
      const step = this.migrationSteps.find(s => s.name === migration.version);
      if (step) {
        await this.rollbackMigrationStep(step);
      }
    }
    
    console.log('\n✅ Rollback completed');
  }

  /**
   * Show migration status
   */
  public async status(): Promise<void> {
    console.log('📊 Migration Status\n');
    
    try {
      const appliedMigrations = await optimizedDb.executeQuery(
        'SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at',
        [],
        { cacheable: false }
      );
      
      console.log('Applied Migrations:');
      if (appliedMigrations.length === 0) {
        console.log('   (none)');
      } else {
        appliedMigrations.forEach((migration: any, index) => {
          console.log(`   ${index + 1}. ${migration.version}: ${migration.description}`);
          console.log(`      Applied: ${migration.applied_at}`);
        });
      }
      
      const appliedVersions = appliedMigrations.map((m: any) => m.version);
      const pendingMigrations = this.migrationSteps.filter(s => !appliedVersions.includes(s.name));
      
      console.log('\nPending Migrations:');
      if (pendingMigrations.length === 0) {
        console.log('   (none)');
      } else {
        pendingMigrations.forEach((migration, index) => {
          console.log(`   ${index + 1}. ${migration.name}: ${migration.description}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Migration tracking table not found. Run migration to initialize.');
    }
  }
}

// CLI interface
const command = process.argv[2];
const migration = new DatabaseMigration();

async function main() {
  switch (command) {
    case 'migrate':
      await migration.migrate();
      break;
    case 'rollback':
      const steps = parseInt(process.argv[3] || '1');
      await migration.rollback(steps);
      break;
    case 'status':
      await migration.status();
      break;
    default:
      console.log('Usage: tsx scripts/migrate-to-optimized-db.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  migrate   - Apply all pending migrations');
      console.log('  rollback  - Rollback last migration (or specify number)');
      console.log('  status    - Show migration status');
      console.log('');
      console.log('Examples:');
      console.log('  tsx scripts/migrate-to-optimized-db.ts migrate');
      console.log('  tsx scripts/migrate-to-optimized-db.ts rollback 2');
      console.log('  tsx scripts/migrate-to-optimized-db.ts status');
      break;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export default DatabaseMigration;