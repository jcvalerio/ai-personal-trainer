/**
 * Workout Service
 * Handles all workout plan and session operations
 */

import {
  BaseService,
  ServiceContext,
  ServiceResult,
  PaginationParams,
  PaginatedResult,
} from './base';
import {
  WorkoutPlan,
  WorkoutSession,
  SessionExercise,
  CreateWorkoutPlanRequest,
  CreateWorkoutSessionRequest,
  UpdateWorkoutPlanRequest,
  UpdateWorkoutSessionRequest,
  WorkoutPlanFilters,
  WorkoutSessionFilters,
} from '@/types/workouts';

export class WorkoutService extends BaseService {
  constructor() {
    super('workout_service');
  }

  // Workout Plan Operations

  /**
   * Create a new workout plan
   */
  async createWorkoutPlan(
    data: CreateWorkoutPlanRequest,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutPlan>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(data, [
        'name',
        'durationWeeks',
        'sessionsPerWeek',
        'fitnessGoals',
      ]);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        const planResult = await client`
          INSERT INTO workout_plans (
            user_id,
            organization_id,
            name,
            description,
            duration_weeks,
            sessions_per_week,
            fitness_goals,
            target_fitness_level,
            estimated_session_duration,
            plan_data,
            weekly_schedule,
            progression_rules,
            ai_prompt_used,
            ai_model_version,
            ai_generation_id,
            generation_parameters,
            is_template,
            template_category,
            is_public
          ) VALUES (
            (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}),
            ${context.organizationId || null},
            ${sanitizedData.name},
            ${sanitizedData.description || null},
            ${sanitizedData.durationWeeks},
            ${sanitizedData.sessionsPerWeek},
            ${JSON.stringify(sanitizedData.fitnessGoals)},
            ${sanitizedData.targetFitnessLevel || 'beginner'},
            ${sanitizedData.estimatedSessionDuration || null},
            ${JSON.stringify(sanitizedData.planData || {})},
            ${JSON.stringify(sanitizedData.weeklySchedule || {})},
            ${JSON.stringify(sanitizedData.progressionRules || {})},
            ${sanitizedData.aiPromptUsed || null},
            ${sanitizedData.aiModelVersion || null},
            ${sanitizedData.aiGenerationId || null},
            ${JSON.stringify(sanitizedData.generationParameters || {})},
            ${sanitizedData.isTemplate || false},
            ${sanitizedData.templateCategory || null},
            ${sanitizedData.isPublic || false}
          )
          RETURNING *
        `;

        if (planResult.length === 0) {
          throw new Error('Failed to create workout plan');
        }

        return this.mapWorkoutPlanFromDb(planResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent('plan_created', 'Workout plan created', context, {
        planId: result.data.id,
      });

      return this.createSuccessResult(
        result.data,
        'Workout plan created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createWorkoutPlan');
    }
  }

