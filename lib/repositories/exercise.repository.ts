/**
 * Exercise Repository Implementation
 * Provides data access layer for exercises with fitness-specific queries
 * Extends BaseRepository with exercise domain operations
 */

import { AbstractBaseRepository, type BaseEntity, type QueryOptions, type QueryFilters } from './base.repository';
import type { Exercise, ExerciseFilters, CreateExerciseRequest, UpdateExerciseRequest, ExerciseType } from '@/types/workouts';
import type { FitnessLevel } from '@/types/index';

// Extend BaseEntity for Exercise to ensure compatibility
export interface ExerciseEntity extends BaseEntity, Exercise {}

// Repository interface defining exercise specific operations
export interface ExerciseRepository {
  // Base CRUD operations
  findById(id: string, options?: QueryOptions): Promise<ExerciseEntity | null>;
  findMany(filters?: QueryFilters, options?: QueryOptions): Promise<ExerciseEntity[]>;
  create(data: Omit<ExerciseEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseEntity>;
  update(id: string, data: Partial<Omit<ExerciseEntity, 'id' | 'createdAt'>>): Promise<ExerciseEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: QueryFilters): Promise<number>;

  // Exercise specific queries
  findByUserId(userId: string, options?: QueryOptions): Promise<ExerciseEntity[]>;
  findByType(exerciseType: ExerciseType, options?: QueryOptions): Promise<ExerciseEntity[]>;
  findByMuscleGroup(muscleGroup: string, options?: QueryOptions): Promise<ExerciseEntity[]>;
  findByDifficultyLevel(level: FitnessLevel, options?: QueryOptions): Promise<ExerciseEntity[]>;
  findByEquipment(equipmentIds: string[], options?: QueryOptions): Promise<ExerciseEntity[]>;
  findPublic(options?: QueryOptions): Promise<ExerciseEntity[]>;
  findVerified(options?: QueryOptions): Promise<ExerciseEntity[]>;
  findByOrganizationId(orgId: string, options?: QueryOptions): Promise<ExerciseEntity[]>;
  search(query: string, options?: QueryOptions): Promise<ExerciseEntity[]>;

  // Exercise specific operations
  updateVerificationStatus(id: string, isVerified: boolean): Promise<ExerciseEntity>;
  updateActiveStatus(id: string, isActive: boolean): Promise<ExerciseEntity>;
}

/**
 * Concrete implementation of ExerciseRepository
 */
export class ExerciseRepositoryImpl extends AbstractBaseRepository<ExerciseEntity> implements ExerciseRepository {
  constructor() {
    super('exercise_library');
  }

  /**
   * Map domain entity to database row
   */
  protected mapToDatabase(entity: unknown): Record<string, unknown> {
    const exercise = entity as ExerciseEntity;
    return {
      id: exercise.id,
      name: exercise.name,
      slug: exercise.slug,
      description: exercise.description,
      instructions: exercise.instructions,
      exercise_type: exercise.exerciseType,
      primary_muscle_groups: JSON.stringify(exercise.primaryMuscleGroups),
      secondary_muscle_groups: JSON.stringify(exercise.secondaryMuscleGroups),
      difficulty_level: exercise.difficultyLevel,
      equipment_required: JSON.stringify(exercise.equipmentRequired),
      equipment_optional: JSON.stringify(exercise.equipmentOptional),
      equipment_alternatives: JSON.stringify(exercise.equipmentAlternatives),
      default_sets: exercise.defaultSets || null,
      default_reps_min: exercise.defaultRepsMin || null,
      default_reps_max: exercise.defaultRepsMax || null,
      default_weight_percentage: exercise.defaultWeightPercentage || null,
      default_rest_seconds: exercise.defaultRestSeconds || null,
      default_duration_seconds: exercise.defaultDurationSeconds || null,
      demo_video_url: exercise.demoVideoUrl || null,
      demo_image_url: exercise.demoImageUrl || null,
      instruction_images: JSON.stringify(exercise.instructionImages),
      contraindications: JSON.stringify(exercise.contraindications),
      modifications: JSON.stringify(exercise.modifications),
      safety_tips: JSON.stringify(exercise.safetyTips),
      created_by: exercise.createdBy || null,
      organization_id: exercise.organizationId || null,
      is_verified: exercise.isVerified,
      is_public: exercise.isPublic,
      is_active: exercise.isActive,
      created_at: exercise.createdAt,
      updated_at: exercise.updatedAt,
    };
  }

