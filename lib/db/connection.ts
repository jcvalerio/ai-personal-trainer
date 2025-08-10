import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Advanced TypeScript types for database connections
type DatabaseEnvironment = 'development' | 'production' | 'test'

interface DatabaseConfig {
  url: string
  environment: DatabaseEnvironment
  maxConnections?: number
  idleTimeout?: number
  connectionTimeout?: number
}

// Type-safe database connection factory with advanced error handling
class DatabaseConnectionFactory {
  private static instance: DatabaseConnectionFactory
  private config: DatabaseConfig
  private connection: NeonQueryFunction<false, false> | null = null
  private directConnection: NeonQueryFunction<false, false> | null = null

  private constructor() {
    this.config = this.validateAndCreateConfig()
  }

  public static getInstance(): DatabaseConnectionFactory {
    if (!DatabaseConnectionFactory.instance) {
      DatabaseConnectionFactory.instance = new DatabaseConnectionFactory()
    }
    return DatabaseConnectionFactory.instance
  }

  private validateAndCreateConfig(): DatabaseConfig {
    const DATABASE_URL = process.env.DATABASE_URL
    const NODE_ENV = (process.env.NODE_ENV || 'development') as DatabaseEnvironment
    
    if (!DATABASE_URL) {
      const availableVars = Object.keys(process.env)
        .filter(key => key.includes('DATABASE'))
        .join(', ')
      throw new Error(
        `DATABASE_URL environment variable is required. ` +
        `Current env: ${NODE_ENV}, Available database vars: ${availableVars || 'none'}`
      )
    }

    return {
      url: DATABASE_URL,
      environment: NODE_ENV,
      maxConnections: 20,
      idleTimeout: 30000,
      connectionTimeout: 10000
    }
  }

  public createConnection(): NeonQueryFunction<false, false> {
    if (!this.connection) {
      this.connection = neon(this.config.url)
    }
    return this.connection
  }

  public createDirectConnection(): NeonQueryFunction<false, false> {
    const DIRECT_URL = process.env.DIRECT_URL
    
    if (!this.directConnection) {
      if (DIRECT_URL) {
        this.directConnection = neon(DIRECT_URL)
      } else {
        this.directConnection = this.createConnection()
      }
    }
    return this.directConnection
  }

  public getConfig(): Readonly<DatabaseConfig> {
    return Object.freeze({ ...this.config })
  }

  public reset(): void {
    this.connection = null
    this.directConnection = null
  }
}

// Factory functions using the singleton pattern
function createDbConnection(): NeonQueryFunction<false, false> {
  return DatabaseConnectionFactory.getInstance().createConnection()
}

function createDirectDbConnection(): NeonQueryFunction<false, false> {
  return DatabaseConnectionFactory.getInstance().createDirectConnection()
}

// Advanced generic types for query results
type QueryResult<T = Record<string, unknown>> = Promise<T[]>
type QuerySingle<T = Record<string, unknown>> = Promise<T | undefined>

// Enhanced type-safe database interface with call signature
interface TypeSafeDatabaseInterface {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>
  query<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>
  queryOne<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T | undefined>
  queryRaw<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T[]>
  unsafe: NeonQueryFunction<false, false>['unsafe']
  transaction: NeonQueryFunction<false, false>['transaction']
}

// Create a type-safe database wrapper using a function approach
function createTypeSafeDatabase(connectionFactory: () => NeonQueryFunction<false, false>): TypeSafeDatabaseInterface {
  let connection: NeonQueryFunction<false, false> | null = null
  
  const getConnection = () => {
    if (!connection) {
      connection = connectionFactory()
    }
    return connection
  }

  // Main callable function with proper typing
  const database = async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    return getConnection()(strings, ...values) as Promise<T[]>
  }

  // Add additional methods
  database.query = async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    return getConnection()(strings, ...values) as Promise<T[]>
  }

  database.queryOne = async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T | undefined> => {
    const results = await getConnection()(strings, ...values) as T[]
    return results[0]
  }

  // Legacy query method for backwards compatibility with dynamic SQL
  database.queryRaw = async <T = Record<string, unknown>>(
    sql: string, 
    values?: unknown[]
  ): Promise<T[]> => {
    // Replace $1, $2, etc. with actual values for template literal approach
    if (values && values.length > 0) {
      let processedSql = sql
      values.forEach((value, index) => {
        const placeholder = `$${index + 1}`
        const replacement = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
                           value === null ? 'NULL' :
                           String(value)
        processedSql = processedSql.replace(placeholder, replacement)
      })
      const templateLiteral = Object.assign([processedSql], { raw: [processedSql] }) as TemplateStringsArray
      return getConnection()(templateLiteral) as Promise<T[]>
    } else {
      // Create a template literal from the SQL string
      const templateLiteral = Object.assign([sql], { raw: [sql] }) as TemplateStringsArray
      return getConnection()(templateLiteral) as Promise<T[]>
    }
  }

  // Proxy properties to the underlying connection
  Object.defineProperty(database, 'unsafe', {
    get: () => getConnection().unsafe,
    enumerable: true,
    configurable: true
  })

  Object.defineProperty(database, 'transaction', {
    get: () => getConnection().transaction,
    enumerable: true,
    configurable: true
  })

  return database as TypeSafeDatabaseInterface
}

