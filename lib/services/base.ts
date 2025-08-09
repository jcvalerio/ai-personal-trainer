/**
 * Base service class with common functionality for all services
 * Provides consistent error handling, logging, and database access patterns
 */

import { db } from '@/lib/db/connection'
import { logAuthEvent } from '@/lib/db/auth'

export interface ServiceContext {
  userId: string
  organizationId?: string
  userRole?: string
}

export interface ServiceOptions {
  skipAuth?: boolean
  skipLogging?: boolean
  transaction?: any // Database transaction
}

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: Record<string, any>
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export abstract class BaseService {
  protected db = db
  protected serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  /**
   * Create a successful service result
   */
  protected createSuccessResult<T>(data: T, message?: string): ServiceResult<T> {
    return {
      success: true,
      data,
      ...(message && { message })
    }
  }

  /**
   * Create an error service result
   */
  protected createErrorResult(error: string, code?: string, details?: Record<string, any>): ServiceResult {
    return {
      success: false,
      error,
      code,
      details
    }
  }

  /**
   * Log service events for audit and monitoring
   */
  protected async logEvent(
    eventType: string,
    description: string,
    context: ServiceContext,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      await logAuthEvent(
        `${this.serviceName}_${eventType}`,
        'profile',
        description,
        context.userId,
        context.organizationId,
        {
          service: this.serviceName,
          userRole: context.userRole,
          ...additionalData
        }
      )
    } catch (error) {
      // Don't throw on logging errors, just log to console
      console.error('Failed to log service event:', error)
    }
  }

  /**
   * Validate user context and permissions
   */
  protected validateContext(context: ServiceContext, requiredRole?: string[]): void {
    if (!context.userId) {
      throw new Error('User context is required')
    }

    if (requiredRole && context.userRole && !requiredRole.includes(context.userRole)) {
      throw new Error(`Insufficient permissions. Required roles: ${requiredRole.join(', ')}`)
    }
  }

  /**
   * Execute database operation with transaction support
   */
  protected async executeWithTransaction<T>(
    operation: (client: any) => Promise<T>,
    options?: { useTransaction?: boolean }
  ): Promise<T> {
    if (options?.useTransaction !== false) {
      return await this.db.transaction(operation)
    } else {
      return await operation(this.db)
    }
  }

  /**
   * Apply pagination to query results
   */
  protected applyPagination<T>(
    items: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 10))
    const totalPages = Math.ceil(total / limit)

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Validate required fields in input data
   */
  protected validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    )

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
  }

  /**
   * Sanitize input data by trimming strings and removing empty values
   */
  protected sanitizeInput<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data }
    
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key]
      if (typeof value === 'string') {
        sanitized[key] = value.trim()
        if (sanitized[key] === '') {
          delete sanitized[key]
        }
      } else if (value === null || value === undefined) {
        delete sanitized[key]
      }
    })

    return sanitized
  }

  /**
   * Handle service errors consistently
   */
  protected handleError(error: unknown, operation: string): ServiceResult {
    console.error(`${this.serviceName} ${operation} error:`, error)

    if (error instanceof Error) {
      // Handle known error types
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return this.createErrorResult(error.message, 'UNAUTHORIZED')
      }
      
      if (error.message.includes('not found')) {
        return this.createErrorResult(error.message, 'NOT_FOUND')
      }
      
      if (error.message.includes('validation') || error.message.includes('required')) {
        return this.createErrorResult(error.message, 'VALIDATION_ERROR')
      }

      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return this.createErrorResult('Resource already exists', 'DUPLICATE_ERROR')
      }

      return this.createErrorResult(error.message, 'OPERATION_FAILED')
    }

    return this.createErrorResult('An unexpected error occurred', 'UNKNOWN_ERROR')
  }

  /**
   * Get current timestamp for database operations
   */
  protected getCurrentTimestamp(): Date {
    return new Date()
  }

  /**
   * Generate UUID for new records
   */
  protected generateId(): string {
    return crypto.randomUUID()
  }

  /**
   * Check if user has permission to access resource
   */
  protected async checkResourceAccess(
    resourceUserId: string,
    context: ServiceContext,
    allowOrgAccess = false
  ): Promise<boolean> {
    // User can always access their own resources
    if (resourceUserId === context.userId) {
      return true
    }

    // If organization access is allowed and user is admin/owner
    if (allowOrgAccess && context.organizationId && context.userRole) {
      const adminRoles = ['admin', 'owner', 'gym_admin', 'gym_owner', 'family_admin']
      if (adminRoles.includes(context.userRole)) {
        // Check if resource user is in the same organization
        const result = await this.db`
          SELECT 1 FROM user_profiles up
          WHERE up.id = ${resourceUserId}
          AND up.organization_id = ${context.organizationId}
        `
        return result.length > 0
      }
    }

    return false
  }

  /**
   * Build dynamic WHERE clause for filtering
   */
  protected buildWhereClause(filters: Record<string, any>): { clause: string; values: any[] } {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          conditions.push(`${key} = ANY($${paramIndex})`)
          values.push(value)
        } else {
          conditions.push(`${key} = $${paramIndex}`)
          values.push(value)
        }
        paramIndex++
      }
    })

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    }
  }
}

export default BaseService