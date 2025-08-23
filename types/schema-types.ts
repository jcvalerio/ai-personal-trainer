/**
 * Advanced Zod Schema Type Integration
 * Provides comprehensive type inference patterns and utilities
 */

import { z } from 'zod';
import * as workoutSchemas from '@/lib/validation/workout-schemas';

// Advanced type inference utilities
type InferSchema<T extends z.ZodTypeAny> = z.infer<T>;
type InferInput<T extends z.ZodTypeAny> = z.input<T>;
// type InferOutput<T extends z.ZodTypeAny> = z.output<T>;

// Workout-related types with advanced inference
export type FitnessLevel = InferSchema<
  typeof workoutSchemas.fitnessLevelSchema
>;
export type ExerciseType = InferSchema<
  typeof workoutSchemas.exerciseTypeSchema
>;
export type WorkoutStatus = InferSchema<
  typeof workoutSchemas.workoutStatusSchema
>;
export type SessionStatus = InferSchema<
  typeof workoutSchemas.sessionStatusSchema
>;
export type SessionType = InferSchema<typeof workoutSchemas.sessionTypeSchema>;
export type ExercisePhase = InferSchema<
  typeof workoutSchemas.exercisePhaseSchema
>;
export type MeasurementType = InferSchema<
  typeof workoutSchemas.measurementTypeSchema
>;
export type AchievementType = InferSchema<
  typeof workoutSchemas.achievementTypeSchema
>;
export type GenerationStatus = InferSchema<
  typeof workoutSchemas.generationStatusSchema
>;

// Equipment types with input/output patterns
export type CreateEquipmentInput = InferInput<
  typeof workoutSchemas.createEquipmentSchema
>;
export type CreateEquipmentData = InferSchema<
  typeof workoutSchemas.createEquipmentSchema
>;
export type UpdateEquipmentInput = InferInput<
  typeof workoutSchemas.updateEquipmentSchema
>;
export type UpdateEquipmentData = InferSchema<
  typeof workoutSchemas.updateEquipmentSchema
>;

// Exercise types with comprehensive patterns
export type CreateExerciseInput = InferInput<
  typeof workoutSchemas.createExerciseSchema
>;
export type CreateExerciseData = InferSchema<
  typeof workoutSchemas.createExerciseSchema
>;
export type UpdateExerciseInput = InferInput<
  typeof workoutSchemas.updateExerciseSchema
>;
export type UpdateExerciseData = InferSchema<
  typeof workoutSchemas.updateExerciseSchema
>;

// Workout plan types with advanced generics
export type CreateWorkoutPlanInput = InferInput<
  typeof workoutSchemas.createWorkoutPlanSchema
>;
export type CreateWorkoutPlanData = InferSchema<
  typeof workoutSchemas.createWorkoutPlanSchema
>;
export type UpdateWorkoutPlanInput = InferInput<
  typeof workoutSchemas.updateWorkoutPlanSchema
>;
export type UpdateWorkoutPlanData = InferSchema<
  typeof workoutSchemas.updateWorkoutPlanSchema
>;

// Session types with conditional patterns
export type CreateWorkoutSessionInput = InferInput<
  typeof workoutSchemas.createWorkoutSessionSchema
>;
export type CreateWorkoutSessionData = InferSchema<
  typeof workoutSchemas.createWorkoutSessionSchema
>;
export type UpdateWorkoutSessionInput = InferInput<
  typeof workoutSchemas.updateWorkoutSessionSchema
>;
export type UpdateWorkoutSessionData = InferSchema<
  typeof workoutSchemas.updateWorkoutSessionSchema
>;

// Progress measurement types
export type CreateProgressMeasurementInput = InferInput<
  typeof workoutSchemas.createProgressMeasurementSchema
>;
export type CreateProgressMeasurementData = InferSchema<
  typeof workoutSchemas.createProgressMeasurementSchema
>;
export type UpdateProgressMeasurementInput = InferInput<
  typeof workoutSchemas.updateProgressMeasurementSchema
>;
export type UpdateProgressMeasurementData = InferSchema<
  typeof workoutSchemas.updateProgressMeasurementSchema
>;

// Pagination types
export type PaginationParams = InferSchema<
  typeof workoutSchemas.paginationSchema
>;
export type PaginationInput = InferInput<
  typeof workoutSchemas.paginationSchema
>;

// Advanced conditional types for database operations
export type WithTimestamps<T> = T & {
  id: string;
  created_at: Date;
  updated_at?: Date;
};

export type WithUserContext<T> = T & {
  user_id: string;
  organization_id?: string;
};

// Branded types for better type safety
type Brand<T, B> = T & { readonly __brand: B };

export type EquipmentId = Brand<string, 'EquipmentId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type WorkoutPlanId = Brand<string, 'WorkoutPlanId'>;
export type WorkoutSessionId = Brand<string, 'WorkoutSessionId'>;
export type ProgressMeasurementId = Brand<string, 'ProgressMeasurementId'>;

// Database entity types with advanced patterns
export type EquipmentEntity = WithTimestamps<
  WithUserContext<CreateEquipmentData & { id: EquipmentId }>