  /**
   * Get workout plans for a user
   */
  async getWorkoutPlans(
    context: ServiceContext,
    filters?: WorkoutPlanFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<WorkoutPlan>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } = this.buildWorkoutPlanFilters(
        filters,
        context
      );
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 10);
      const limit = pagination?.limit || 10;
      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'desc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT wp.*, up.display_name as creator_name
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        ${whereClause}
        ORDER BY wp.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const plans = result.map((row) => this.mapWorkoutPlanFromDb(row));
      const paginatedResult = this.applyPagination(
        plans,
        total,
        pagination || {}
      );

      await this.logEvent('plans_accessed', 'Workout plans accessed', context);

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getWorkoutPlans');
    }
  }

  /**
   * Get a specific workout plan by ID
   */
  async getWorkoutPlan(
    planId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutPlan>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        SELECT wp.*, up.display_name as creator_name
        FROM workout_plans wp
        JOIN user_profiles up ON wp.user_id = up.id
        WHERE wp.id = ${planId} AND wp.is_active = true
      `;

      if (result.length === 0) {
        return this.createErrorResult('Workout plan not found', 'NOT_FOUND');
      }

      const plan = this.mapWorkoutPlanFromDb(result[0]);

      // Check access permissions
      const hasAccess = await this.checkResourceAccess(
        plan.userId,
        context,
        true
      );
      if (!hasAccess && !plan.isPublic) {
        return this.createErrorResult('Access denied', 'UNAUTHORIZED');
      }

      await this.logEvent('plan_accessed', 'Workout plan accessed', context, {
        planId,
      });

      return this.createSuccessResult(plan);
    } catch (error) {
      return this.handleError(error, 'getWorkoutPlan');
    }
  }

  /**
   * Update a workout plan
   */
  async updateWorkoutPlan(
    planId: string,
    data: UpdateWorkoutPlanRequest,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutPlan>> {
    try {
      this.validateContext(context);

      // Check if plan exists and user has access
      const existingPlan = await this.getWorkoutPlan(planId, context);
      if (!existingPlan.success || !existingPlan.data) {
        return existingPlan;
      }

      if (existingPlan.data.userId !== context.userId) {
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
        'durationWeeks',
        'sessionsPerWeek',
        'fitnessGoals',
        'targetFitnessLevel',
        'estimatedSessionDuration',
        'planData',
        'weeklySchedule',
        'progressionRules',
        'status',
        'isTemplate',
        'templateCategory',
        'isPublic',
      ];

      updateFields.forEach((field) => {
        const dbField = this.camelToSnakeCase(field);
        if (sanitizedData[field] !== undefined) {
          if (
            [
              'fitnessGoals',
              'planData',
              'weeklySchedule',
              'progressionRules',
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
          existingPlan.data,
          'No changes to update'
        );
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      updates.push(`version = version + 1`);
      values.push(planId);

      const result = await this.db.queryRaw(
        `
        UPDATE workout_plans 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `,
        values
      );

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to update workout plan',
          'UPDATE_FAILED'
        );
      }

      const updatedPlan = this.mapWorkoutPlanFromDb(result[0]);

      await this.logEvent('plan_updated', 'Workout plan updated', context, {
        planId,
        updatedFields: Object.keys(sanitizedData),
      });

      return this.createSuccessResult(
        updatedPlan,
        'Workout plan updated successfully'
      );
    } catch (error) {
      return this.handleError(error, 'updateWorkoutPlan');
    }
  }

  /**
   * Delete (soft delete) a workout plan
   */
  async deleteWorkoutPlan(
    planId: string,
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context);

      // Check if plan exists and user has access
      const existingPlan = await this.getWorkoutPlan(planId, context);
      if (!existingPlan.success || !existingPlan.data) {
        return this.createErrorResult('Workout plan not found', 'NOT_FOUND');
      }

      if (existingPlan.data.userId !== context.userId) {
        return this.createErrorResult('Access denied', 'UNAUTHORIZED');
      }

      const result = await this.db`
        UPDATE workout_plans 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${planId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to delete workout plan',
          'DELETE_FAILED'
        );
      }

      await this.logEvent('plan_deleted', 'Workout plan deleted', context, {
        planId,
      });

      return this.createSuccessResult(
        true,
        'Workout plan deleted successfully'
      );
    } catch (error) {
      return this.handleError(error, 'deleteWorkoutPlan');
    }
  }

  // Workout Session Operations

  /**
   * Create a new workout session
   */
  async createWorkoutSession(
    data: CreateWorkoutSessionRequest,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(data, ['name', 'scheduledDate']);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        const sessionResult = await client`
          INSERT INTO workout_sessions (
            user_id,
            organization_id,
            workout_plan_id,
            name,
            session_type,
            scheduled_date,
            scheduled_time,
            scheduled_duration,
            session_data,
            warm_up_exercises,
            main_exercises,
            cool_down_exercises
          ) VALUES (
            (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}),
            ${context.organizationId || null},
            ${sanitizedData.workoutPlanId || null},
            ${sanitizedData.name},
            ${sanitizedData.sessionType || 'workout'},
            ${sanitizedData.scheduledDate},
            ${sanitizedData.scheduledTime || null},
            ${sanitizedData.scheduledDuration || null},
            ${JSON.stringify(sanitizedData.sessionData || {})},
            ${JSON.stringify(sanitizedData.warmUpExercises || [])},
            ${JSON.stringify(sanitizedData.mainExercises || [])},
            ${JSON.stringify(sanitizedData.coolDownExercises || [])}
          )
          RETURNING *
        `;

        if (sessionResult.length === 0) {
          throw new Error('Failed to create workout session');
        }

        return this.mapWorkoutSessionFromDb(sessionResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent(
        'session_created',
        'Workout session created',
        context,
        { sessionId: result.data.id }
      );

      return this.createSuccessResult(
        result.data,
        'Workout session created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createWorkoutSession');
    }
  }

  /**
   * Get workout sessions for a user
   */
  async getWorkoutSessions(
    context: ServiceContext,
    filters?: WorkoutSessionFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<WorkoutSession>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } = this.buildWorkoutSessionFilters(
        filters,
        context
      );
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 10);
      const limit = pagination?.limit || 10;
      const sortBy = pagination?.sortBy || 'scheduled_date';
      const sortOrder = pagination?.sortOrder || 'desc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT ws.*, up.display_name as user_name, wp.name as plan_name
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        ${whereClause}
        ORDER BY ws.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const sessions = result.map((row) => this.mapWorkoutSessionFromDb(row));
      const paginatedResult = this.applyPagination(
        sessions,
        total,
        pagination || {}
      );

      await this.logEvent(
        'sessions_accessed',
        'Workout sessions accessed',
        context
      );

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getWorkoutSessions');
    }
  }

  /**
   * Get a specific workout session by ID
   */
  async getWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        SELECT ws.*, up.display_name as user_name, wp.name as plan_name
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        WHERE ws.id = ${sessionId} AND ws.is_active = true
      `;

      if (result.length === 0) {
        return this.createErrorResult('Workout session not found', 'NOT_FOUND');
      }

      const session = this.mapWorkoutSessionFromDb(result[0]);

      // Check access permissions
      const hasAccess = await this.checkResourceAccess(
        session.userId,
        context,
        true
      );
      if (!hasAccess) {
        return this.createErrorResult('Access denied', 'UNAUTHORIZED');
      }

      await this.logEvent(
        'session_accessed',
        'Workout session accessed',
        context,
        { sessionId }
      );

      return this.createSuccessResult(session);
    } catch (error) {
      return this.handleError(error, 'getWorkoutSession');
    }
  }

  /**
   * Start a workout session
   */
  async startWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return sessionResult;
      }

      if (sessionResult.data.status === 'in_progress') {
        return this.createErrorResult(
          'Session is already in progress',
          'INVALID_STATE'
        );
      }

      if (sessionResult.data.status === 'completed') {
        return this.createErrorResult(
          'Session is already completed',
          'INVALID_STATE'
        );
      }

      const result = await this.db`
        UPDATE workout_sessions 
        SET status = 'in_progress', 
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
        RETURNING *
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to start session',
          'UPDATE_FAILED'
        );
      }

      const updatedSession = this.mapWorkoutSessionFromDb(result[0]);

      await this.logEvent(
        'session_started',
        'Workout session started',
        context,
        { sessionId }
      );

      return this.createSuccessResult(
        updatedSession,
        'Workout session started successfully'
      );
    } catch (error) {
      return this.handleError(error, 'startWorkoutSession');
    }
  }

  /**
   * Complete a workout session
   */
  async completeWorkoutSession(
    sessionId: string,
    data: {
      effortRating?: number;
      energyLevelAfter?: number;
      userNotes?: string;
    },
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return sessionResult;
      }

      if (sessionResult.data.status === 'completed') {
        return this.createErrorResult(
          'Session is already completed',
          'INVALID_STATE'
        );
      }

      const sanitizedData = this.sanitizeInput(data);
      const actualDuration = sessionResult.data.startedAt
        ? Math.round(
            (Date.now() - new Date(sessionResult.data.startedAt).getTime()) /
              (1000 * 60)
          )
        : null;

      const result = await this.db`
        UPDATE workout_sessions 
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            completion_percentage = 100,
            actual_duration = ${actualDuration},
            effort_rating = ${sanitizedData.effortRating || null},
            energy_level_after = ${sanitizedData.energyLevelAfter || null},
            user_notes = ${sanitizedData.userNotes || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
        RETURNING *
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to complete session',
          'UPDATE_FAILED'
        );
      }

      const completedSession = this.mapWorkoutSessionFromDb(result[0]);

      await this.logEvent(
        'session_completed',
        'Workout session completed',
        context,
        {
          sessionId,
          duration: actualDuration,
        }
      );

      return this.createSuccessResult(
        completedSession,
        'Workout session completed successfully'
      );
    } catch (error) {
      return this.handleError(error, 'completeWorkoutSession');
    }
  }

  // Helper Methods

  private buildWorkoutPlanFilters(
    filters: WorkoutPlanFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = ['wp.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    // Always filter by user or organization
    conditions.push(
      `(wp.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++})`
    );
    values.push(context.userId);

    if (context.organizationId) {
      conditions.push(`OR wp.organization_id = $${paramIndex++}`);
      values.push(context.organizationId);
    }

    conditions.push('OR wp.is_public = true)');

    if (filters.status) {
      conditions.push(`wp.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.isTemplate !== undefined) {
      conditions.push(`wp.is_template = $${paramIndex++}`);
      values.push(filters.isTemplate);
    }

    if (filters.targetFitnessLevel) {
      conditions.push(`wp.target_fitness_level = $${paramIndex++}`);
      values.push(filters.targetFitnessLevel);
    }

    if (filters.search) {
      conditions.push(
        `(wp.name ILIKE $${paramIndex++} OR wp.description ILIKE $${paramIndex++})`
      );
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private buildWorkoutSessionFilters(
    filters: WorkoutSessionFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = ['ws.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    // Always filter by user or organization access
    conditions.push(
      `ws.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++})`
    );
    values.push(context.userId);

    if (filters.status) {
      conditions.push(`ws.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.workoutPlanId) {
      conditions.push(`ws.workout_plan_id = $${paramIndex++}`);
      values.push(filters.workoutPlanId);
    }

    if (filters.dateFrom) {
      conditions.push(`ws.scheduled_date >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`ws.scheduled_date <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }

    if (filters.sessionType) {
      conditions.push(`ws.session_type = $${paramIndex++}`);
      values.push(filters.sessionType);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private mapWorkoutPlanFromDb(row: any): WorkoutPlan {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      durationWeeks: row.duration_weeks,
      sessionsPerWeek: row.sessions_per_week,
      fitnessGoals: row.fitness_goals || [],
      targetFitnessLevel: row.target_fitness_level,
      estimatedSessionDuration: row.estimated_session_duration,
      aiPromptUsed: row.ai_prompt_used,
      aiModelVersion: row.ai_model_version,
      aiGenerationId: row.ai_generation_id,
      generationParameters: row.generation_parameters || {},
      planData: row.plan_data || {},
      weeklySchedule: row.weekly_schedule || {},
      progressionRules: row.progression_rules || {},
      status: row.status,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      version: row.version,
      parentPlanId: row.parent_plan_id,
      isTemplate: row.is_template,
      templateCategory: row.template_category,
      isPublic: row.is_public,
      isFeatured: row.is_featured,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapWorkoutSessionFromDb(row: any): WorkoutSession {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      workoutPlanId: row.workout_plan_id,
      name: row.name,
      sessionType: row.session_type,
      scheduledDate: new Date(row.scheduled_date),
      scheduledTime: row.scheduled_time,
      scheduledDuration: row.scheduled_duration,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      actualDuration: row.actual_duration,
      sessionData: row.session_data || {},
      warmUpExercises: row.warm_up_exercises || [],
      mainExercises: row.main_exercises || [],
      coolDownExercises: row.cool_down_exercises || [],
      completionPercentage: row.completion_percentage,
      effortRating: row.effort_rating,
      energyLevelBefore: row.energy_level_before,
      energyLevelAfter: row.energy_level_after,
      status: row.status,
      equipmentUsed: row.equipment_used || [],
      gymLocation: row.gym_location,
      userNotes: row.user_notes,
      aiFeedback: row.ai_feedback,
      trainerNotes: row.trainer_notes,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export default WorkoutService;
