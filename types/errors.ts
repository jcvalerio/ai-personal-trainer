/**
 * Advanced Error Handling Types with Discriminated Unions
 * Provides comprehensive type safety for error management
 */

// Base error interface with branded types for better type safety
type Brand<T, B> = T & { readonly __brand: B }
export type ErrorCode = Brand<string, 'ErrorCode'>
export type ErrorMessage = Brand<string, 'ErrorMessage'>

// Advanced error severity levels with numeric ordering for comparison
export const ErrorSeverity = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
} as const

export type ErrorSeverityLevel = typeof ErrorSeverity[keyof typeof ErrorSeverity]
export type ErrorSeverityName = keyof typeof ErrorSeverity

// Error categories with specific handling strategies
export const ErrorCategory = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATABASE: 'database',
  NETWORK: 'network',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  EXTERNAL_API: 'external_api',
  WEBHOOK: 'webhook',
  PROCESSING: 'processing'
} as const

export type ErrorCategoryType = typeof ErrorCategory[keyof typeof ErrorCategory]

// Base error interface with discriminated union pattern
export interface BaseAppError {
  readonly id: string
  readonly code: ErrorCode
  readonly message: ErrorMessage
  readonly category: ErrorCategoryType
  readonly severity: ErrorSeverityLevel
  readonly timestamp: Date
  readonly context?: Record<string, unknown>
  readonly cause?: Error
  readonly stack?: string
  readonly retryable: boolean
}

// Validation errors with field-specific information
export interface ValidationError extends BaseAppError {
  readonly category: 'validation'
  readonly fields: Array<{
    field: string
    message: string
    value?: unknown
  }>
  readonly schemaViolations?: string[]
}

// Authentication errors with user context
export interface AuthenticationError extends BaseAppError {
  readonly category: 'authentication'
  readonly userId?: string
  readonly authMethod?: 'clerk' | 'api_key' | 'session'
  readonly expiredAt?: Date
  readonly remainingAttempts?: number
}

// Authorization errors with permission details
export interface AuthorizationError extends BaseAppError {
  readonly category: 'authorization'
  readonly userId: string
  readonly resourceId?: string
  readonly resourceType?: string
  readonly requiredPermissions: string[]
  readonly userPermissions: string[]
}

// Database errors with query context
export interface DatabaseError extends BaseAppError {
  readonly category: 'database'
  readonly operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION'
  readonly table?: string
  readonly queryId?: string
  readonly connectionInfo?: {
    database: string
    host: string
    latency: number
  }
}

// Network errors with request details
export interface NetworkError extends BaseAppError {
  readonly category: 'network'
  readonly url?: string
  readonly method?: string
  readonly statusCode?: number
  readonly responseTime?: number
  readonly retryCount: number
  readonly maxRetries: number
}

// Business logic errors with domain context
export interface BusinessLogicError extends BaseAppError {
  readonly category: 'business_logic'
  readonly domain: 'workout' | 'user' | 'organization' | 'auth' | 'billing'
  readonly operation: string
  readonly businessRules: string[]
  readonly conflictingData?: Record<string, unknown>
}

// System errors with performance impact
export interface SystemError extends BaseAppError {
  readonly category: 'system'
  readonly systemComponent: 'memory' | 'cpu' | 'disk' | 'network' | 'process'
  readonly resourceUsage?: {
    current: number
    threshold: number
    unit: string
  }
  readonly affectedFeatures: string[]
}

// External API errors with service details
export interface ExternalApiError extends BaseAppError {
  readonly category: 'external_api'
  readonly service: string
  readonly endpoint?: string
  readonly statusCode?: number
  readonly serviceResponse?: unknown
  readonly rateLimitInfo?: {
    remaining: number
    resetAt: Date
  }
}

// Webhook errors with event context
export interface WebhookError extends BaseAppError {
  readonly category: 'webhook'
  readonly eventType: string
  readonly eventId?: string
  readonly source: string
  readonly verificationFailed?: boolean
  readonly processingStep?: string
}

