import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function checkDatabaseTypes() {
  try {
    const { getDb } = await import('../lib/db/connection')
    const db = getDb()
    
    console.log('🔍 Checking database types and tables...')
    
    // Check existing enum types
    const types = await db`SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname`
    console.log('📋 Available enum types:', types.map(t => t.typname))
    
    // Check existing tables
    const tables = await db`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    console.log('📊 Available tables:', tables.map(t => t.table_name))
    
    // Check if auth schema is set up
    const authTables = tables.filter(t => 
      ['user_profiles', 'organizations', 'organization_memberships'].includes(t.table_name)
    )
    
    if (authTables.length === 3) {
      console.log('✅ Auth schema appears to be set up')
    } else {
      console.log('❌ Auth schema not fully set up. Missing tables:', 
        ['user_profiles', 'organizations', 'organization_memberships'].filter(t => 
          !authTables.map(at => at.table_name).includes(t)
        )
      )
    }
    
  } catch (error) {
    console.error('❌ Failed to check database:', error)
    process.exit(1)
  }
}

checkDatabaseTypes()