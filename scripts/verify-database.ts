/**
 * Database verification script
 * Run with: npx tsx scripts/verify-database.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database schema...')
    
    // Get database connections after env vars are loaded
    const { getDb } = await import('../lib/db/connection')
    const db = getDb()
    
    // Check what tables exist
    console.log('\n📋 Checking existing tables:')
    const tables = await db`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log('❌ No tables found in public schema')
    } else {
      console.log(`✅ Found ${tables.length} tables:`)
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })
    }

    // Check extensions
    console.log('\n🔌 Checking extensions:')
    const extensions = await db`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `
    
    if (extensions.length === 0) {
      console.log('❌ No required extensions found')
    } else {
      console.log('✅ Found extensions:')
      extensions.forEach(ext => {
        console.log(`  - ${ext.extname} v${ext.extversion}`)
      })
    }

    // Check if we can create a test table
    console.log('\n🧪 Testing table creation:')
    
    try {
      await db`DROP TABLE IF EXISTS test_table`
      await db`CREATE TABLE test_table (id SERIAL PRIMARY KEY, name TEXT)`
      await db`INSERT INTO test_table (name) VALUES ('test')`
      
      const testResult = await db`SELECT * FROM test_table`
      console.log('✅ Table creation test successful:', testResult)
      
      await db`DROP TABLE test_table`
      console.log('✅ Test cleanup completed')
    } catch (testError) {
      console.log('❌ Table creation test failed:', testError)
    }

    // Check current user permissions
    console.log('\n👤 Checking user permissions:')
    const userPerms = await db`
      SELECT 
        current_user as username,
        current_database() as database,
        session_user,
        current_setting('is_superuser') as is_superuser
    `
    console.log('User info:', userPerms[0])

    // Check if we can create extensions
    console.log('\n🔧 Testing extension creation:')
    try {
      const extTest = await db`SELECT current_setting('shared_preload_libraries')`
      console.log('Shared libraries:', extTest[0])
      
      // Try to create uuid-ossp if it doesn't exist
      await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
      console.log('✅ uuid-ossp extension available')
    } catch (extError) {
      console.log('❌ Extension creation failed:', extError)
    }

  } catch (error) {
    console.error('❌ Database verification failed:', error)
    process.exit(1)
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyDatabase()
}

export { verifyDatabase }