// Processing errors with job context
export interface ProcessingError extends BaseAppError {
  readonly category: 'processing'
  readonly jobType: string
  readonly jobId?: string
  readonly step?: string
  readonly progress?: {
    completed: number
    total: number
  }
  readonly canResume: boolean
}

// Discriminated union of all error types
export type AppError = 
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | DatabaseError
  | NetworkError
  | BusinessLogicError
  | SystemError
  | ExternalApiError
  | WebhookError
  | ProcessingError

// Type guards for error discrimination
export function isValidationError(error: AppError): error is ValidationError {
  return error.category === 'validation'
}

export function isAuthenticationError(error: AppError): error is AuthenticationError {
  return error.category === 'authentication'
}

export function isAuthorizationError(error: AppError): error is AuthorizationError {
  return error.category === 'authorization'
}

export function isDatabaseError(error: AppError): error is DatabaseError {
  return error.category === 'database'
}

export function isNetworkError(error: AppError): error is NetworkError {
  return error.category === 'network'
}

export function isBusinessLogicError(error: AppError): error is BusinessLogicError {
  return error.category === 'business_logic'
}

export function isSystemError(error: AppError): error is SystemError {
  return error.category === 'system'
}

export function isExternalApiError(error: AppError): error is ExternalApiError {
  return error.category === 'external_api'
}

export function isWebhookError(error: AppError): error is WebhookError {
  return error.category === 'webhook'
}

export function isProcessingError(error: AppError): error is ProcessingError {
  return error.category === 'processing'
}

// Advanced error result types using Result pattern
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Utility type for async results
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>

// Result type helpers
export function success<T>(data: T): Result<T, never> {
  return { success: true, data }
}

export function failure<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error }
}

// Advanced error builder with fluent interface
export class AppErrorBuilder<T extends ErrorCategoryType = ErrorCategoryType> {
  private error: Omit<Partial<BaseAppError>, 'id' | 'timestamp'> & {
    id: string
    timestamp: Date
  } = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    retryable: false
  }

  static create(): AppErrorBuilder {
    return new AppErrorBuilder()
  }

  withCode(code: string): this {
    this.error = { ...this.error, code: code as ErrorCode }
    return this
  }

  withMessage(message: string): this {
    this.error = { ...this.error, message: message as ErrorMessage }
    return this
  }

  withCategory<C extends ErrorCategoryType>(category: C): AppErrorBuilder<C> {
    this.error = { ...this.error, category }
    return this as any
  }

  withSeverity(severity: ErrorSeverityLevel): this {
    this.error = { ...this.error, severity }
    return this
  }

  withContext(context: Record<string, unknown>): this {
    this.error = { ...this.error, context: { ...this.error.context, ...context } }
    return this
  }

  withCause(cause: Error): this {
    this.error = { ...this.error, cause, stack: cause.stack }
    return this
  }

  retryable(retryable = true): this {
    this.error = { ...this.error, retryable }
    return this
  }

  build(): AppError {
    if (!this.error.code || !this.error.message || !this.error.category || !this.error.severity) {
      throw new Error('Error must have code, message, category, and severity')
    }
    return this.error as AppError
  }
}

// Specialized builders for each error type
export class ValidationErrorBuilder extends AppErrorBuilder<'validation'> {
  private fields: ValidationError['fields'] = []
  private schemaViolations: string[] = []

  constructor() {
    super()
    this.withCategory('validation').withSeverity(ErrorSeverity.MEDIUM)
  }

  withField(field: string, message: string, value?: unknown): this {
    this.fields.push({ field, message, value })
    return this
  }

  withSchemaViolation(violation: string): this {
    this.schemaViolations.push(violation)
    return this
  }

  override build(): ValidationError {
    const baseError = super.build()
    return {
      ...baseError,
      category: 'validation',
      fields: this.fields,
      schemaViolations: this.schemaViolations.length > 0 ? this.schemaViolations : undefined
    }
  }
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  canRecover(error: AppError): boolean
  recover(error: AppError): Promise<Result<unknown>>
  getEstimatedRecoveryTime(error: AppError): number
}

