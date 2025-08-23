/**
 * Base service class with common functionality for all services
 * Provides consistent error handling, logging, and database access patterns
 * Enhanced with advanced TypeScript patterns and error handling
 */

import { db, type TypeSafeDatabaseInterface } from '@/lib/db/connection';
import { logAuthEvent } from '@/lib/db/auth';
import {
  type AppError,
  type Result,
  // type AsyncResult,
  AppErrorBuilder,
  ValidationErrorBuilder,
  ERROR_CODES,
  ErrorSeverity,
  success,
  failure,
} from '@/types/errors';

// Advanced service context with optional property patterns
export interface ServiceContext {
  readonly userId: string;
  readonly organizationId?: string | undefined;
  readonly userRole?: string | undefined;
}

// Utility type for making specific properties required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Context variations for different use cases
export type ServiceContextWithOrg = RequireFields<
  ServiceContext,
  'organizationId'
>;
export type ServiceContextWithRole = RequireFields<ServiceContext, 'userRole'>;
export type ServiceContextComplete = RequireFields<
  ServiceContext,
  'organizationId' | 'userRole'
>;

export interface ServiceOptions {
  skipAuth?: boolean;
  skipLogging?: boolean;
  transaction?: any; // Database transaction
}

// Enhanced service result using advanced Result pattern
export type ServiceResult<T> = Result<T, AppError>;

// Legacy interface for backwards compatibility
export interface ServiceResultLegacy<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
  message?: string; // Added to fix compilation errors
}

// Utility to convert between new and legacy formats
export function toLegacyResult<T>(
  result: ServiceResult<T>
): ServiceResultLegacy<T> {
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      error: result.error.message,
      code: result.error.code,
      details: result.error.context,
    };
  }
}

