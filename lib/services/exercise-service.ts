/**
 * Exercise Service
 * Handles exercise library and equipment catalog operations
 */

import {
  BaseService,
  ServiceContext,
  ServiceResult,
  PaginationParams,
  PaginatedResult,
} from './base';
import {
  Exercise,
  Equipment,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ExerciseFilters,
  EquipmentFilters,
} from '@/types/workouts';

export class ExerciseService extends BaseService {
  constructor() {
    super('exercise_service');
  }

  // Exercise Library Operations

  /**
   * Create a new exercise
   */
  async createExercise(
    data: CreateExerciseRequest,
    context: ServiceContext
  ): Promise<ServiceResult<Exercise>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(data, [
        'name',
        'description',
        'instructions',
        'exerciseType',
        'primaryMuscleGroups',
      ]);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        const exerciseResult = await client`
          INSERT INTO exercise_library (
            name,
            description,
            instructions,
            exercise_type,
            primary_muscle_groups,
            secondary_muscle_groups,
            difficulty_level,
            equipment_required,
            equipment_optional,
            equipment_alternatives,
            default_sets,
            default_reps_min,
            default_reps_max,
            default_weight_percentage,
            default_rest_seconds,
            default_duration_seconds,
            demo_video_url,
            demo_image_url,
            instruction_images,
            contraindications,
            modifications,
            safety_tips,
            created_by,
            organization_id,
            is_public
          ) VALUES (
            ${sanitizedData.name},
            ${sanitizedData.description},
            ${sanitizedData.instructions},
            ${sanitizedData.exerciseType},
            ${JSON.stringify(sanitizedData.primaryMuscleGroups)},
            ${JSON.stringify(sanitizedData.secondaryMuscleGroups || [])},
            ${sanitizedData.difficultyLevel || 'beginner'},
            ${JSON.stringify(sanitizedData.equipmentRequired || [])},
            ${JSON.stringify(sanitizedData.equipmentOptional || [])},
            ${JSON.stringify(sanitizedData.equipmentAlternatives || {})},
            ${sanitizedData.defaultSets || null},
            ${sanitizedData.defaultRepsMin || null},
            ${sanitizedData.defaultRepsMax || null},
            ${sanitizedData.defaultWeightPercentage || null},
            ${sanitizedData.defaultRestSeconds || null},
            ${sanitizedData.defaultDurationSeconds || null},
            ${sanitizedData.demoVideoUrl || null},
            ${sanitizedData.demoImageUrl || null},
            ${JSON.stringify(sanitizedData.instructionImages || [])},
            ${JSON.stringify(sanitizedData.contraindications || [])},
            ${JSON.stringify(sanitizedData.modifications || {})},
            ${JSON.stringify(sanitizedData.safetyTips || [])},
            (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}),
            ${context.organizationId || null},
            ${sanitizedData.isPublic !== false} -- Default to true unless explicitly false
          )
          RETURNING *
        `;

        if (exerciseResult.length === 0) {
          throw new Error('Failed to create exercise');
        }

