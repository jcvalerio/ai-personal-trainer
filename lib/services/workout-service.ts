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
            ${sanitizedData.fitnessGoals},
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

      // Access already verified by getWorkoutPlan above - if we got here, user has access

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
        'startedAt',
        'completedAt',
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
          } else if (['startedAt', 'completedAt'].includes(field)) {
            // Handle date fields - convert to ISO string for PostgreSQL
            updates.push(`${dbField} = $${paramIndex++}`);
            const dateValue = sanitizedData[field] instanceof Date 
              ? sanitizedData[field] 
              : sanitizedData[field] ? new Date(sanitizedData[field]) : null;
            values.push(dateValue ? dateValue.toISOString() : null);
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
      
      // Map camelCase field names to database column names
      const fieldMappings: Record<string, string> = {
        scheduledDate: 'scheduled_date',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        userId: 'user_id',
        workoutPlanId: 'workout_plan_id',
        organizationId: 'organization_id'
      };
      
      const sortBy = fieldMappings[pagination?.sortBy || ''] || pagination?.sortBy || 'scheduled_date';
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
   * Pause a workout session
   */
  async pauseWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return sessionResult;
      }

      if (sessionResult.data.status !== 'in_progress') {
        return this.createErrorResult(
          'Session must be in progress to pause',
          'INVALID_STATE'
        );
      }

      const result = await this.db`
        UPDATE workout_sessions 
        SET status = 'paused',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
        RETURNING *
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to pause session',
          'UPDATE_FAILED'
        );
      }

      const pausedSession = this.mapWorkoutSessionFromDb(result[0]);

      await this.logEvent(
        'session_paused',
        'Workout session paused',
        context,
        { sessionId }
      );

      return this.createSuccessResult(
        pausedSession,
        'Workout session paused successfully'
      );
    } catch (error) {
      return this.handleError(error, 'pauseWorkoutSession');
    }
  }

  /**
   * Resume a workout session
   */
  async resumeWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return sessionResult;
      }

      if (sessionResult.data.status !== 'paused') {
        return this.createErrorResult(
          'Session must be paused to resume',
          'INVALID_STATE'
        );
      }

      const result = await this.db`
        UPDATE workout_sessions 
        SET status = 'in_progress',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sessionId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
        RETURNING *
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Failed to resume session',
          'UPDATE_FAILED'
        );
      }

      const resumedSession = this.mapWorkoutSessionFromDb(result[0]);

      await this.logEvent(
        'session_resumed',
        'Workout session resumed',
        context,
        { sessionId }
      );

      return this.createSuccessResult(
        resumedSession,
        'Workout session resumed successfully'
      );
    } catch (error) {
      return this.handleError(error, 'resumeWorkoutSession');
    }
  }

  /**
   * Record set performance data
   */
  async recordSetPerformance(
    sessionId: string,
    exerciseId: string,
    setData: {
      setIndex: number;
      reps: number;
      weight?: number;
      distance?: number;
      duration?: number;
      perceivedExertion?: number;
      formRating?: number;
      notes?: string;
      completedAt?: Date;
    },
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(setData, ['setIndex', 'reps']);

      // Verify session exists and user has access
      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return this.createErrorResult('Session not found', 'NOT_FOUND');
      }

      const sanitizedData = this.sanitizeInput(setData);

      const result = await this.executeWithTransaction(async (client) => {
        // Check if session_exercise record exists
        const exerciseResult = await client`
          SELECT id, set_data 
          FROM session_exercises 
          WHERE session_id = ${sessionId} 
            AND exercise_id = ${exerciseId}
        `;

        let sessionExerciseId: string;
        let existingSetData: any[] = [];

        if (exerciseResult.length === 0) {
          // Create new session_exercise record
          const newExerciseResult = await client`
            INSERT INTO session_exercises (
              session_id,
              exercise_id,
              order_index,
              exercise_phase,
              set_data,
              status
            ) VALUES (
              ${sessionId},
              ${exerciseId},
              0,
              'main',
              ${JSON.stringify([])},
              'in_progress'
            )
            RETURNING id
          `;
          sessionExerciseId = newExerciseResult[0].id;
        } else {
          sessionExerciseId = exerciseResult[0].id;
          existingSetData = exerciseResult[0].set_data || [];
        }

        // Update or add set data
        const newSetData = {
          setIndex: sanitizedData.setIndex,
          reps: sanitizedData.reps,
          weight: sanitizedData.weight || null,
          distance: sanitizedData.distance || null,
          duration: sanitizedData.duration || null,
          perceivedExertion: sanitizedData.perceivedExertion || null,
          formRating: sanitizedData.formRating || null,
          notes: sanitizedData.notes || null,
          completedAt: sanitizedData.completedAt || new Date(),
        };

        // Find existing set or add new one
        const existingSetIndex = existingSetData.findIndex(
          (set: any) => set.setIndex === sanitizedData.setIndex
        );

        if (existingSetIndex >= 0) {
          existingSetData[existingSetIndex] = newSetData;
        } else {
          existingSetData.push(newSetData);
        }

        // Sort by setIndex
        existingSetData.sort((a: any, b: any) => a.setIndex - b.setIndex);

        // Update session_exercise with new set data
        await client`
          UPDATE session_exercises 
          SET set_data = ${JSON.stringify(existingSetData)},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${sessionExerciseId}
        `;

        return true;
      });

      if (!result.success) {
        return result;
      }

      await this.logEvent(
        'set_recorded',
        'Set performance recorded',
        context,
        {
          sessionId,
          exerciseId,
          setIndex: sanitizedData.setIndex,
        }
      );

      return this.createSuccessResult(
        true,
        'Set performance recorded successfully'
      );
    } catch (error) {
      return this.handleError(error, 'recordSetPerformance');
    }
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    progressData: {
      currentExerciseIndex?: number;
      currentSet?: number;
      elapsedTime?: number;
      exercisesCompleted?: number;
      setsCompleted?: number;
      totalVolume?: number;
      completionPercentage?: number;
    },
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context);

      // Verify session exists and user has access
      const sessionResult = await this.getWorkoutSession(sessionId, context);
      if (!sessionResult.success || !sessionResult.data) {
        return this.createErrorResult('Session not found', 'NOT_FOUND');
      }

      if (sessionResult.data.status !== 'in_progress') {
        return this.createErrorResult(
          'Can only update progress for active sessions',
          'INVALID_STATE'
        );
      }

      const sanitizedData = this.sanitizeInput(progressData);
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (sanitizedData.elapsedTime !== undefined) {
        updates.push(`actual_duration = $${paramIndex++}`);
        values.push(Math.round(sanitizedData.elapsedTime / (1000 * 60))); // Convert to minutes
      }

      if (sanitizedData.completionPercentage !== undefined) {
        updates.push(`completion_percentage = $${paramIndex++}`);
        values.push(sanitizedData.completionPercentage);
      }

      // Update session_data with progress information
      const currentSessionData = sessionResult.data.sessionData || {};
      const updatedSessionData = {
        ...currentSessionData,
        progress: {
          ...currentSessionData.progress,
          currentExerciseIndex: sanitizedData.currentExerciseIndex,
          currentSet: sanitizedData.currentSet,
          elapsedTime: sanitizedData.elapsedTime,
          exercisesCompleted: sanitizedData.exercisesCompleted,
          setsCompleted: sanitizedData.setsCompleted,
          totalVolume: sanitizedData.totalVolume,
          lastUpdated: new Date().toISOString(),
        },
      };

      updates.push(`session_data = $${paramIndex++}`);
      values.push(JSON.stringify(updatedSessionData));

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add WHERE clause parameters
      values.push(sessionId);
      values.push(context.userId);

      if (updates.length > 1) {
        // Only proceed if there are actual updates
        const result = await this.db.queryRaw(
          `
          UPDATE workout_sessions 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex++} AND user_id = (
            SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++}
          )
        `,
          values
        );

        if (result.length === 0) {
          return this.createErrorResult(
            'Failed to update session progress',
            'UPDATE_FAILED'
          );
        }
      }

      await this.logEvent(
        'session_progress_updated',
        'Session progress updated',
        context,
        {
          sessionId,
          completionPercentage: sanitizedData.completionPercentage,
        }
      );

      return this.createSuccessResult(
        true,
        'Session progress updated successfully'
      );
    } catch (error) {
      return this.handleError(error, 'updateSessionProgress');
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
      totalVolume?: number;
      exercisesCompleted?: number;
      setsCompleted?: number;
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
        : 1; // Minimum duration of 1 minute to satisfy constraint

      // Get session exercises to calculate final stats
      const sessionExercises = await this.db`
        SELECT set_data, exercise_id
        FROM session_exercises
        WHERE session_id = ${sessionId}
      `;

      // Calculate final metrics from actual performance
      let totalVolume = 0;
      let totalSets = 0;
      let exercisesCompleted = 0;

      sessionExercises.forEach((exercise: any) => {
        const setData = exercise.set_data || [];
        if (setData.length > 0) {
          exercisesCompleted++;
          totalSets += setData.length;
          setData.forEach((set: any) => {
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
            }
          });
        }
      });

      // Update session_data with final metrics
      const currentSessionData = sessionResult.data.sessionData || {};
      const finalSessionData = {
        ...currentSessionData,
        finalStats: {
          totalVolume: sanitizedData.totalVolume || totalVolume,
          exercisesCompleted: sanitizedData.exercisesCompleted || exercisesCompleted,
          setsCompleted: sanitizedData.setsCompleted || totalSets,
          completedAt: new Date().toISOString(),
        },
      };

      const result = await this.db`
        UPDATE workout_sessions 
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            completion_percentage = 100,
            actual_duration = ${actualDuration},
            effort_rating = ${sanitizedData.effortRating || null},
            energy_level_after = ${sanitizedData.energyLevelAfter || null},
            user_notes = ${sanitizedData.userNotes || null},
            session_data = ${JSON.stringify(finalSessionData)},
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
          totalVolume: totalVolume,
          exercisesCompleted: exercisesCompleted,
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
    const userConditions: string[] = [];
    userConditions.push(
      `wp.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++})`
    );
    values.push(context.userId);

    if (context.organizationId) {
      userConditions.push(`wp.organization_id = $${paramIndex++}`);
      values.push(context.organizationId);
    }

    userConditions.push('wp.is_public = true');
    conditions.push(`(${userConditions.join(' OR ')})`);

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

  /**
   * Calculate workout plan progress
   */
  async getWorkoutPlanProgress(
    planId: string,
    context: ServiceContext
  ): Promise<ServiceResult<{
    currentWeek: number;
    completedSessions: number;
    totalSessions: number;
    completionPercentage: number;
    lastCompletedSession?: Date;
    upcomingSessions: number;
  }>> {
    try {
      this.validateContext(context);

      // Get plan details first
      const planResult = await this.getWorkoutPlan(planId, context);
      if (!planResult.success) {
        return planResult as any;
      }

      const plan = planResult.data!;

      // Calculate total expected sessions
      const totalWeeks = plan.durationWeeks;
      const sessionsPerWeek = plan.sessionsPerWeek;
      const totalSessions = totalWeeks * sessionsPerWeek;

      // Get all sessions for this plan
      const sessionsResult = await this.db`
        SELECT 
          status,
          completed_at,
          scheduled_date,
          created_at
        FROM workout_sessions 
        WHERE workout_plan_id = ${planId} 
        AND is_active = true
        ORDER BY scheduled_date ASC
      `;

      // Calculate progress metrics
      const completedSessions = sessionsResult.filter(
        (session) => session.status === 'completed'
      ).length;

      const completionPercentage = Math.round(
        (completedSessions / totalSessions) * 100
      );

      // Find last completed session
      const completedSessionDates = sessionsResult
        .filter((session) => session.status === 'completed' && session.completed_at)
        .map((session) => new Date(session.completed_at))
        .sort((a, b) => b.getTime() - a.getTime());
      
      const lastCompletedSession = completedSessionDates.length > 0 
        ? completedSessionDates[0] 
        : undefined;

      // Calculate current week (based on plan start date or first session)
      let currentWeek = 1;
      if (plan.startedAt) {
        const weeksSinceStart = Math.ceil(
          (Date.now() - new Date(plan.startedAt).getTime()) / 
          (7 * 24 * 60 * 60 * 1000)
        );
        currentWeek = Math.min(Math.max(weeksSinceStart, 1), totalWeeks);
      } else if (sessionsResult.length > 0) {
        // Use first session date as reference
        const firstSessionDate = new Date(sessionsResult[0].created_at);
        const weeksSinceFirst = Math.ceil(
          (Date.now() - firstSessionDate.getTime()) / 
          (7 * 24 * 60 * 60 * 1000)
        );
        currentWeek = Math.min(Math.max(weeksSinceFirst, 1), totalWeeks);
      }

      // Count upcoming sessions (scheduled or in_progress)
      const upcomingSessions = sessionsResult.filter(
        (session) => session.status === 'scheduled' || session.status === 'in_progress'
      ).length;

      const progressData = {
        currentWeek,
        completedSessions,
        totalSessions,
        completionPercentage,
        lastCompletedSession,
        upcomingSessions,
      };

      await this.logEvent('plan_progress_calculated', 'Plan progress calculated', context, {
        planId,
        progressData,
      });

      return this.createSuccessResult(progressData);
    } catch (error) {
      return this.handleError(error, 'getWorkoutPlanProgress');
    }
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export default WorkoutService;
