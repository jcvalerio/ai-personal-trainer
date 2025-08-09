import { neon } from '@neondatabase/serverless'

// Create database connections  
function createDbConnection() {
  const DATABASE_URL = process.env.DATABASE_URL
  
  if (!DATABASE_URL) {
    throw new Error(`DATABASE_URL environment variable is required. Current env: ${process.env.NODE_ENV}, Available vars: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ')}`)
  }

  return neon(DATABASE_URL)
}

function createDirectDbConnection() {
  const DIRECT_URL = process.env.DIRECT_URL
  
  if (DIRECT_URL) {
    return neon(DIRECT_URL)
  }
  
  return createDbConnection()
}

// Export database factory functions instead of instances
export function getDb() {
  return createDbConnection()
}

export function getDirectDb() {
  return createDirectDbConnection()
}

// For backwards compatibility, export lazy-initialized instances
let _db: ReturnType<typeof neon> | null = null
let _directDb: ReturnType<typeof neon> | null = null

export const db = (...args: any[]) => {
  if (!_db) {
    _db = createDbConnection()
  }
  return (_db as any)(...args)
}

// Add properties for other methods like unsafe
Object.defineProperty(db, 'unsafe', {
  get() {
    if (!_db) {
      _db = createDbConnection()
    }
    return _db.unsafe
  }
})

export const directDb = (...args: any[]) => {
  if (!_directDb) {
    _directDb = createDirectDbConnection()
  }
  return (_directDb as any)(...args)
}

// Database connection health check
export async function checkDbConnection(): Promise<boolean> {
  try {
    const result = await db`SELECT 1 as health_check`
    return Array.isArray(result) && result.length === 1 && (result[0] as any)?.health_check === 1
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Database connection info for debugging
export function getDbInfo() {
  const DATABASE_URL = process.env.DATABASE_URL
  const DIRECT_URL = process.env.DIRECT_URL
  
  return {
    hasMainConnection: !!DATABASE_URL,
    hasDirectConnection: !!DIRECT_URL,
    environment: process.env.NODE_ENV || 'development'
  }
}

// Export types for better TypeScript support
export type DbConnection = typeof db
export type DbResult = Awaited<ReturnType<typeof db>>

// Connection pooling configuration for production
const connectionConfig = {
  // NeonDB serverless handles connection pooling automatically
  // These are just for reference/documentation
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000
}

export { connectionConfig }