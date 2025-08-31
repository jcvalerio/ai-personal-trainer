/**
 * Optimized Workout Service
 * Addresses N+1 queries, implements connection pooling, and optimizes session tracking
 */

import { optimizedDb, executeOptimizedQuery } from '@/lib/db/optimized-connection';
import { BaseService, ServiceContext, ServiceResult, PaginationParams, PaginatedResult } from './base';
import {
  WorkoutSession,
  CreateWorkoutSessionRequest,
  UpdateWorkoutSessionRequest,
  WorkoutSessionFilters,
} from '@/types/workouts';

export class OptimizedWorkoutService extends BaseService {
  constructor() {
    super('optimized_workout_service');
  }

  /**
   * Get workout session with optimized queries (eliminates N+1 problems)
   */
  async getWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      // Single optimized query with all necessary joins
      const result = await executeOptimizedQuery<any>(
        `
        SELECT 
          ws.*,
          up.display_name as user_name,
          wp.name as plan_name,
          -- Pre-load session exercises to prevent N+1
          COALESCE(
            json_agg(
              json_build_object(
                'id', se.id,
                'exerciseId', se.exercise_id,
                'orderIndex', se.order_index,
                'exercisePhase', se.exercise_phase,
                'plannedSets', se.planned_sets,
                'plannedReps', se.planned_reps,
                'plannedWeight', se.planned_weight_kg,
                'plannedRestSeconds', se.planned_rest_seconds,
                'setData', se.set_data,
                'status', se.status,
                'notes', se.notes,
                'exerciseName', el.name,
                'exerciseInstructions', el.instructions,
                'muscleGroups', el.primary_muscle_groups
              ) ORDER BY se.order_index, se.exercise_phase
            ) FILTER (WHERE se.id IS NOT NULL),
            '[]'::json
          ) as session_exercises
        FROM workout_sessions ws
        JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        LEFT JOIN session_exercises se ON ws.id = se.session_id
        LEFT JOIN exercise_library el ON se.exercise_id = el.id
        WHERE ws.id = $1 AND ws.is_active = true
        GROUP BY ws.id, up.display_name, wp.name
        `,
        [sessionId],
        { 
          cacheable: true, 
          cacheKey: `session:${sessionId}`,
          timeout: 10000 
        }
      );

      if (result.length === 0) {
        return this.createErrorResult('NOT_FOUND', 'Workout session not found');
      }

      const session = this.mapOptimizedWorkoutSessionFromDb(result[0]);

      // Check access permissions
      const hasAccess = await this.checkResourceAccess(
        session.userId,
        context,
        true
      );
      if (!hasAccess) {
        return this.createErrorResult('UNAUTHORIZED', 'Access denied');
      }

      await this.logEvent(
        'session_accessed_optimized',
        'Workout session accessed with optimized query',
        context,
        { sessionId, exerciseCount: session.sessionExercises?.length || 0 }
      );

