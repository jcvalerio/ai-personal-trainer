#!/usr/bin/env tsx
/**
 * Optimized Database Setup Script for NeonDB
 * Initializes schema, creates indexes, and validates performance
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { optimizedDb, checkOptimizedDbHealth } from '../lib/db/optimized-connection';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface SetupResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

class DatabaseSetup {
  private async executeSchemaFile(filePath: string): Promise<SetupResult> {
    try {
      console.log(`📋 Reading schema file: ${filePath}`);
      const schemaSQL = readFileSync(filePath, 'utf8');
      
      console.log('🏗️  Executing schema initialization...');
      const startTime = Date.now();
      
      await optimizedDb.executeQuery(schemaSQL, [], { 
        cacheable: false,
        timeout: 60000 // 60 second timeout for schema operations
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: `Schema initialization completed in ${duration}ms`,
        details: { duration, file: filePath }
      };
    } catch (error) {
      return {
        success: false,
        message: `Schema initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error), file: filePath }
      };
    }
  }

  private async validateSchema(): Promise<SetupResult> {
    try {
      console.log('🔍 Validating database schema...');
      
      const tableCheckQuery = `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'user_profiles', 'organizations', 'workout_sessions', 
            'session_exercises', 'exercise_library', 'equipment_catalog'
          )
        ORDER BY table_name
      `;
      
      const tables = await optimizedDb.executeQuery(tableCheckQuery);
      
      const expectedTables = [
        'equipment_catalog', 'exercise_library', 'organizations',
        'session_exercises', 'user_profiles', 'workout_sessions'
      ];
      
      const foundTables = tables.map((t: any) => t.table_name).sort();
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));
      
      if (missingTables.length > 0) {
        return {
          success: false,
          message: `Missing tables: ${missingTables.join(', ')}`,
          details: { foundTables, missingTables, expectedTables }
        };
      }
      
      console.log('✅ All required tables found');
      return {
        success: true,
        message: `All ${expectedTables.length} required tables validated`,
        details: { tables: foundTables }
      };
    } catch (error) {
      return {
        success: false,
        message: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error) }
      };
    }
  }

  private async validateIndexes(): Promise<SetupResult> {
    try {
      console.log('🔍 Validating performance indexes...');
      
      const indexQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
          AND (
            indexname LIKE 'idx_%' 
            OR indexname LIKE '%_pkey'
            OR indexname LIKE '%_key'
          )
        ORDER BY tablename, indexname
      `;
      
      const indexes = await optimizedDb.executeQuery(indexQuery);
      
      // Key indexes for performance
      const criticalIndexes = [
        'idx_user_profiles_clerk_id_covering',
        'idx_workout_sessions_user_date_status',
        'idx_session_exercises_session_order',
        'idx_workout_sessions_id_active',
      ];
      
      const foundIndexes = indexes.map((i: any) => i.indexname);
      const missingCritical = criticalIndexes.filter(idx => 
        !foundIndexes.some(found => found.includes(idx.replace('idx_', '').split('_')[0]))
      );
      
      console.log(`📊 Found ${indexes.length} indexes`);
      
      return {
        success: missingCritical.length === 0,
        message: missingCritical.length === 0 
          ? `All critical indexes validated (${indexes.length} total)`
          : `Missing critical indexes: ${missingCritical.join(', ')}`,
        details: { 
          totalIndexes: indexes.length,
          criticalFound: criticalIndexes.length - missingCritical.length,
          criticalTotal: criticalIndexes.length,
          missingCritical
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Index validation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error) }
      };
    }
  }

  private async seedBasicData(): Promise<SetupResult> {
    try {
      console.log('🌱 Checking and seeding basic data...');
      
      // Check if exercises exist
      const exerciseCount = await optimizedDb.executeQuery(
        'SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true'
      );
      
      const count = parseInt(exerciseCount[0]?.count || '0');
      
      if (count === 0) {
        console.log('📝 No exercises found, seeding basic exercises...');
        
        const seedQuery = `
          INSERT INTO exercise_library (
            name, slug, description, instructions, exercise_type, 
            primary_muscle_groups, difficulty_level, equipment_required
          ) VALUES
          ('Push-ups', 'push-ups', 'Classic bodyweight chest exercise', 
           'Start in plank position, lower body to ground, push back up', 
           'strength', ARRAY['chest', 'shoulders', 'triceps'], 'beginner', ARRAY[]::UUID[]),
          ('Squats', 'squats', 'Fundamental lower body movement', 
           'Stand with feet shoulder-width apart, lower as if sitting back, return to standing', 
           'strength', ARRAY['quadriceps', 'glutes'], 'beginner', ARRAY[]::UUID[]),
          ('Plank', 'plank', 'Core stability exercise', 
           'Hold straight line from head to heels in push-up position', 
           'strength', ARRAY['core', 'shoulders'], 'beginner', ARRAY[]::UUID[]),
          ('Burpees', 'burpees', 'Full body cardio movement', 
           'Squat, jump back to plank, push-up, jump forward, stand and jump', 
           'cardio', ARRAY['full_body'], 'intermediate', ARRAY[]::UUID[]),
          ('Lunges', 'lunges', 'Single leg strengthening exercise', 
           'Step forward, lower back knee toward ground, return to standing', 
           'strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'beginner', ARRAY[]::UUID[])
          ON CONFLICT (slug) DO NOTHING
        `;
        
        await optimizedDb.executeQuery(seedQuery, [], { cacheable: false });
        
        // Verify seeding
        const newCount = await optimizedDb.executeQuery(
          'SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true'
        );
        
        return {
          success: true,
          message: `Seeded ${parseInt(newCount[0]?.count || '0')} basic exercises`,
          details: { exercisesSeeded: parseInt(newCount[0]?.count || '0') }
        };
      } else {
        return {
          success: true,
          message: `Basic data already exists (${count} exercises found)`,
          details: { existingExercises: count }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Data seeding failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error) }
      };
    }
  }

  private async performanceTest(): Promise<SetupResult> {
    try {
      console.log('⚡ Running performance tests...');
      
      const startTime = Date.now();
      
      // Test critical queries that will be used frequently
      const tests = [
        {
          name: 'User Profile Lookup',
          query: 'SELECT id, clerk_user_id, display_name FROM user_profiles LIMIT 1',
        },
        {
          name: 'Exercise Library Search',
          query: `
            SELECT id, name, exercise_type, primary_muscle_groups 
            FROM exercise_library 
            WHERE is_active = true 
            ORDER BY name LIMIT 10
          `,
        },
        {
          name: 'Session Query Structure',
          query: `
            SELECT id, name, status, scheduled_date 
            FROM workout_sessions 
            WHERE is_active = true 
            ORDER BY scheduled_date DESC LIMIT 5
          `,
        },
      ];
      
      const results: Array<{ name: string; duration: number; success: boolean }> = [];
      
      for (const test of tests) {
        const testStart = Date.now();
        try {
          await optimizedDb.executeQuery(test.query, [], { 
            cacheable: false,
            timeout: 5000 
          });
          const duration = Date.now() - testStart;
          results.push({ name: test.name, duration, success: true });
          console.log(`  ✅ ${test.name}: ${duration}ms`);
        } catch (error) {
          const duration = Date.now() - testStart;
          results.push({ name: test.name, duration, success: false });
          console.log(`  ❌ ${test.name}: Failed after ${duration}ms`);
        }
      }
      
      const totalDuration = Date.now() - startTime;
      const successfulTests = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      return {
        success: successfulTests === tests.length,
        message: `Performance tests completed: ${successfulTests}/${tests.length} passed, avg ${Math.round(avgDuration)}ms`,
        details: { 
          totalDuration,
          avgDuration: Math.round(avgDuration),
          results,
          allPassed: successfulTests === tests.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Performance testing failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: String(error) }
      };
    }
  }

  public async run(): Promise<void> {
    console.log('🚀 Starting Optimized Database Setup\n');
    
    // Step 1: Check connection health
    console.log('📊 Checking database connection...');
    const healthCheck = await checkOptimizedDbHealth();
    
    if (!healthCheck.isHealthy) {
      console.error('❌ Database connection failed');
      console.error('Details:', healthCheck);
      process.exit(1);
    }
    
    console.log(`✅ Database connection healthy (${healthCheck.latency}ms)\n`);
    
    // Step 2: Execute schema
    const schemaPath = resolve(process.cwd(), 'scripts/init-neondb-schema.sql');
    const schemaResult = await this.executeSchemaFile(schemaPath);
    
    console.log(schemaResult.success ? '✅' : '❌', schemaResult.message);
    if (schemaResult.details) {
      console.log('   Details:', schemaResult.details);
    }
    
    if (!schemaResult.success) {
      console.error('\n❌ Schema setup failed, aborting...');
      process.exit(1);
    }
    
    console.log(''); // Empty line for readability
    
    // Step 3: Validate schema
    const validationResult = await this.validateSchema();
    console.log(validationResult.success ? '✅' : '❌', validationResult.message);
    if (validationResult.details) {
      console.log('   Details:', validationResult.details);
    }
    
    if (!validationResult.success) {
      console.error('\n❌ Schema validation failed, aborting...');
      process.exit(1);
    }
    
    console.log(''); // Empty line
    
    // Step 4: Validate indexes
    const indexResult = await this.validateIndexes();
    console.log(indexResult.success ? '✅' : '⚠️ ', indexResult.message);
    if (indexResult.details) {
      console.log('   Details:', indexResult.details);
    }
    
    console.log(''); // Empty line
    
    // Step 5: Seed basic data
    const seedResult = await this.seedBasicData();
    console.log(seedResult.success ? '✅' : '❌', seedResult.message);
    if (seedResult.details) {
      console.log('   Details:', seedResult.details);
    }
    
    console.log(''); // Empty line
    
    // Step 6: Performance testing
    const perfResult = await this.performanceTest();
    console.log(perfResult.success ? '✅' : '⚠️ ', perfResult.message);
    if (perfResult.details) {
      console.log('   Details:', perfResult.details);
    }
    
    console.log(''); // Empty line
    
    // Step 7: Final health check
    console.log('🔍 Final system health check...');
    const finalHealth = await checkOptimizedDbHealth();
    
    console.log('📊 Database Metrics:');
    console.log(`   Connection Health: ${finalHealth.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Response Time: ${finalHealth.latency}ms`);
    console.log(`   Cache Hit Rate: ${finalHealth.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`   Total Queries: ${finalHealth.metrics.totalQueries}`);
    console.log(`   Average Query Time: ${finalHealth.metrics.avgQueryTime.toFixed(1)}ms`);
    console.log(`   Slow Query Rate: ${finalHealth.metrics.slowQueryRate.toFixed(1)}%`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the application: pnpm dev');
    console.log('   2. Run workout tests: pnpm db:test:workouts');
    console.log('   3. Verify endpoints: curl http://localhost:3000/api/workouts/sessions');
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run().catch((error) => {
    console.error('💥 Setup failed with error:', error);
    process.exit(1);
  });
}

export default DatabaseSetup;