// Error handling middleware types
export interface ErrorHandler<T extends AppError = AppError> {
  canHandle(error: unknown): error is T
  handle(error: T): Promise<Result<unknown>>
  getStrategy(): ErrorRecoveryStrategy
}

// Error reporting interface
export interface ErrorReporter {
  report(error: AppError): Promise<void>
  batchReport(errors: AppError[]): Promise<void>
}

// Error context for better debugging
export interface ErrorContext {
  requestId?: string
  userId?: string
  organizationId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  route?: string
  method?: string
  timestamp: Date
  environment: 'development' | 'production' | 'test'
}

// Advanced error logging with structured data
export interface StructuredErrorLog {
  error: AppError
  context: ErrorContext
  metadata: {
    version: string
    service: string
    instance: string
  }
  performance: {
    responseTime?: number
    memoryUsage?: number
    cpuUsage?: number
  }
}

// Constants for common error codes
export const ERROR_CODES = {
  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED' as ErrorCode,
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING' as ErrorCode,
  INVALID_FORMAT: 'INVALID_FORMAT' as ErrorCode,
  
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS' as ErrorCode,
  TOKEN_EXPIRED: 'TOKEN_EXPIRED' as ErrorCode,
  TOKEN_INVALID: 'TOKEN_INVALID' as ErrorCode,
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS' as ErrorCode,
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN' as ErrorCode,
  
  // Database
  CONNECTION_FAILED: 'CONNECTION_FAILED' as ErrorCode,
  QUERY_TIMEOUT: 'QUERY_TIMEOUT' as ErrorCode,
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION' as ErrorCode,
  
  // Network
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT' as ErrorCode,
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE' as ErrorCode,
  RATE_LIMITED: 'RATE_LIMITED' as ErrorCode,
  
  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION' as ErrorCode,
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT' as ErrorCode,
  INVALID_STATE: 'INVALID_STATE' as ErrorCode,
  
  // System
  OUT_OF_MEMORY: 'OUT_OF_MEMORY' as ErrorCode,
  DISK_FULL: 'DISK_FULL' as ErrorCode,
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED' as ErrorCode
} as const

// Error messages with internationalization support
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_FAILED]: 'Validation failed for the provided data' as ErrorMessage,
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: 'Required field is missing' as ErrorMessage,
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid format provided' as ErrorMessage,
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials provided' as ErrorMessage,
  [ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired' as ErrorMessage,
  [ERROR_CODES.TOKEN_INVALID]: 'Authentication token is invalid' as ErrorMessage,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this action' as ErrorMessage,
  [ERROR_CODES.RESOURCE_FORBIDDEN]: 'Access to this resource is forbidden' as ErrorMessage,
  [ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to database' as ErrorMessage,
  [ERROR_CODES.QUERY_TIMEOUT]: 'Database query timed out' as ErrorMessage,
  [ERROR_CODES.CONSTRAINT_VIOLATION]: 'Database constraint violation' as ErrorMessage,
  [ERROR_CODES.REQUEST_TIMEOUT]: 'Request timed out' as ErrorMessage,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is currently unavailable' as ErrorMessage,
  [ERROR_CODES.RATE_LIMITED]: 'Rate limit exceeded' as ErrorMessage,
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'Business rule violation' as ErrorMessage,
  [ERROR_CODES.RESOURCE_CONFLICT]: 'Resource conflict detected' as ErrorMessage,
  [ERROR_CODES.INVALID_STATE]: 'Invalid state for this operation' as ErrorMessage,
  [ERROR_CODES.OUT_OF_MEMORY]: 'System is out of memory' as ErrorMessage,
  [ERROR_CODES.DISK_FULL]: 'Disk space is full' as ErrorMessage,
  [ERROR_CODES.RESOURCE_EXHAUSTED]: 'System resources are exhausted' as ErrorMessage
} as const