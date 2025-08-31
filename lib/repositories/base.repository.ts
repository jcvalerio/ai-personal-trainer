/**
 * Base Repository Interface and Implementation
 * Implements Repository pattern for clean data access abstraction
 * Separates data access concerns from business logic in services
 */

import { optimizedDb } from '@/lib/db/optimized-connection';
import { 
  AppErrorBuilder, 
  ErrorSeverity
} from '@/types/errors';

// Base entity interface that all entities should extend
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generic query filters
export interface QueryFilters {
  [key: string]: unknown;
}

// Query options for advanced operations
export interface QueryOptions {
  cacheable?: boolean;
  cacheKey?: string;
  timeout?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// Repository interface defining CRUD operations
export interface BaseRepository<T extends BaseEntity> {
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findMany(filters?: QueryFilters, options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: QueryFilters): Promise<number>;
}

// Transaction context for operations
export interface TransactionContext {
  isInTransaction: boolean;
  transactionId?: string;
}

/**
 * Abstract base repository implementation
 * Provides common functionality for all concrete repositories
 */
export abstract class AbstractBaseRepository<T extends BaseEntity> implements BaseRepository<T> {
  protected readonly tableName: string;
  protected readonly db = optimizedDb;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find entity by ID with caching support
   */
  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    this.validateId(id);

    try {
      const cacheKey = options.cacheKey || `${this.tableName}:${id}`;
      
      const result = await this.db.executeQuery<T>(
        `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`,
        [id],
        { 
          cacheable: options.cacheable !== false,
          cacheKey,
          timeout: options.timeout
        }
      );

      return result.length > 0 ? this.mapFromDatabase(result[0]) : null;
    } catch (error) {
      throw this.createRepositoryError('FIND_BY_ID_FAILED', 
        `Failed to find ${this.tableName} by id: ${id}`, error);
    }
  }