export function fromLegacyResult<T>(
  legacy: ServiceResultLegacy<T>
): ServiceResult<T> {
  if (legacy.success && legacy.data !== undefined) {
    return success(legacy.data);
  } else {
    const error = AppErrorBuilder.create()
      .withCode(legacy.code || 'UNKNOWN_ERROR')
      .withMessage(legacy.error || 'Unknown error occurred')
      .withCategory('system')
      .withSeverity(ErrorSeverity.MEDIUM)
      .withContext(legacy.details || {})
      .build();
    return failure(error);
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseService {
  protected readonly db: TypeSafeDatabaseInterface = db;
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Create a successful service result with advanced typing
   * Maintains backward compatibility with message parameter
   */
  protected createSuccessResult<T>(
    data: T,
    message?: string
  ): ServiceResult<T> {
    // The message parameter is ignored in the new Result pattern
    // but maintained for backward compatibility
    return success(data);
  }

  /**
   * Create an error service result with advanced error handling
   */
  protected createErrorResult(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceResult<never> {
    const error = AppErrorBuilder.create()
      .withCode(code)
      .withMessage(message)
      .withCategory('business_logic')
      .withSeverity(ErrorSeverity.MEDIUM)
      .withContext({ service: this.serviceName, ...details })
      .build();
    return failure(error);
  }

  /**
   * Create validation error result
   */
  protected createValidationError(
    fields: Array<{ field: string; message: string; value?: unknown }>
  ): ServiceResult<never> {
    const builder = new ValidationErrorBuilder()
      .withCode(ERROR_CODES.VALIDATION_FAILED)
      .withMessage('Validation failed')
      .withContext({ service: this.serviceName });

    fields.forEach(({ field, message, value }) => {
      builder.withField(field, message, value);
    });

    return failure(builder.build());
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
          ...additionalData,
        }
      );
    } catch (error) {
      // Don't throw on logging errors, just log to console
      console.error('Failed to log service event:', error);
    }
  }

  /**
   * Validate user context with advanced type safety
   */
  protected validateContext(
    context: ServiceContext,
    requiredRole?: string[]
  ): void {
    if (!context.userId) {
      const error = AppErrorBuilder.create()
        .withCode(ERROR_CODES.INVALID_CREDENTIALS)
        .withMessage('User context is required')
        .withCategory('authentication')
        .withSeverity(ErrorSeverity.HIGH)
        .withContext({ service: this.serviceName })
        .build();
      throw new Error(error.message);
    }

    if (
      requiredRole &&
      context.userRole &&
      !requiredRole.includes(context.userRole)
    ) {
      const error = AppErrorBuilder.create()
        .withCode(ERROR_CODES.INSUFFICIENT_PERMISSIONS)
        .withMessage(
          `Insufficient permissions. Required roles: ${requiredRole.join(', ')}`
        )
        .withCategory('authorization')
        .withSeverity(ErrorSeverity.HIGH)
        .withContext({
          service: this.serviceName,
          userId: context.userId,
          userRole: context.userRole,
          requiredRoles: requiredRole,
        })
        .build();
      throw new Error(error.message);
    }
  }

  /**
   * Type-safe context validation with return types
   */
  protected validateContextSafe(
    context: ServiceContext,
    requiredRole?: string[]
  ): ServiceResult<ServiceContext> {
    try {
      this.validateContext(context, requiredRole);
      return this.createSuccessResult(context);
    } catch (error) {
      return this.handleError(error, 'validateContext');
    }
  }

  /**
   * Execute database operation with transaction support and enhanced error handling
   */
  protected async executeWithTransaction<T>(
    operation: (client: TypeSafeDatabaseInterface) => Promise<T>,
    options?: { useTransaction?: boolean }
  ): Promise<ServiceResult<T>> {
    try {
      // Transaction support temporarily disabled due to interface incompatibility
      // TODO: Fix transaction interface compatibility with TypeSafeDatabaseInterface
      const result = await operation(this.db);
      return this.createSuccessResult(result);
    } catch (error) {
      return this.handleError(error, 'executeWithTransaction');
    }
  }

  /**
   * Legacy transaction method for backwards compatibility
   */
  protected async executeWithTransactionLegacy<T>(
    operation: (client: TypeSafeDatabaseInterface) => Promise<T>,
    options?: { useTransaction?: boolean }
  ): Promise<T> {
    const result = await this.executeWithTransaction(operation, options);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error.message);
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
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validate required fields in input data
   */
  protected validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(
      (field) =>
        data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Sanitize input data by trimming strings and removing empty values
   */
  protected sanitizeInput<T extends Record<string, any>>(data: T): Partial<T> {
    const sanitized = { ...data } as Record<string, any>;

    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
          delete sanitized[key];
        } else {
          sanitized[key] = trimmed;
        }
      } else if (value === null || value === undefined) {
        delete sanitized[key];
      }
    });

    return sanitized as Partial<T>;
  }

  /**
   * Handle service errors with advanced error classification
   */
  protected handleError(
    error: unknown,
    operation: string
  ): ServiceResult<never> {
    console.error(`${this.serviceName} ${operation} error:`, error);

    if (error instanceof Error) {
      // Advanced error classification with pattern matching
      const errorClassifier = this.classifyError(error, operation);
      return failure(errorClassifier);
    }

    // Handle unknown error types
    const unknownError = AppErrorBuilder.create()
      .withCode('UNKNOWN_ERROR')
      .withMessage('An unexpected error occurred')
      .withCategory('system')
      .withSeverity(ErrorSeverity.HIGH)
      .withContext({
        service: this.serviceName,
        operation,
        errorType: typeof error,
        errorValue: String(error),
      })
      .build();

    return failure(unknownError);
  }

  /**
   * Classify errors based on message patterns and types
   */
  private classifyError(error: Error, operation: string): AppError {
    const baseBuilder = AppErrorBuilder.create()
      .withCause(error)
      .withContext({ service: this.serviceName, operation });

    // Permission/Authorization errors
    if (
      error.message.includes('permission') ||
      error.message.includes('unauthorized')
    ) {
      return baseBuilder
        .withCode(ERROR_CODES.INSUFFICIENT_PERMISSIONS)
        .withMessage(error.message)
        .withCategory('authorization')
        .withSeverity(ErrorSeverity.HIGH)
        .build();
    }

    // Not found errors
    if (error.message.includes('not found')) {
      return baseBuilder
        .withCode('NOT_FOUND')
        .withMessage(error.message)
        .withCategory('business_logic')
        .withSeverity(ErrorSeverity.MEDIUM)
        .build();
    }

    // Validation errors
    if (
      error.message.includes('validation') ||
      error.message.includes('required')
    ) {
      return baseBuilder
        .withCode(ERROR_CODES.VALIDATION_FAILED)
        .withMessage(error.message)
        .withCategory('validation')
        .withSeverity(ErrorSeverity.MEDIUM)
        .build();
    }

    // Duplicate/Unique constraint errors
    if (
      error.message.includes('duplicate') ||
      error.message.includes('unique')
    ) {
      return baseBuilder
        .withCode(ERROR_CODES.RESOURCE_CONFLICT)
        .withMessage('Resource already exists')
        .withCategory('business_logic')
        .withSeverity(ErrorSeverity.MEDIUM)
        .build();
    }

    // Database connection errors
    if (
      error.message.includes('connection') ||
      error.message.includes('timeout')
    ) {
      return baseBuilder
        .withCode(ERROR_CODES.CONNECTION_FAILED)
        .withMessage(error.message)
        .withCategory('database')
        .withSeverity(ErrorSeverity.CRITICAL)
        .retryable(true)
        .build();
    }

    // Default operation failed
    return baseBuilder
      .withCode('OPERATION_FAILED')
      .withMessage(error.message)
      .withCategory('system')
      .withSeverity(ErrorSeverity.HIGH)
      .build();
  }

  /**
   * Get current timestamp for database operations
   */
  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  /**
   * Generate UUID for new records
   */
  protected generateId(): string {
    return crypto.randomUUID();
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
      return true;
    }

    // If organization access is allowed and user is admin/owner
    if (allowOrgAccess && context.organizationId && context.userRole) {
      const adminRoles = [
        'admin',
        'owner',
        'gym_admin',
        'gym_owner',
        'family_admin',
      ];
      if (adminRoles.includes(context.userRole)) {
        // Check if resource user is in the same organization
        const result = await this.db`
          SELECT 1 FROM user_profiles up
          WHERE up.id = ${resourceUserId}
          AND up.organization_id = ${context.organizationId}
        `;
        return result.length > 0;
      }
    }

    return false;
  }

  /**
   * Build dynamic WHERE clause for filtering
   */
  protected buildWhereClause(filters: Record<string, any>): {
    clause: string;
    values: any[];
  } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          conditions.push(`${key} = ANY($${paramIndex})`);
          values.push(value);
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }
}

export default BaseService;