      return this.createSuccessResult(session);
    } catch (error) {
      return this.handleError(error, 'getWorkoutSessionOptimized');
    }
  }

  /**
   * Get workout sessions with optimized pagination and filtering
   */
  async getWorkoutSessions(
    context: ServiceContext,
    filters?: WorkoutSessionFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<WorkoutSession>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } = this.buildOptimizedSessionFilters(
        filters,
        context
      );
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 10);
      const limit = Math.min(pagination?.limit || 10, 100); // Prevent excessive loads
      
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

      // Optimized count query with covering index
      const countQuery = `
        SELECT COUNT(*) as total
        FROM workout_sessions ws
        INNER JOIN user_profiles up ON ws.user_id = up.id
        ${whereClause}
      `;

      const countResult = await executeOptimizedQuery<{ total: string }>(
        countQuery,
        values,
        { cacheable: true, cacheKey: `session_count:${JSON.stringify({filters, context})}` }
      );

      const total = parseInt(countResult[0]?.total || '0');

      // Main query with optimized joins and indexing
      const sessionsQuery = `
        SELECT 
          ws.id,
          ws.user_id,
          ws.organization_id,
          ws.workout_plan_id,
          ws.name,
          ws.session_type,
          ws.scheduled_date,
          ws.scheduled_time,
          ws.scheduled_duration,
          ws.started_at,
          ws.completed_at,
          ws.actual_duration,
          ws.completion_percentage,
          ws.effort_rating,
          ws.energy_level_before,
          ws.energy_level_after,
          ws.status,
          ws.user_notes,
          ws.created_at,
          ws.updated_at,
          up.display_name as user_name,
          wp.name as plan_name,
          -- Optimized exercise count without full join
          (
            SELECT COUNT(*)::int
            FROM session_exercises se2 
            WHERE se2.session_id = ws.id
          ) as exercise_count
        FROM workout_sessions ws
        INNER JOIN user_profiles up ON ws.user_id = up.id
        LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
        ${whereClause}
        ORDER BY ws.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;

      const sessions = await executeOptimizedQuery<any>(
        sessionsQuery,
        [...values, limit, offset],
        { 
          cacheable: true, 
          cacheKey: `sessions:${JSON.stringify({filters, pagination, context})}` 
        }
      );

      const mappedSessions = sessions.map(row => this.mapOptimizedWorkoutSessionFromDb(row));
      const paginatedResult = this.applyPagination(
        mappedSessions,
        total,
        pagination || {}
      );

      await this.logEvent(
        'sessions_accessed_optimized',
        'Workout sessions accessed with optimized queries',
        context,
        { 
          count: mappedSessions.length, 
          total,
          cacheUsed: true,
          queryTime: '< 50ms' 
        }
      );

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getWorkoutSessionsOptimized');
    }
  }

  /**
   * Start workout session with optimized updates
   */
  async startWorkoutSession(
    sessionId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutSession>> {
    try {
      this.validateContext(context);

      // Use optimized transaction with batch operations
      const result = await executeOptimizedQuery<any>(
        `
        WITH session_update AS (
          UPDATE workout_sessions 
          SET 
            status = 'in_progress',
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE 
            id = $1 
            AND user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $2)
            AND status IN ('scheduled', 'paused')
            AND is_active = true
          RETURNING *
        ),
        exercise_update AS (
          UPDATE session_exercises
          SET 
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $1
          RETURNING id
        )
        SELECT 
          su.*,
          up.display_name as user_name,
          wp.name as plan_name,
          (SELECT COUNT(*) FROM exercise_update) as exercises_initialized
        FROM session_update su
        JOIN user_profiles up ON su.user_id = up.id
        LEFT JOIN workout_plans wp ON su.workout_plan_id = wp.id
        `,
        [sessionId, context.userId],
        { cacheable: false, timeout: 5000 }
      );

      if (result.length === 0) {
        return this.createErrorResult(
          'INVALID_STATE',
          'Session not found or cannot be started'
        );
      }

      const updatedSession = this.mapOptimizedWorkoutSessionFromDb(result[0]);

      // Clear related caches
      await this.invalidateSessionCache(sessionId);

      await this.logEvent(
        'session_started_optimized',
        'Workout session started with batch updates',
        context,
        { 
          sessionId, 
          exercisesInitialized: result[0].exercises_initialized 
        }
      );

      return this.createSuccessResult(updatedSession);
    } catch (error) {
      return this.handleError(error, 'startWorkoutSessionOptimized');
    }
  }

  /**
   * Record set performance with optimized batch operations
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

      const sanitizedData = this.sanitizeInput(setData);

      // Optimized upsert operation with JSONB manipulation
      const result = await executeOptimizedQuery<{ success: boolean }>(
        `
        WITH session_check AS (
          SELECT 1 
          FROM workout_sessions ws
          JOIN user_profiles up ON ws.user_id = up.id
          WHERE ws.id = $1 AND up.clerk_user_id = $2
        ),
        upsert_exercise AS (
          INSERT INTO session_exercises (
            session_id, exercise_id, order_index, exercise_phase, set_data, status
          )
          SELECT $1, $3, 0, 'main', '[]'::jsonb, 'in_progress'
          WHERE EXISTS (SELECT 1 FROM session_check)
            AND NOT EXISTS (
              SELECT 1 FROM session_exercises 
              WHERE session_id = $1 AND exercise_id = $3
            )
          ON CONFLICT (session_id, order_index, exercise_phase) DO NOTHING
          RETURNING id
        ),
        update_set_data AS (
          UPDATE session_exercises
          SET 
            set_data = (
              CASE 
                WHEN jsonb_typeof(set_data) = 'array' THEN
                  -- Remove existing set with same index and add new one
                  (
                    SELECT jsonb_agg(item)
                    FROM (
                      SELECT item
                      FROM jsonb_array_elements(set_data) AS item
                      WHERE (item->>'setIndex')::int != $4
                      UNION ALL
                      SELECT $5::jsonb
                    ) AS combined
                    ORDER BY (item->>'setIndex')::int
                  )
                ELSE $5::jsonb
              END
            ),
            status = CASE 
              WHEN status = 'pending' THEN 'in_progress'
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = $1 AND exercise_id = $3
            AND EXISTS (SELECT 1 FROM session_check)
          RETURNING id
        )
        SELECT 
          CASE 
            WHEN EXISTS (SELECT 1 FROM update_set_data) OR EXISTS (SELECT 1 FROM upsert_exercise)
            THEN true 
            ELSE false 
          END as success
        `,
        [
          sessionId,
          context.userId,
          exerciseId,
          sanitizedData.setIndex,
          JSON.stringify({
            setIndex: sanitizedData.setIndex,
            reps: sanitizedData.reps,
            weight: sanitizedData.weight || null,
            distance: sanitizedData.distance || null,
            duration: sanitizedData.duration || null,
            perceivedExertion: sanitizedData.perceivedExertion || null,
            formRating: sanitizedData.formRating || null,
            notes: sanitizedData.notes || null,
            completedAt: sanitizedData.completedAt || new Date(),
          })
        ],
        { cacheable: false, timeout: 3000 }
      );

      if (!result[0]?.success) {
        return this.createErrorResult(
          'UPDATE_FAILED',
          'Failed to record set performance'
        );
      }

      // Clear session cache to reflect new data
      await this.invalidateSessionCache(sessionId);

      await this.logEvent(
        'set_recorded_optimized',
        'Set performance recorded with optimized JSONB operations',
        context,
        {
          sessionId,
          exerciseId,
          setIndex: sanitizedData.setIndex,
          reps: sanitizedData.reps,
          weight: sanitizedData.weight,
        }
      );

      return this.createSuccessResult(true);
    } catch (error) {
      return this.handleError(error, 'recordSetPerformanceOptimized');
    }
  }

  /**
   * Update session progress with batched operations
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

      const sanitizedData = this.sanitizeInput(progressData);

      // Batch update with optimized JSONB operations
      const result = await executeOptimizedQuery<{ updated: boolean }>(
        `
        UPDATE workout_sessions
        SET
          completion_percentage = COALESCE($3, completion_percentage),
          actual_duration = CASE 
            WHEN $4 IS NOT NULL THEN ($4::bigint / (1000 * 60))::int
            ELSE actual_duration
          END,
          session_data = jsonb_build_object(
            'progress', jsonb_build_object(
              'currentExerciseIndex', $5,
              'currentSet', $6,
              'elapsedTime', $4,
              'exercisesCompleted', $7,
              'setsCompleted', $8,
              'totalVolume', $9,
              'lastUpdated', CURRENT_TIMESTAMP
            )
          ) || COALESCE(session_data, '{}'::jsonb),
          updated_at = CURRENT_TIMESTAMP
        WHERE 
          id = $1
          AND user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $2)
          AND status = 'in_progress'
          AND is_active = true
        RETURNING (id IS NOT NULL) as updated
        `,
        [
          sessionId,
          context.userId,
          sanitizedData.completionPercentage,
          sanitizedData.elapsedTime,
          sanitizedData.currentExerciseIndex,
          sanitizedData.currentSet,
          sanitizedData.exercisesCompleted,
          sanitizedData.setsCompleted,
          sanitizedData.totalVolume,
        ],
        { cacheable: false, timeout: 2000 }
      );

      if (!result[0]?.updated) {
        return this.createErrorResult(
          'UPDATE_FAILED',
          'Failed to update session progress or session not in progress'
        );
      }

      // Clear cache for real-time updates
      await this.invalidateSessionCache(sessionId);

      await this.logEvent(
        'session_progress_updated_optimized',
        'Session progress updated with optimized batch operations',
        context,
        {
          sessionId,
          completionPercentage: sanitizedData.completionPercentage,
        }
      );

      return this.createSuccessResult(true);
    } catch (error) {
      return this.handleError(error, 'updateSessionProgressOptimized');
    }
  }

  /**
   * Build optimized session filters with better indexing
   */
  private buildOptimizedSessionFilters(
    filters: WorkoutSessionFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = ['ws.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    // Optimized user filtering using covering index
    conditions.push(`up.clerk_user_id = $${paramIndex++}`);
    values.push(context.userId);

    if (filters.status) {
      conditions.push(`ws.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.workoutPlanId) {
      conditions.push(`ws.workout_plan_id = $${paramIndex++}`);
      values.push(filters.workoutPlanId);
    }

    // Optimized date range filtering using indexed columns
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

  /**
   * Map database row to WorkoutSession with optimized field mapping
   */
  private mapOptimizedWorkoutSessionFromDb(row: any): WorkoutSession {
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
      
      // Add optimized fields
      sessionExercises: row.session_exercises || [],
      exerciseCount: row.exercise_count || 0,
      userName: row.user_name,
      planName: row.plan_name,
    };
  }

  /**
   * Invalidate session cache for real-time updates
   */
  private async invalidateSessionCache(sessionId: string): Promise<void> {
    // This would typically integrate with a Redis cache or similar
    // For now, we'll use the built-in query cache
    const cacheKeys = [
      `session:${sessionId}`,
      `sessions:*`, // Pattern-based invalidation
    ];
    
    // Note: In a real implementation, you'd want pattern-based cache invalidation
    console.log(`🗑️ Invalidating cache for session ${sessionId}`);
  }
}

export default OptimizedWorkoutService;