  /**
   * Find multiple entities with filtering and pagination
   */
  async findMany(filters: QueryFilters = {}, options: QueryOptions = {}): Promise<T[]> {
    try {
      const { whereClause, params } = this.buildWhereClause(filters);
      const { orderClause } = this.buildOrderClause(options);
      const { limitClause, limitParams } = this.buildLimitClause(options, params.length + 1);

      const sql = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim();

      const allParams = [...params, ...limitParams];
      const cacheKey = options.cacheKey || `${this.tableName}:findMany:${JSON.stringify(filters)}`;

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 SQL Debug:', {
          table: this.tableName,
          sql,
          params: allParams,
          whereParams: params,
          limitParams,
          filters,
          options
        });
      }

      const result = await this.db.executeQuery<T>(
        sql,
        allParams,
        {
          cacheable: options.cacheable !== false,
          cacheKey,
          timeout: options.timeout
        }
      );

      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('FIND_MANY_FAILED',
        `Failed to find ${this.tableName} entities`, error);
    }
  }

  /**
   * Create new entity with auto-generated timestamps
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const entityData = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      } as T;

      // Prepare the entity for database insertion
      const dbData = this.mapToDatabase(entityData);
      const { columns, values, placeholders } = this.buildInsertClause(dbData);

      const sql = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await this.db.executeQuery<T>(
        sql,
        values,
        { cacheable: false }
      );

      if (result.length === 0) {
        throw new Error('Create operation returned no results');
      }

      return this.mapFromDatabase(result[0]);
    } catch (error) {
      throw this.createRepositoryError('CREATE_FAILED',
        `Failed to create ${this.tableName} entity`, error);
    }
  }

  /**
   * Update existing entity with automatic updatedAt timestamp
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    this.validateId(id);

    try {
      // Check if entity exists
      const exists = await this.exists(id);
      if (!exists) {
        throw this.createRepositoryError('NOT_FOUND',
          `${this.tableName} with id ${id} not found`);
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const dbData = this.mapToDatabase(updateData);
      const { setClause, params } = this.buildUpdateClause(dbData);

      const sql = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $${params.length + 1}
        RETURNING *
      `;

      const result = await this.db.executeQuery<T>(
        sql,
        [...params, id],
        { cacheable: false }
      );

      if (result.length === 0) {
        throw this.createRepositoryError('UPDATE_FAILED',
          `No rows updated for ${this.tableName} id: ${id}`);
      }

      return this.mapFromDatabase(result[0]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.createRepositoryError('UPDATE_FAILED',
        `Failed to update ${this.tableName} entity: ${id}`, error);
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id);

    try {
      // Check if entity exists
      const exists = await this.exists(id);
      if (!exists) {
        throw this.createRepositoryError('NOT_FOUND',
          `${this.tableName} with id ${id} not found`);
      }

      await this.db.executeQuery(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id],
        { cacheable: false }
      );

      // Note: NeonDB doesn't return affected rows count in the same way
      // We rely on the exists check above for validation
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.createRepositoryError('DELETE_FAILED',
        `Failed to delete ${this.tableName} entity: ${id}`, error);
    }
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    this.validateId(id);

    try {
      const result = await this.db.executeQuery<{ count: number }>(
        `SELECT 1 as count FROM ${this.tableName} WHERE id = $1 LIMIT 1`,
        [id],
        { cacheable: true, cacheKey: `${this.tableName}:exists:${id}` }
      );

      return result.length > 0;
    } catch (error) {
      throw this.createRepositoryError('EXISTS_CHECK_FAILED',
        `Failed to check existence of ${this.tableName}: ${id}`, error);
    }
  }

  /**
   * Count entities with optional filtering
   */
  async count(filters: QueryFilters = {}): Promise<number> {
    try {
      const { whereClause, params } = this.buildWhereClause(filters);

      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;

      const result = await this.db.executeQuery<{ count: string }>(
        sql,
        params,
        { 
          cacheable: true, 
          cacheKey: `${this.tableName}:count:${JSON.stringify(filters)}` 
        }
      );

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      throw this.createRepositoryError('COUNT_FAILED',
        `Failed to count ${this.tableName} entities`, error);
    }
  }

  /**
   * Abstract methods that concrete repositories must implement
   */
  protected abstract mapToDatabase(entity: unknown): Record<string, unknown>;
  protected abstract mapFromDatabase(row: unknown): T;

  /**
   * Build WHERE clause from filters
   */
  protected buildWhereClause(filters: QueryFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    });

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  /**
   * Build ORDER BY clause from options
   */
  protected buildOrderClause(options: QueryOptions): { orderClause: string } {
    if (!options.orderBy) {
      return { orderClause: '' };
    }

    const direction = options.orderDirection === 'DESC' ? 'DESC' : 'ASC';
    return { orderClause: `ORDER BY ${options.orderBy} ${direction}` };
  }

  /**
   * Build LIMIT/OFFSET clause from options
   */
  protected buildLimitClause(options: QueryOptions, startParamIndex = 1): { limitClause: string; limitParams: unknown[] } {
    const params: unknown[] = [];
    const clauses: string[] = [];

    if (options.limit !== undefined) {
      clauses.push(`LIMIT $${startParamIndex + params.length}`);
      params.push(options.limit);
    }

    if (options.offset !== undefined) {
      clauses.push(`OFFSET $${startParamIndex + params.length}`);
      params.push(options.offset);
    }

    return {
      limitClause: clauses.join(' '),
      limitParams: params,
    };
  }

  /**
   * Build INSERT clause columns and values
   */
  protected buildInsertClause(data: Record<string, unknown>): { 
    columns: string; 
    values: unknown[]; 
    placeholders: string; 
  } {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    return {
      columns: keys.join(', '),
      values,
      placeholders,
    };
  }

  /**
   * Build UPDATE SET clause
   */
  protected buildUpdateClause(data: Record<string, unknown>): { 
    setClause: string; 
    params: unknown[]; 
  } {
    const entries = Object.entries(data);
    const setClause = entries.map(([key, _], index) => 
      `${key} = $${index + 1}`
    ).join(', ');
    const params = entries.map(([_, value]) => value);

    return { setClause, params };
  }

  /**
   * Validate entity ID
   */
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw this.createRepositoryError('INVALID_ID', 'Entity ID must be a valid non-empty string');
    }
  }

  /**
   * Generate UUID for new entities
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create repository-specific error
   */
  protected createRepositoryError(code: string, message: string, cause?: unknown): Error {
    const errorBuilder = AppErrorBuilder.create()
      .withCode(code)
      .withMessage(message)
      .withCategory('database')
      .withSeverity(ErrorSeverity.HIGH)
      .withContext({ 
        repository: this.tableName,
        operation: 'database_operation'
      });

    if (cause instanceof Error) {
      errorBuilder.withCause(cause);
    }

    const error = errorBuilder.build();
    return new Error(error.message);
  }
}