#!/usr/bin/env tsx

/**
 * Production Database Migration Script
 * 
 * This script handles database migrations for production deployment.
 * It ensures database schema is up-to-date and validates connections.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { sql } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { glob } from 'glob';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface MigrationFile {
  filename: string;
  version: string;
  content: string;
}

class DatabaseMigrator {
  private client: ReturnType<typeof sql>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    this.client = sql(process.env.DATABASE_URL);
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      log('blue', '🔍 Testing database connection...');
      const result = await this.client`SELECT 1 as test`;
      if (result.length === 1 && result[0].test === 1) {
        log('green', '✅ Database connection successful');
        return true;
      }
      return false;
    } catch (error) {
      log('red', `❌ Database connection failed: ${error}`);
      return false;
    }
  }

  /**
   * Create migrations table if it doesn't exist
   */
  async createMigrationsTable(): Promise<void> {
    try {
      log('blue', '🛠️ Creating migrations tracking table...');
      await this.client`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          version VARCHAR(50) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      log('green', '✅ Migrations table ready');
    } catch (error) {
      log('red', `❌ Failed to create migrations table: ${error}`);
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await this.client`
        SELECT filename FROM migrations ORDER BY executed_at ASC
      `;
      return result.map(row => row.filename);
    } catch (error) {
      log('yellow', '⚠️ No migrations table found, will create one');
      return [];
    }
  }

  /**
   * Load migration files from filesystem
   */
  async loadMigrationFiles(): Promise<MigrationFile[]> {
    try {
      log('blue', '📂 Loading migration files...');
      
      const migrationPaths = await glob('database/migrations/*.sql');
      const migrations: MigrationFile[] = [];

      for (const path of migrationPaths.sort()) {
        const filename = path.split('/').pop()!;
        const version = filename.split('_')[0];
        const content = readFileSync(path, 'utf-8');
        
        migrations.push({
          filename,
          version,
          content
        });
      }

      log('green', `✅ Loaded ${migrations.length} migration files`);
      return migrations;
    } catch (error) {
      log('red', `❌ Failed to load migration files: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: MigrationFile): Promise<void> {
    try {
      log('blue', `🚀 Executing migration: ${migration.filename}`);
      
      // Execute the migration SQL
      await this.client.begin(async (tx) => {
        // Execute the migration content
        await tx.unsafe(migration.content);
        
        // Record the migration as executed
        await tx`
          INSERT INTO migrations (filename, version) 
          VALUES (${migration.filename}, ${migration.version})
        `;
      });
      
      log('green', `✅ Migration ${migration.filename} completed successfully`);
    } catch (error) {
      log('red', `❌ Migration ${migration.filename} failed: ${error}`);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      log('magenta', '🎯 Starting database migration process...');
      
      // Ensure migrations table exists
      await this.createMigrationsTable();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      log('cyan', `📋 Found ${executedMigrations.length} previously executed migrations`);
      
      // Load all migration files
      const allMigrations = await this.loadMigrationFiles();
      
      // Filter pending migrations
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration.filename)
      );
      
      if (pendingMigrations.length === 0) {
        log('green', '✅ No pending migrations - database is up to date');
        return;
      }
      
      log('yellow', `⏳ Found ${pendingMigrations.length} pending migrations`);
      
      // Execute each pending migration
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      log('green', `🎉 Successfully executed ${pendingMigrations.length} migrations`);
      
    } catch (error) {
      log('red', `💥 Migration process failed: ${error}`);
      throw error;
    }
  }

  /**
   * Validate database schema
   */
  async validateSchema(): Promise<void> {
    try {
      log('blue', '🔍 Validating database schema...');
      
      // Check for essential tables
      const expectedTables = ['users', 'workouts', 'exercises', 'workout_sessions'];
      
      for (const table of expectedTables) {
        const result = await this.client`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          )
        `;
        
        if (!result[0].exists) {
          throw new Error(`Required table '${table}' not found`);
        }
      }
      
      log('green', '✅ Database schema validation passed');
    } catch (error) {
      log('red', `❌ Schema validation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Cleanup database connection
   */
  async cleanup(): Promise<void> {
    try {
      await this.client.end();
      log('blue', '🧹 Database connection closed');
    } catch (error) {
      log('yellow', `⚠️ Cleanup warning: ${error}`);
    }
  }
}

/**
 * Main migration execution
 */
async function main() {
  const migrator = new DatabaseMigrator();
  
  try {
    log('magenta', '🚀 AI Personal Trainer - Production Database Migration');
    log('magenta', '================================================');
    
    // Test connection first
    const connected = await migrator.testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    // Run migrations
    await migrator.runMigrations();
    
    // Validate schema
    await migrator.validateSchema();
    
    log('green', '🎉 Database migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    log('red', `💥 Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await migrator.cleanup();
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}