>;
export type ExerciseEntity = WithTimestamps<
  WithUserContext<CreateExerciseData & { id: ExerciseId }>
>;
export type WorkoutPlanEntity = WithTimestamps<
  WithUserContext<CreateWorkoutPlanData & { id: WorkoutPlanId }>
>;
export type WorkoutSessionEntity = WithTimestamps<
  WithUserContext<CreateWorkoutSessionData & { id: WorkoutSessionId }>
>;
export type ProgressMeasurementEntity = WithTimestamps<
  WithUserContext<CreateProgressMeasurementData & { id: ProgressMeasurementId }>
>;

// Advanced utility types for API responses
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      meta?: {
        timestamp: string;
        requestId: string;
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
      meta?: {
        timestamp: string;
        requestId: string;
      };
    };

// Paginated response type
export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>;

// Schema validation utilities with advanced error handling
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

export async function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateSchemaSync<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Advanced schema transformation utilities
export function createOptionalSchema<T extends z.ZodRawShape>(
  shape: T
): z.ZodOptional<
  z.ZodObject<
    T,
    'strip',
    z.ZodTypeAny,
    z.infer<z.ZodObject<T>>,
    z.input<z.ZodObject<T>>
  >
> {
  return z.object(shape).optional();
}

export function createPartialSchema<T extends z.ZodRawShape>(
  shape: T
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }, 'strip', z.ZodTypeAny> {
  const partialShape = {} as { [K in keyof T]: z.ZodOptional<T[K]> };

  for (const key in shape) {
    if (shape.hasOwnProperty(key) && shape[key]) {
      partialShape[key] = shape[key].optional();
    }
  }

  return z.object(partialShape);
}

// Type-safe schema merging with proper typing
export function mergeSchemas<T extends z.ZodRawShape, U extends z.ZodRawShape>(
  schemaA: z.ZodObject<T, 'strip', z.ZodTypeAny>,
  schemaB: z.ZodObject<U, 'strip', z.ZodTypeAny>
) {
  return schemaA.merge(schemaB);
}

// Advanced error formatting for Zod validation
export interface FormattedZodError {
  field: string;
  message: string;
  code: string;
  path: (string | number)[];
}

export function formatZodError(error: z.ZodError): FormattedZodError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    path: err.path,
  }));
}

// Schema-based form validation hooks (for React components)
export type FormValidationState<T> = {
  data: Partial<T>;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
};

// Advanced conditional type for required vs optional fields
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Database query builder types with schema integration
export type QueryFilters<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type SortOptions<T> = {
  field: keyof T;
  direction: 'asc' | 'desc';
};

export type QueryOptions<T> = {
  filters?: QueryFilters<T>;
  sort?: SortOptions<T>;
  pagination?: PaginationParams;
};

// Type-safe API route handlers
export type ApiHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<ApiResponse<TOutput>>;

export type ValidatedApiHandler<
  TInputSchema extends z.ZodTypeAny,
  TOutput = unknown,
> = (input: z.infer<TInputSchema>) => Promise<ApiResponse<TOutput>>;

// Schema composition patterns
export type ComposedSchema<T extends Record<string, z.ZodTypeAny>> = {
  [K in keyof T]: z.infer<T[K]>;
};

// Advanced schema registry for dynamic validation
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas = new Map<string, z.ZodTypeAny>();

  static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  register<T extends z.ZodTypeAny>(name: string, schema: T): void {
    this.schemas.set(name, schema);
  }

  get<T extends z.ZodTypeAny>(name: string): T | undefined {
    return this.schemas.get(name) as T | undefined;
  }

  validate<T>(name: string, data: unknown): ValidationResult<T> {
    const schema = this.schemas.get(name);
    if (!schema) {
      throw new Error(`Schema '${name}' not found in registry`);
    }
    return validateSchemaSync(schema, data) as ValidationResult<T>;
  }
}

// Export the singleton instance
export const schemaRegistry = SchemaRegistry.getInstance();

// Register all workout schemas
schemaRegistry.register(
  'createEquipment',
  workoutSchemas.createEquipmentSchema
);
schemaRegistry.register(
  'updateEquipment',
  workoutSchemas.updateEquipmentSchema
);
schemaRegistry.register('createExercise', workoutSchemas.createExerciseSchema);
schemaRegistry.register('updateExercise', workoutSchemas.updateExerciseSchema);
schemaRegistry.register(
  'createWorkoutPlan',
  workoutSchemas.createWorkoutPlanSchema
);
schemaRegistry.register(
  'updateWorkoutPlan',
  workoutSchemas.updateWorkoutPlanSchema
);
schemaRegistry.register(
  'createWorkoutSession',
  workoutSchemas.createWorkoutSessionSchema
);
schemaRegistry.register(
  'updateWorkoutSession',
  workoutSchemas.updateWorkoutSessionSchema
);
schemaRegistry.register(
  'createProgressMeasurement',
  workoutSchemas.createProgressMeasurementSchema
);
schemaRegistry.register(
  'updateProgressMeasurement',
  workoutSchemas.updateProgressMeasurementSchema
);