        return this.mapExerciseFromDb(exerciseResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent('exercise_created', 'Exercise created', context, {
        exerciseId: result.data.id,
      });

      return this.createSuccessResult(
        result.data,
        'Exercise created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createExercise');
    }
  }

  /**
   * Get exercises with filtering and pagination
   */
  async getExercises(
    context: ServiceContext,
    filters?: ExerciseFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<Exercise>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } = this.buildExerciseFilters(
        filters,
        context
      );
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 20);
      const limit = pagination?.limit || 20;
      const sortBy = pagination?.sortBy || 'name';
      const sortOrder = pagination?.sortOrder || 'asc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM exercise_library el
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT el.*, up.display_name as creator_name
        FROM exercise_library el
        LEFT JOIN user_profiles up ON el.created_by = up.id
        ${whereClause}
        ORDER BY el.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const exercises = result.map((row) => this.mapExerciseFromDb(row));
      const paginatedResult = this.applyPagination(
        exercises,
        total,
        pagination || {}
      );

      await this.logEvent('exercises_accessed', 'Exercises accessed', context);

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getExercises');
    }
  }

  /**
   * Get a specific exercise by ID
   */
  async getExercise(
    exerciseId: string,
    context: ServiceContext
  ): Promise<ServiceResult<Exercise>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        SELECT el.*, up.display_name as creator_name
        FROM exercise_library el
        LEFT JOIN user_profiles up ON el.created_by = up.id
        WHERE el.id = ${exerciseId} AND el.is_active = true
      `;

      if (result.length === 0) {
        return this.createErrorResult('Exercise not found', 'NOT_FOUND');
      }

      const exercise = this.mapExerciseFromDb(result[0]);

      // Check access permissions
      if (
        !exercise.isPublic &&
        exercise.organizationId &&
        exercise.organizationId !== context.organizationId
      ) {
        return this.createErrorResult('Access denied', 'UNAUTHORIZED');
      }

      await this.logEvent('exercise_accessed', 'Exercise accessed', context, {
        exerciseId,
      });

      return this.createSuccessResult(exercise);
    } catch (error) {
      return this.handleError(error, 'getExercise');
    }
  }

  /**
   * Update an exercise
   */
  async updateExercise(
    exerciseId: string,
    data: UpdateExerciseRequest,
    context: ServiceContext
  ): Promise<ServiceResult<Exercise>> {
    try {
      this.validateContext(context);

      // Check if exercise exists and user has access
      const existingExercise = await this.getExercise(exerciseId, context);
      if (!existingExercise.success || !existingExercise.data) {
        return existingExercise;
      }

      // Only creator or org admin can update
      const canUpdate =
        existingExercise.data.createdBy === context.userId ||
        (context.userRole &&
          ['admin', 'owner', 'gym_admin', 'gym_owner'].includes(
            context.userRole
          ));

      if (!canUpdate) {
        return this.createErrorResult('Access denied', 'UNAUTHORIZED');
      }

      const sanitizedData = this.sanitizeInput(data);
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      const updateFields = [
        'name',
        'description',
        'instructions',
        'exerciseType',
        'primaryMuscleGroups',
        'secondaryMuscleGroups',
        'difficultyLevel',
        'equipmentRequired',
        'equipmentOptional',
        'equipmentAlternatives',
        'defaultSets',
        'defaultRepsMin',
        'defaultRepsMax',
        'defaultWeightPercentage',
        'defaultRestSeconds',
        'defaultDurationSeconds',
        'demoVideoUrl',
        'demoImageUrl',
        'instructionImages',
        'contraindications',
        'modifications',
        'safetyTips',
        'isPublic',
      ];

      updateFields.forEach((field) => {
        const dbField = this.camelToSnakeCase(field);
        if (sanitizedData[field] !== undefined) {
          if (
            [
              'primaryMuscleGroups',
              'secondaryMuscleGroups',
              'equipmentRequired',
              'equipmentOptional',
              'equipmentAlternatives',
              'instructionImages',
              'contraindications',
              'modifications',
              'safetyTips',
            ].includes(field)
          ) {
            updates.push(`${dbField} = $${paramIndex++}`);
            values.push(JSON.stringify(sanitizedData[field]));
          } else {
            updates.push(`${dbField} = $${paramIndex++}`);
            values.push(sanitizedData[field]);
          }
        }
      });

      if (updates.length === 0) {
        return this.createSuccessResult(
          existingExercise.data,
          'No changes to update'
        );
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(exerciseId);

      const result = await this.db.queryRaw(
        `
        UPDATE exercise_library 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `,
        values
      );

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to update exercise',
          'UPDATE_FAILED'
        );
      }

      const updatedExercise = this.mapExerciseFromDb(result[0]);

      await this.logEvent('exercise_updated', 'Exercise updated', context, {
        exerciseId,
        updatedFields: Object.keys(sanitizedData),
      });

      return this.createSuccessResult(
        updatedExercise,
        'Exercise updated successfully'
      );
    } catch (error) {
      return this.handleError(error, 'updateExercise');
    }
  }

  /**
   * Delete (soft delete) an exercise
   */
  async deleteExercise(
    exerciseId: string,
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context, [
        'admin',
        'owner',
        'gym_admin',
        'gym_owner',
      ]);

      const result = await this.db`
        UPDATE exercise_library 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${exerciseId}
        AND (created_by = (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId})
             OR organization_id = ${context.organizationId || null})
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Exercise not found or access denied',
          'NOT_FOUND'
        );
      }

      await this.logEvent('exercise_deleted', 'Exercise deleted', context, {
        exerciseId,
      });

      return this.createSuccessResult(true, 'Exercise deleted successfully');
    } catch (error) {
      return this.handleError(error, 'deleteExercise');
    }
  }

  // Equipment Catalog Operations

  /**
   * Create new equipment
   */
  async createEquipment(
    data: CreateEquipmentRequest,
    context: ServiceContext
  ): Promise<ServiceResult<Equipment>> {
    try {
      this.validateContext(context, [
        'admin',
        'owner',
        'gym_admin',
        'gym_owner',
      ]);
      this.validateRequiredFields(data, ['name', 'category']);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        const equipmentResult = await client`
          INSERT INTO equipment_catalog (
            name,
            description,
            category,
            subcategory,
            manufacturer,
            model,
            dimensions,
            max_users_simultaneously,
            maintenance_interval_days,
            safety_requirements,
            image_url,
            instruction_manual_url,
            demo_video_url
          ) VALUES (
            ${sanitizedData.name},
            ${sanitizedData.description || null},
            ${sanitizedData.category},
            ${sanitizedData.subcategory || null},
            ${sanitizedData.manufacturer || null},
            ${sanitizedData.model || null},
            ${JSON.stringify(sanitizedData.dimensions || {})},
            ${sanitizedData.maxUsersSimultaneously || 1},
            ${sanitizedData.maintenanceIntervalDays || 30},
            ${JSON.stringify(sanitizedData.safetyRequirements || [])},
            ${sanitizedData.imageUrl || null},
            ${sanitizedData.instructionManualUrl || null},
            ${sanitizedData.demoVideoUrl || null}
          )
          RETURNING *
        `;

        if (equipmentResult.length === 0) {
          throw new Error('Failed to create equipment');
        }

        return this.mapEquipmentFromDb(equipmentResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent('equipment_created', 'Equipment created', context, {
        equipmentId: result.data.id,
      });

      return this.createSuccessResult(
        result.data,
        'Equipment created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createEquipment');
    }
  }

  /**
   * Get equipment with filtering and pagination
   */
  async getEquipment(
    context: ServiceContext,
    filters?: EquipmentFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<Equipment>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } =
        this.buildEquipmentFilters(filters);
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 20);
      const limit = pagination?.limit || 20;
      const sortBy = pagination?.sortBy || 'name';
      const sortOrder = pagination?.sortOrder || 'asc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM equipment_catalog ec
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT *
        FROM equipment_catalog ec
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const equipment = result.map((row) => this.mapEquipmentFromDb(row));
      const paginatedResult = this.applyPagination(
        equipment,
        total,
        pagination || {}
      );

      await this.logEvent('equipment_accessed', 'Equipment accessed', context);

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getEquipment');
    }
  }

  // Helper Methods

  private buildExerciseFilters(
    filters: ExerciseFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = ['el.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    // Access control
    conditions.push(
      `(el.is_public = true OR el.organization_id = $${paramIndex++} OR el.created_by = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++}))`
    );
    values.push(context.organizationId || null, context.userId);

    if (filters.exerciseType) {
      conditions.push(`el.exercise_type = $${paramIndex++}`);
      values.push(filters.exerciseType);
    }

    if (filters.difficultyLevel) {
      conditions.push(`el.difficulty_level = $${paramIndex++}`);
      values.push(filters.difficultyLevel);
    }

    if (filters.muscleGroup) {
      conditions.push(
        `(el.primary_muscle_groups @> $${paramIndex++} OR el.secondary_muscle_groups @> $${paramIndex++})`
      );
      values.push(
        JSON.stringify([filters.muscleGroup]),
        JSON.stringify([filters.muscleGroup])
      );
    }

    if (filters.equipmentRequired && filters.equipmentRequired.length > 0) {
      conditions.push(`el.equipment_required && $${paramIndex++}`);
      values.push(JSON.stringify(filters.equipmentRequired));
    }

    if (filters.search) {
      conditions.push(
        `(el.name ILIKE $${paramIndex++} OR el.description ILIKE $${paramIndex++})`
      );
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.isVerified !== undefined) {
      conditions.push(`el.is_verified = $${paramIndex++}`);
      values.push(filters.isVerified);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private buildEquipmentFilters(filters: EquipmentFilters = {}) {
    const conditions: string[] = ['ec.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`ec.category = $${paramIndex++}`);
      values.push(filters.category);
    }

    if (filters.subcategory) {
      conditions.push(`ec.subcategory = $${paramIndex++}`);
      values.push(filters.subcategory);
    }

    if (filters.manufacturer) {
      conditions.push(`ec.manufacturer ILIKE $${paramIndex++}`);
      values.push(`%${filters.manufacturer}%`);
    }

    if (filters.search) {
      conditions.push(
        `(ec.name ILIKE $${paramIndex++} OR ec.description ILIKE $${paramIndex++})`
      );
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private mapExerciseFromDb(row: any): Exercise {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      instructions: row.instructions,
      exerciseType: row.exercise_type,
      primaryMuscleGroups: row.primary_muscle_groups || [],
      secondaryMuscleGroups: row.secondary_muscle_groups || [],
      difficultyLevel: row.difficulty_level,
      equipmentRequired: row.equipment_required || [],
      equipmentOptional: row.equipment_optional || [],
      equipmentAlternatives: row.equipment_alternatives || {},
      defaultSets: row.default_sets,
      defaultRepsMin: row.default_reps_min,
      defaultRepsMax: row.default_reps_max,
      defaultWeightPercentage: row.default_weight_percentage,
      defaultRestSeconds: row.default_rest_seconds,
      defaultDurationSeconds: row.default_duration_seconds,
      demoVideoUrl: row.demo_video_url,
      demoImageUrl: row.demo_image_url,
      instructionImages: row.instruction_images || [],
      contraindications: row.contraindications || [],
      modifications: row.modifications || {},
      safetyTips: row.safety_tips || [],
      createdBy: row.created_by,
      organizationId: row.organization_id,
      isVerified: row.is_verified,
      isPublic: row.is_public,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapEquipmentFromDb(row: any): Equipment {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      manufacturer: row.manufacturer,
      model: row.model,
      dimensions: row.dimensions || {},
      maxUsersSimultaneously: row.max_users_simultaneously,
      maintenanceIntervalDays: row.maintenance_interval_days,
      safetyRequirements: row.safety_requirements || [],
      imageUrl: row.image_url,
      instructionManualUrl: row.instruction_manual_url,
      demoVideoUrl: row.demo_video_url,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export default ExerciseService;