  /**
   * Map database row to domain entity
   */
  protected mapFromDatabase(row: unknown): ExerciseEntity {
    const dbRow = row as Record<string, unknown>;
    
    // Helper function to safely parse JSONB or JSON string data
    const parseJsonData = (value: unknown, defaultValue: any = []): any => {
      if (value === null || value === undefined) return defaultValue;
      if (typeof value === 'object') return value; // Already parsed JSONB
      if (typeof value === 'string') {
        try {
          return JSON.parse(value); // Parse JSON string
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    };
    
    return {
      id: dbRow.id as string,
      name: dbRow.name as string,
      slug: dbRow.slug as string,
      description: dbRow.description as string,
      instructions: dbRow.instructions as string,
      exerciseType: dbRow.exercise_type as ExerciseType,
      primaryMuscleGroups: parseJsonData(dbRow.primary_muscle_groups, []),
      secondaryMuscleGroups: parseJsonData(dbRow.secondary_muscle_groups, []),
      difficultyLevel: dbRow.difficulty_level as FitnessLevel,
      equipmentRequired: parseJsonData(dbRow.equipment_required, []),
      equipmentOptional: parseJsonData(dbRow.equipment_optional, []),
      equipmentAlternatives: parseJsonData(dbRow.equipment_alternatives, {}),
      defaultSets: dbRow.default_sets as number | undefined,
      defaultRepsMin: dbRow.default_reps_min as number | undefined,
      defaultRepsMax: dbRow.default_reps_max as number | undefined,
      defaultWeightPercentage: dbRow.default_weight_percentage as number | undefined,
      defaultRestSeconds: dbRow.default_rest_seconds as number | undefined,
      defaultDurationSeconds: dbRow.default_duration_seconds as number | undefined,
      demoVideoUrl: dbRow.demo_video_url as string | undefined,
      demoImageUrl: dbRow.demo_image_url as string | undefined,
      instructionImages: parseJsonData(dbRow.instruction_images, []),
      contraindications: parseJsonData(dbRow.contraindications, []),
      modifications: parseJsonData(dbRow.modifications, {}),
      safetyTips: parseJsonData(dbRow.safety_tips, []),
      createdBy: dbRow.created_by as string | undefined,
      organizationId: dbRow.organization_id as string | undefined,
      isVerified: dbRow.is_verified as boolean,
      isPublic: dbRow.is_public as boolean,
      isActive: dbRow.is_active as boolean,
      createdAt: dbRow.created_at as Date,
      updatedAt: dbRow.updated_at as Date,
    };
  }

  /**
   * Find exercises by user ID
   */
  async findByUserId(userId: string, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ created_by: userId }, options);
  }

  /**
   * Find exercises by type
   */
  async findByType(exerciseType: ExerciseType, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ exercise_type: exerciseType }, options);
  }

  /**
   * Find exercises by muscle group
   */
  async findByMuscleGroup(muscleGroup: string, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    try {
      // Use direct optimized connection for JSONB queries to avoid parameter conflicts
      const { optimizedDb } = await import('../db/optimized-connection');
      
      const limit = options.limit || 100;
      const offset = ((options.page || 1) - 1) * limit;
      const orderBy = options.sortBy || 'name';
      const orderDirection = options.sortOrder || 'ASC';
      
      // Use template literal syntax directly with Neon to handle JSONB operators properly
      const result = await optimizedDb.executeRawQuery<any>(
        `SELECT * FROM exercise_library
         WHERE (primary_muscle_groups @> $1 OR secondary_muscle_groups @> $1)
         ORDER BY ${orderBy} ${orderDirection}
         LIMIT ${limit} OFFSET ${offset}`,
        [JSON.stringify([muscleGroup])]
      );
      
      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('FIND_BY_MUSCLE_GROUP_FAILED',
        `Failed to find exercises by muscle group: ${muscleGroup}`, error);
    }
  }

  /**
   * Find exercises by difficulty level
   */
  async findByDifficultyLevel(level: FitnessLevel, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ difficulty_level: level }, options);
  }

  /**
   * Find exercises by equipment
   */
  async findByEquipment(equipmentIds: string[], options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    // This requires custom SQL due to jsonb operator
    try {
      const { orderClause } = this.buildOrderClause(options);
      const { limitClause, limitParams } = this.buildLimitClause(options, 2);
      
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE equipment_required::jsonb ?| $1
        ${orderClause}
        ${limitClause}
      `.trim();

      const allParams = [equipmentIds, ...limitParams];
      const result = await this.db.executeQuery<any>(sql, allParams);
      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('FIND_BY_EQUIPMENT_FAILED',
        `Failed to find exercises by equipment`, error);
    }
  }

  /**
   * Find public exercises
   */
  async findPublic(options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ is_public: true, is_active: true }, options);
  }

  /**
   * Find verified exercises
   */
  async findVerified(options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ is_verified: true, is_active: true }, options);
  }

  /**
   * Find exercises by organization ID
   */
  async findByOrganizationId(orgId: string, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    return this.findMany({ organization_id: orgId }, options);
  }

  /**
   * Search exercises by name, description, or instructions
   */
  async search(query: string, options: QueryOptions = {}): Promise<ExerciseEntity[]> {
    try {
      const { orderClause } = this.buildOrderClause(options);
      const { limitClause, limitParams } = this.buildLimitClause(options, 2);
      
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE (
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          instructions ILIKE $1 OR
          primary_muscle_groups::text ILIKE $1 OR
          secondary_muscle_groups::text ILIKE $1
        )
        ${orderClause}
        ${limitClause}
      `.trim();

      const allParams = [`%${query}%`, ...limitParams];
      const result = await this.db.executeQuery<any>(sql, allParams);
      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('SEARCH_FAILED',
        `Failed to search exercises`, error);
    }
  }

  /**
   * Update verification status
   */
  async updateVerificationStatus(id: string, isVerified: boolean): Promise<ExerciseEntity> {
    return this.update(id, { isVerified } as Partial<ExerciseEntity>);
  }

  /**
   * Update active status
   */
  async updateActiveStatus(id: string, isActive: boolean): Promise<ExerciseEntity> {
    return this.update(id, { isActive } as Partial<ExerciseEntity>);
  }
}

// Export singleton instance
export const exerciseRepository = new ExerciseRepositoryImpl();
export default exerciseRepository;