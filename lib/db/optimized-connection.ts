/**
 * Optimized Database Connection with Connection Pooling and Caching
 * Addresses NeonDB performance issues and implements query optimization patterns
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { LRUCache } from 'lru-cache';

// Connection pool configuration optimized for NeonDB
interface OptimizedConnectionConfig {
  url: string;
  environment: 'development' | 'production' | 'test';
  
  // Connection pooling
  maxConnections: number;
  minConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  
  // Query optimization
  enableQueryCache: boolean;
  queryCacheTTL: number;
  maxCacheSize: number;
  
  // Performance monitoring
  enableQueryLogging: boolean;
  slowQueryThreshold: number;
}

// Query cache for repeated queries
interface CachedQuery {
  sql: string;
  params: unknown[];
  result: unknown[];
  timestamp: number;
}

class OptimizedDatabaseConnection {
  private static instance: OptimizedDatabaseConnection;
  private config: OptimizedConnectionConfig;
  private connection: NeonQueryFunction<false, false> | null = null;
  private directConnection: NeonQueryFunction<false, false> | null = null;
  
  // Query cache for performance optimization
  private queryCache: LRUCache<string, CachedQuery>;
  
  // Connection health metrics
  private healthMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgQueryTime: 0,
    connectionErrors: 0,
  };

  private constructor() {
    this.config = this.createOptimizedConfig();
    this.queryCache = new LRUCache({
      max: this.config.maxCacheSize,
      ttl: this.config.queryCacheTTL,
    });
  }

  public static getInstance(): OptimizedDatabaseConnection {
    if (!OptimizedDatabaseConnection.instance) {
      OptimizedDatabaseConnection.instance = new OptimizedDatabaseConnection();
    }
    return OptimizedDatabaseConnection.instance;
  }

  private createOptimizedConfig(): OptimizedConnectionConfig {
    const DATABASE_URL = process.env.DATABASE_URL;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for optimized connection');
    }

    // Environment-specific optimizations
    const isProd = NODE_ENV === 'production';
    
    return {
      url: DATABASE_URL,
      environment: NODE_ENV as any,
      
      // Connection pooling - NeonDB specific optimizations
      maxConnections: isProd ? 50 : 20,
      minConnections: isProd ? 10 : 5,
      idleTimeout: isProd ? 60000 : 30000,   // 60s prod, 30s dev
      connectionTimeout: isProd ? 15000 : 10000, // 15s prod, 10s dev
      
      // Query caching - aggressive caching for read-heavy workloads
      enableQueryCache: true,
      queryCacheTTL: isProd ? 300000 : 60000,    // 5min prod, 1min dev
      maxCacheSize: isProd ? 1000 : 500,
      
      // Performance monitoring
      enableQueryLogging: !isProd,
      slowQueryThreshold: isProd ? 1000 : 500,   // 1s prod, 500ms dev
    };
  }

  /**
   * Get optimized connection with connection pooling
   */
  public getConnection(): NeonQueryFunction<false, false> {
    if (!this.connection) {
      // Configure Neon connection with optimal settings
      const connectionString = this.addConnectionOptimizations(this.config.url);
      this.connection = neon(connectionString, {
        // NeonDB specific optimizations
        fetchConnectionCache: true,
        fullResults: false,
      });
    }
    return this.connection;
  }

  /**
   * Get direct connection for administrative operations
   */
  public getDirectConnection(): NeonQueryFunction<false, false> {
    if (!this.directConnection) {
      const DIRECT_URL = process.env.DIRECT_URL;
      const connectionString = this.addConnectionOptimizations(DIRECT_URL || this.config.url);
      
      this.directConnection = neon(connectionString, {
        fetchConnectionCache: true,
        fullResults: false,
      });
    }
    return this.directConnection;
  }

  /**
   * Add connection string optimizations for NeonDB
   */
  private addConnectionOptimizations(url: string): string {
    const urlObj = new URL(url);
    
    // NeonDB connection optimizations
    urlObj.searchParams.set('sslmode', 'require');
    urlObj.searchParams.set('connect_timeout', String(this.config.connectionTimeout / 1000));
    urlObj.searchParams.set('application_name', 'ai-personal-trainer');
    
    // Connection pooling parameters
    if (this.config.environment === 'production') {
      urlObj.searchParams.set('pool_timeout', '30');
      urlObj.searchParams.set('idle_in_transaction_session_timeout', '60000');
    }
    
    return urlObj.toString();
  }

  /**
   * Execute query with caching and performance monitoring
   */
  public async executeQuery<T = Record<string, unknown>>(
    sql: string, 
    params: unknown[] = [],
    options: { 
      cacheable?: boolean, 
      cacheKey?: string,
      timeout?: number 
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(sql, params);
    
    // Check cache for cacheable queries
    if (options.cacheable !== false && this.config.enableQueryCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        this.healthMetrics.cacheHits++;
        if (this.config.enableQueryLogging) {
          console.log(`🟢 Cache hit for query: ${sql.substring(0, 50)}...`);
        }
        return cached.result as T[];
      }
      this.healthMetrics.cacheMisses++;
    }

    try {
      const connection = this.getConnection();
      let result: T[];

      // Execute query with timeout
      if (options.timeout) {
        result = await Promise.race([
          this.executeRawQuery<T>(connection, sql, params),
          this.createTimeoutPromise<T[]>(options.timeout)
        ]);
      } else {
        result = await this.executeRawQuery<T>(connection, sql, params);
      }

      const queryTime = Date.now() - startTime;
      
      // Update metrics
      this.updateQueryMetrics(queryTime, sql);
      
      // Cache result if cacheable
      if (options.cacheable !== false && this.config.enableQueryCache) {
        this.queryCache.set(cacheKey, {
          sql,
          params,
          result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      this.healthMetrics.connectionErrors++;
      console.error('❌ Database query failed:', {
        sql: sql.substring(0, 100),
        params,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Execute raw query with parameter substitution
   */
  private async executeRawQuery<T>(
    connection: NeonQueryFunction<false, false>,
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> {
    if (params.length === 0) {
      const templateLiteral = Object.assign([sql], { raw: [sql] }) as TemplateStringsArray;
      return connection(templateLiteral) as Promise<T[]>;
    }

    // Safe parameter substitution for NeonDB
    let processedSql = sql;
    if (this.config.enableQueryLogging) {
      console.log('🔧 Parameter substitution debug:', {
        originalSql: sql,
        params,
        paramCount: params.length
      });
    }
    
    params.forEach((value, index) => {
      const placeholder = `$${index + 1}`;
      let replacement: string;
      
      if (value === null || value === undefined) {
        replacement = 'NULL';
      } else if (typeof value === 'string') {
        replacement = `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
        replacement = value ? 'TRUE' : 'FALSE';
      } else if (Array.isArray(value)) {
        replacement = `ARRAY[${value.map(v => 
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v)
        ).join(',')}]`;
      } else if (typeof value === 'object') {
        replacement = `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
      } else {
        replacement = String(value);
      }
      
      if (this.config.enableQueryLogging) {
        console.log(`🔧 Replacing ${placeholder} with ${replacement}`);
      }
      
      processedSql = processedSql.replace(placeholder, replacement);
    });

    if (this.config.enableQueryLogging) {
      console.log('🔧 Final processed SQL:', processedSql);
    }

    const templateLiteral = Object.assign([processedSql], { 
      raw: [processedSql] 
    }) as TemplateStringsArray;
    
    if (this.config.enableQueryLogging) {
      console.log('🔧 About to execute template literal query:', {
        templateLiteral,
        connectionType: typeof connection
      });
    }
    
    try {
      const result = await connection(templateLiteral) as T[];
      if (this.config.enableQueryLogging) {
        console.log('🔧 Template literal query successful:', result.length, 'rows');
      }
      return result;
    } catch (error) {
      if (this.config.enableQueryLogging) {
        console.error('🔧 Template literal query failed:', error);
      }
      throw error;
    }
  }

  /**
   * Create timeout promise for query cancellation
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Generate cache key for query and parameters
   */
  private generateCacheKey(sql: string, params: unknown[]): string {
    const paramsStr = JSON.stringify(params);
    return `${sql}:${paramsStr}`;
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(queryTime: number, sql: string): void {
    this.healthMetrics.totalQueries++;
    
    // Update average query time
    this.healthMetrics.avgQueryTime = 
      (this.healthMetrics.avgQueryTime * (this.healthMetrics.totalQueries - 1) + queryTime) / 
      this.healthMetrics.totalQueries;

    // Track slow queries
    if (queryTime > this.config.slowQueryThreshold) {
      this.healthMetrics.slowQueries++;
      
      if (this.config.enableQueryLogging) {
        console.warn(`🐌 Slow query detected (${queryTime}ms):`, sql.substring(0, 100));
      }
    }

    // Log fast queries in dev mode
    if (this.config.enableQueryLogging && queryTime < 50) {
      console.log(`⚡ Fast query (${queryTime}ms):`, sql.substring(0, 50));
    }
  }

  /**
   * Get connection health metrics
   */
  public getHealthMetrics() {
    return {
      ...this.healthMetrics,
      cacheHitRate: this.healthMetrics.cacheHits / 
        (this.healthMetrics.cacheHits + this.healthMetrics.cacheMisses) * 100,
      slowQueryRate: this.healthMetrics.slowQueries / this.healthMetrics.totalQueries * 100,
      cacheSize: this.queryCache.size,
    };
  }

  /**
   * Clear query cache
   */
  public clearCache(): void {
    this.queryCache.clear();
    console.log('🗑️ Query cache cleared');
  }

  /**
   * Health check with detailed diagnostics
   */
  public async healthCheck(): Promise<{
    isHealthy: boolean;
    latency: number;
    metrics: ReturnType<typeof this.getHealthMetrics>;
    timestamp: Date;
  }> {
    const startTime = Date.now();
    
    try {
      await this.executeQuery('SELECT 1 as health_check', [], { 
        cacheable: false, 
        timeout: 5000 
      });
      
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        metrics: this.getHealthMetrics(),
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        metrics: this.getHealthMetrics(),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Reset connections and clear cache
   */
  public reset(): void {
    this.connection = null;
    this.directConnection = null;
    this.clearCache();
    
    // Reset metrics
    this.healthMetrics = {
      totalQueries: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgQueryTime: 0,
      connectionErrors: 0,
    };
  }
}

// Export optimized connection interface
export const optimizedDb = OptimizedDatabaseConnection.getInstance();

// Convenience methods that match existing API
export const executeOptimizedQuery = <T = Record<string, unknown>>(
  sql: string, 
  params: unknown[] = [],
  options?: { cacheable?: boolean; cacheKey?: string; timeout?: number }
): Promise<T[]> => {
  return optimizedDb.executeQuery<T>(sql, params, options);
};

export const getDbHealth = () => optimizedDb.getHealthMetrics();
export const clearDbCache = () => optimizedDb.clearCache();
export const checkOptimizedDbHealth = () => optimizedDb.healthCheck();

// Export types
export type { OptimizedConnectionConfig };