// Create typed database instances with lazy initialization
let _typeSafeDb: TypeSafeDatabaseInterface | null = null
let _typeSafeDirectDb: TypeSafeDatabaseInterface | null = null

// Export type-safe database factory functions
export function getDb(): TypeSafeDatabaseInterface {
  if (!_typeSafeDb) {
    _typeSafeDb = createTypeSafeDatabase(createDbConnection)
  }
  return _typeSafeDb
}

export function getDirectDb(): TypeSafeDatabaseInterface {
  if (!_typeSafeDirectDb) {
    _typeSafeDirectDb = createTypeSafeDatabase(createDirectDbConnection)
  }
  return _typeSafeDirectDb
}

// Export the main database connections
export const db = getDb()
export const directDb = getDirectDb()

// Advanced database connection health check with metrics
export async function checkDbConnection(): Promise<ConnectionHealth> {
  const startTime = Date.now()
  const environment = (process.env.NODE_ENV || 'development') as DatabaseEnvironment
  
  try {
    interface HealthCheckResult {
      health_check: number
    }
    
    const result = await getDb().query<HealthCheckResult>`SELECT 1 as health_check`
    const latency = Date.now() - startTime
    
    const isHealthy = Array.isArray(result) && 
                     result.length === 1 && 
                     result[0]?.health_check === 1
    
    return {
      isHealthy,
      latency,
      timestamp: new Date(),
      environment
    }
  } catch (error) {
    console.error('Database connection check failed:', error)
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      timestamp: new Date(),
      environment
    }
  }
}

// Backwards compatibility wrapper
export async function checkDbConnectionLegacy(): Promise<boolean> {
  const health = await checkDbConnection()
  return health.isHealthy
}

// Advanced database connection info with enhanced type safety
export interface DatabaseInfo {
  hasMainConnection: boolean
  hasDirectConnection: boolean
  environment: DatabaseEnvironment
  config: Readonly<DatabaseConfig>
  connectionStatus: 'initialized' | 'connected' | 'error'
}

export function getDbInfo(): DatabaseInfo {
  const DATABASE_URL = process.env.DATABASE_URL
  const DIRECT_URL = process.env.DIRECT_URL
  const environment = (process.env.NODE_ENV || 'development') as DatabaseEnvironment
  
  let connectionStatus: DatabaseInfo['connectionStatus'] = 'error'
  let config: Readonly<DatabaseConfig>
  
  try {
    config = DatabaseConnectionFactory.getInstance().getConfig()
    connectionStatus = 'initialized'
  } catch (error) {
    // Fallback config for error cases
    config = Object.freeze({
      url: '',
      environment,
      maxConnections: 20,
      idleTimeout: 30000,
      connectionTimeout: 10000
    })
  }
  
  return {
    hasMainConnection: !!DATABASE_URL,
    hasDirectConnection: !!DIRECT_URL,
    environment,
    config,
    connectionStatus
  }
}

// Enhanced TypeScript type exports with advanced patterns
export type { QueryResult, QuerySingle, TypeSafeDatabaseInterface, DatabaseConfig }

// Branded types for validated data
type Brand<T, B> = T & { __brand: B }
export type ValidatedUserId = Brand<string, 'UserId'>
export type ValidatedOrganizationId = Brand<string, 'OrganizationId'>

// Utility type for database row with timestamps
export interface DatabaseRow {
  id: string
  created_at: Date
  updated_at?: Date
}

// Generic database result types
export type DatabaseResult<T = Record<string, unknown>> = T & DatabaseRow
export type PaginatedDatabaseResult<T> = {
  data: DatabaseResult<T>[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Connection health types
export interface ConnectionHealth {
  isHealthy: boolean
  latency: number
  timestamp: Date
  environment: DatabaseEnvironment
}

// Advanced connection types with conditional typing
export type DbConnection<T extends 'main' | 'direct' = 'main'> = 
  T extends 'main' 
    ? TypeSafeDatabaseInterface
    : T extends 'direct'
      ? TypeSafeDatabaseInterface  
      : never

export type DbResult<T = Record<string, unknown>> = Promise<T[]>
export type DbSingleResult<T = Record<string, unknown>> = Promise<T | undefined>

// For backwards compatibility with existing code
export type DbConnection_Legacy = typeof db
export type DbResult_Legacy = Awaited<ReturnType<typeof db>>

// Advanced connection management utilities
export class DatabaseManager {
  private static instance: DatabaseManager
  private healthCheckInterval: NodeJS.Timeout | null = null
  
  private constructor() {}
  
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }
  
  /**
   * Start periodic health checks (useful for long-running applications)
   */
  public startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    this.healthCheckInterval = setInterval(async () => {
      const health = await checkDbConnection()
      if (!health.isHealthy) {
        console.warn('Database health check failed:', health)
        // Could implement alerting, retries, etc.
      }
    }, intervalMs)
  }
  
  /**
   * Stop health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
  
  /**
   * Reset all connections (useful for testing)
   */
  public resetConnections(): void {
    DatabaseConnectionFactory.getInstance().reset()
    _typeSafeDb = null
    _typeSafeDirectDb = null
  }
}

// Export database manager instance
export const dbManager = DatabaseManager.getInstance()

// Legacy export for backwards compatibility
export const connectionConfig = {
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000
} as const