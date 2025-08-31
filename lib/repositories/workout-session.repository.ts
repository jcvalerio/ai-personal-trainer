/**
 * Workout Session Repository Implementation
 * Provides data access layer for workout sessions with session-specific queries
 * Extends BaseRepository with workout session domain operations and transaction support
 */

import { AbstractBaseRepository, type BaseEntity, type QueryOptions, type QueryFilters } from './base.repository';
import type { WorkoutSession, SessionData, SessionProgressData, SessionExercise } from '@/types/workouts';

// Extend BaseEntity for WorkoutSession to ensure compatibility
export interface WorkoutSessionEntity extends BaseEntity, WorkoutSession {}

// Extend BaseEntity for SessionExercise to ensure compatibility
export interface SessionExerciseEntity extends BaseEntity, SessionExercise {}

// Repository interface defining workout session specific operations
export interface WorkoutSessionRepository {
  // Base CRUD operations
  findById(id: string, options?: QueryOptions): Promise<WorkoutSessionEntity | null>;
  findMany(filters?: QueryFilters, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  create(data: Omit<WorkoutSessionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutSessionEntity>;
  update(id: string, data: Partial<Omit<WorkoutSessionEntity, 'id' | 'createdAt'>>): Promise<WorkoutSessionEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: QueryFilters): Promise<number>;

  // Session-specific query methods
  findByUserId(userId: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findByPlanId(planId: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findByStatus(status: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findByUserIdAndStatus(userId: string, status: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findActiveByUserId(userId: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findScheduledByUserId(userId: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findRecentByUserId(userId: string, limit?: number, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findByDateRange(userId: string, startDate: Date, endDate: Date, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;
  findByOrganizationId(orgId: string, options?: QueryOptions): Promise<WorkoutSessionEntity[]>;

  // Session lifecycle methods
  startSession(sessionId: string): Promise<WorkoutSessionEntity>;
  pauseSession(sessionId: string): Promise<WorkoutSessionEntity>;
  resumeSession(sessionId: string): Promise<WorkoutSessionEntity>;
  completeSession(sessionId: string, completionData: any): Promise<WorkoutSessionEntity>;
  updateProgress(sessionId: string, progressData: SessionProgressData): Promise<WorkoutSessionEntity>;
  updateStatus(id: string, status: string): Promise<WorkoutSessionEntity>;

  // Exercise tracking methods
  addExercise(sessionId: string, exercise: Omit<SessionExerciseEntity, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<SessionExerciseEntity>;
  updateExerciseProgress(sessionId: string, exerciseId: string, progressData: any): Promise<SessionExerciseEntity>;
  completeExercise(sessionId: string, exerciseId: string): Promise<SessionExerciseEntity>;
  getSessionExercises(sessionId: string, options?: QueryOptions): Promise<SessionExerciseEntity[]>;

  // Analytics and statistics methods
  getSessionStats(userId: string): Promise<any>;
  getUserWeeklyStats(userId: string): Promise<any>;
  getUserMonthlyStats(userId: string): Promise<any>;
  getCompletionRate(userId: string, period?: string): Promise<number>;
  getAverageSessionDuration(userId: string, period?: string): Promise<number>;

  // Transaction support methods
  executeWithTransaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
  bulkUpdateSessions(sessionIds: string[], updates: Partial<WorkoutSessionEntity>): Promise<WorkoutSessionEntity[]>;
}

/**
 * Concrete implementation of WorkoutSessionRepository with transaction support
 */
export class WorkoutSessionRepositoryImpl extends AbstractBaseRepository<WorkoutSessionEntity> implements WorkoutSessionRepository {
  constructor() {
    super('workout_sessions');
  }

  /**
   * Map domain entity to database row
   */
  protected mapToDatabase(entity: unknown): Record<string, unknown> {
    const session = entity as WorkoutSessionEntity;
    return {
      id: session.id,
      user_id: session.userId,
      organization_id: session.organizationId || null,
      workout_plan_id: session.workoutPlanId || null,
      name: session.name,
      session_type: session.sessionType,
      scheduled_date: session.scheduledDate,
      scheduled_time: session.scheduledTime || null,
      scheduled_duration: session.scheduledDuration || null,
      started_at: session.startedAt || null,
      completed_at: session.completedAt || null,
      actual_duration: session.actualDuration || null,
      session_data: JSON.stringify(session.sessionData),
      warm_up_exercises: JSON.stringify(session.warmUpExercises),
      main_exercises: JSON.stringify(session.mainExercises),
      cool_down_exercises: JSON.stringify(session.coolDownExercises),
      completion_percentage: session.completionPercentage,
      effort_rating: session.effortRating || null,
      energy_level_before: session.energyLevelBefore || null,
      energy_level_after: session.energyLevelAfter || null,
      status: session.status,
      equipment_used: JSON.stringify(session.equipmentUsed),
      gym_location: session.gymLocation || null,
      user_notes: session.userNotes || null,
      ai_feedback: session.aiFeedback || null,
      trainer_notes: session.trainerNotes || null,
      is_active: session.isActive,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    };
  }

  /**
   * Map database row to domain entity
   */
  protected mapFromDatabase(row: unknown): WorkoutSessionEntity {
    const dbRow = row as Record<string, unknown>;
    
    // Helper function to safely parse JSON fields
    const safeJsonParse = (jsonString: unknown, defaultValue: any = null) => {
      if (!jsonString || typeof jsonString !== 'string') {
        return defaultValue;
      }
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn(`Failed to parse JSON: ${jsonString}`, error);
        return defaultValue;
      }
    };
    
    return {
      id: dbRow.id as string,
      userId: dbRow.user_id as string,
      organizationId: dbRow.organization_id as string | undefined,
      workoutPlanId: dbRow.workout_plan_id as string | undefined,
      name: dbRow.name as string,
      sessionType: dbRow.session_type as WorkoutSession['sessionType'],
      scheduledDate: new Date(dbRow.scheduled_date as string),
      scheduledTime: dbRow.scheduled_time as string | undefined,
      scheduledDuration: dbRow.scheduled_duration as number | undefined,
      startedAt: dbRow.started_at ? new Date(dbRow.started_at as string) : undefined,
      completedAt: dbRow.completed_at ? new Date(dbRow.completed_at as string) : undefined,
      actualDuration: dbRow.actual_duration as number | undefined,
      sessionData: safeJsonParse(dbRow.session_data, {}) as SessionData,
      warmUpExercises: safeJsonParse(dbRow.warm_up_exercises, []) as any[],
      mainExercises: safeJsonParse(dbRow.main_exercises, []) as any[],
      coolDownExercises: safeJsonParse(dbRow.cool_down_exercises, []) as any[],
      completionPercentage: dbRow.completion_percentage as number,
      effortRating: dbRow.effort_rating as number | undefined,
      energyLevelBefore: dbRow.energy_level_before as number | undefined,
      energyLevelAfter: dbRow.energy_level_after as number | undefined,
      status: dbRow.status as WorkoutSession['status'],
      equipmentUsed: safeJsonParse(dbRow.equipment_used, []) as string[],
      gymLocation: dbRow.gym_location as string | undefined,
      userNotes: dbRow.user_notes as string | undefined,
      aiFeedback: dbRow.ai_feedback as string | undefined,
      trainerNotes: dbRow.trainer_notes as string | undefined,
      isActive: dbRow.is_active as boolean,
      createdAt: new Date(dbRow.created_at as string),
      updatedAt: new Date(dbRow.updated_at as string),
    };
  }

  /**
   * Map session exercise domain entity to database row
   */
  protected mapSessionExerciseToDatabase(entity: SessionExerciseEntity): Record<string, unknown> {
    return {
      id: entity.id,
      session_id: entity.sessionId,
      exercise_id: entity.exerciseId,
      name: entity.name,
      order_index: entity.orderIndex,
      superset_group: entity.supersetGroup || null,
      exercise_phase: entity.exercisePhase,
      sets: entity.sets || null,
      completed_sets: entity.completedSets || null,
      planned_sets: entity.plannedSets || null,
      planned_reps: entity.plannedReps || null,
      planned_weight_kg: entity.plannedWeightKg || null,
      planned_duration_seconds: entity.plannedDurationSeconds || null,
      planned_distance_meters: entity.plannedDistanceMeters || null,
      planned_rest_seconds: entity.plannedRestSeconds || null,
      actual_sets: entity.actualSets || null,
      actual_reps: entity.actualReps || null,
      actual_weight_kg: entity.actualWeightKg || null,
      actual_duration_seconds: entity.actualDurationSeconds || null,
      actual_distance_meters: entity.actualDistanceMeters || null,
      actual_rest_seconds: entity.actualRestSeconds || null,
      set_data: entity.setData ? JSON.stringify(entity.setData) : null,
      equipment_used: entity.equipmentUsed || null,
      equipment_alternatives: JSON.stringify(entity.equipmentAlternatives),
      exercise_modifications: entity.exerciseModifications ? JSON.stringify(entity.exerciseModifications) : null,
      perceived_exertion: entity.perceivedExertion || null,
      form_rating: entity.formRating || null,
      difficulty_rating: entity.difficultyRating || null,
      status: entity.status,
      completed_at: entity.completedAt || null,
      notes: entity.notes || null,
      timer_protocol: entity.timerProtocol || null,
      timer_config: entity.timerConfig ? JSON.stringify(entity.timerConfig) : null,
      execution_data: entity.executionData ? JSON.stringify(entity.executionData) : null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Map database row to session exercise domain entity
   */
  protected mapSessionExerciseFromDatabase(row: unknown): SessionExerciseEntity {
    const dbRow = row as Record<string, unknown>;
    return {
      id: dbRow.id as string,
      sessionId: dbRow.session_id as string,
      exerciseId: dbRow.exercise_id as string,
      name: dbRow.name as string,
      orderIndex: dbRow.order_index as number,
      supersetGroup: dbRow.superset_group as number | undefined,
      exercisePhase: dbRow.exercise_phase as SessionExercise['exercisePhase'],
      sets: dbRow.sets as number | undefined,
      completedSets: dbRow.completed_sets as number | undefined,
      plannedSets: dbRow.planned_sets as number | undefined,
      plannedReps: dbRow.planned_reps as number | undefined,
      plannedWeightKg: dbRow.planned_weight_kg as number | undefined,
      plannedDurationSeconds: dbRow.planned_duration_seconds as number | undefined,
      plannedDistanceMeters: dbRow.planned_distance_meters as number | undefined,
      plannedRestSeconds: dbRow.planned_rest_seconds as number | undefined,
      actualSets: dbRow.actual_sets as number | undefined,
      actualReps: dbRow.actual_reps as number | undefined,
      actualWeightKg: dbRow.actual_weight_kg as number | undefined,
      actualDurationSeconds: dbRow.actual_duration_seconds as number | undefined,
      actualDistanceMeters: dbRow.actual_distance_meters as number | undefined,
      actualRestSeconds: dbRow.actual_rest_seconds as number | undefined,
      setData: dbRow.set_data ? JSON.parse(dbRow.set_data as string) : [],
      equipmentUsed: dbRow.equipment_used as string | undefined,
      equipmentAlternatives: JSON.parse(dbRow.equipment_alternatives as string) as string[],
      exerciseModifications: dbRow.exercise_modifications ? JSON.parse(dbRow.exercise_modifications as string) : [],
      perceivedExertion: dbRow.perceived_exertion as number | undefined,
      formRating: dbRow.form_rating as number | undefined,
      difficultyRating: dbRow.difficulty_rating as number | undefined,
      status: dbRow.status as SessionExercise['status'],
      completedAt: dbRow.completed_at ? new Date(dbRow.completed_at as string) : undefined,
      notes: dbRow.notes as string | undefined,
      timerProtocol: dbRow.timer_protocol as SessionExercise['timerProtocol'] | undefined,
      timerConfig: dbRow.timer_config ? JSON.parse(dbRow.timer_config as string) : undefined,
      executionData: dbRow.execution_data ? JSON.parse(dbRow.execution_data as string) : undefined,
      createdAt: new Date(dbRow.created_at as string),
      updatedAt: new Date(dbRow.updated_at as string),
    };
  }

  // Session-specific query methods

  /**
   * Find workout sessions by user ID
   */
  async findByUserId(userId: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ user_id: userId }, options);
  }

  /**
   * Find workout sessions by plan ID
   */
  async findByPlanId(planId: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ workout_plan_id: planId }, options);
  }

  /**
   * Find workout sessions by status
   */
  async findByStatus(status: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ status }, options);
  }

  /**
   * Find workout sessions by user ID and status
   */
  async findByUserIdAndStatus(userId: string, status: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ user_id: userId, status }, options);
  }

  /**
   * Find active workout sessions by user ID
   */
  async findActiveByUserId(userId: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ 
      user_id: userId, 
      status: 'in_progress',
      is_active: true 
    }, options);
  }

  /**
   * Find scheduled workout sessions by user ID
   */
  async findScheduledByUserId(userId: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ 
      user_id: userId, 
      status: 'scheduled',
      is_active: true 
    }, options);
  }

  /**
   * Find recent workout sessions by user ID
   */
  async findRecentByUserId(userId: string, limit = 10, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ user_id: userId }, {
      ...options,
      limit,
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });
  }

  /**
   * Find workout sessions by date range
   */
  async findByDateRange(userId: string, startDate: Date, endDate: Date, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    try {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE user_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
        ORDER BY scheduled_date ASC
      `;

      const result = await this.db.executeQuery<WorkoutSessionEntity>(
        sql,
        [userId, startDate, endDate],
        options
      );

      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('FIND_BY_DATE_RANGE_FAILED',
        `Failed to find sessions by date range for user: ${userId}`, error);
    }
  }

  /**
   * Find workout sessions by organization ID
   */
  async findByOrganizationId(orgId: string, options: QueryOptions = {}): Promise<WorkoutSessionEntity[]> {
    return this.findMany({ organization_id: orgId }, options);
  }

  // Session lifecycle methods

  /**
   * Start a workout session with transaction support
   */
  async startSession(sessionId: string): Promise<WorkoutSessionEntity> {
    return this.executeWithTransaction(async (trx) => {
      const now = new Date();
      
      // Update session status and start time
      const updateData = {
        status: 'in_progress' as const,
        startedAt: now,
        updatedAt: now
      };

      return this.update(sessionId, updateData);
    });
  }

  /**
   * Pause a workout session
   */
  async pauseSession(sessionId: string): Promise<WorkoutSessionEntity> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw this.createRepositoryError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
    }

    if (session.status !== 'in_progress') {
      throw this.createRepositoryError('INVALID_STATUS_TRANSITION', 
        `Cannot pause session with status: ${session.status}`);
    }

    // Note: Paused status would need to be added to SessionStatus type
    // For now, we'll keep status as in_progress but update session data
    const updateData = {
      sessionData: {
        ...session.sessionData,
        progress: {
          ...session.sessionData.progress,
          lastUpdated: new Date().toISOString()
        }
      },
      updatedAt: new Date()
    };

    return this.update(sessionId, updateData);
  }

  /**
   * Resume a paused workout session
   */
  async resumeSession(sessionId: string): Promise<WorkoutSessionEntity> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw this.createRepositoryError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
    }

    const updateData = {
      sessionData: {
        ...session.sessionData,
        progress: {
          ...session.sessionData.progress,
          lastUpdated: new Date().toISOString()
        }
      },
      updatedAt: new Date()
    };

    return this.update(sessionId, updateData);
  }

  /**
   * Complete a workout session with transaction support
   */
  async completeSession(sessionId: string, completionData: any): Promise<WorkoutSessionEntity> {
    return this.executeWithTransaction(async (trx) => {
      const session = await this.findById(sessionId);
      if (!session) {
        throw this.createRepositoryError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
      }

      const now = new Date();
      const actualDuration = session.startedAt 
        ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000 / 60) // minutes
        : completionData.actualDuration || 0;

      const updateData = {
        status: 'completed' as const,
        completedAt: now,
        actualDuration,
        completionPercentage: 100,
        effortRating: completionData.effortRating,
        energyLevelAfter: completionData.energyLevelAfter,
        userNotes: completionData.userNotes,
        updatedAt: now
      };

      return this.update(sessionId, updateData);
    });
  }

  /**
   * Update session progress
   */
  async updateProgress(sessionId: string, progressData: SessionProgressData): Promise<WorkoutSessionEntity> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw this.createRepositoryError('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
    }

    const updatedSessionData = {
      ...session.sessionData,
      progress: {
        ...session.sessionData.progress,
        ...progressData,
        lastUpdated: new Date().toISOString()
      }
    };

    const updateData = {
      sessionData: updatedSessionData,
      completionPercentage: this.calculateCompletionPercentage(progressData, session.sessionData),
      updatedAt: new Date()
    };

    return this.update(sessionId, updateData);
  }

  /**
   * Update session status
   */
  async updateStatus(id: string, status: string): Promise<WorkoutSessionEntity> {
    return this.update(id, { status, updatedAt: new Date() });
  }

  // Exercise tracking methods

  /**
   * Add exercise to session with transaction support
   */
  async addExercise(sessionId: string, exercise: Omit<SessionExerciseEntity, 'id' | 'sessionId' | 'createdAt' | 'updatedAt'>): Promise<SessionExerciseEntity> {
    return this.executeWithTransaction(async (trx) => {
      const exerciseId = this.generateId();
      const now = new Date();
      
      const exerciseData: SessionExerciseEntity = {
        ...exercise,
        id: exerciseId,
        sessionId,
        createdAt: now,
        updatedAt: now,
      };

      const dbData = this.mapSessionExerciseToDatabase(exerciseData);
      const { columns, values, placeholders } = this.buildInsertClause(dbData);

      const sql = `
        INSERT INTO session_exercises (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await this.db.executeQuery<SessionExerciseEntity>(
        sql,
        values,
        { cacheable: false }
      );

      if (result.length === 0) {
        throw new Error('Add exercise operation returned no results');
      }

      return this.mapSessionExerciseFromDatabase(result[0]);
    });
  }

  /**
   * Update exercise progress
   */
  async updateExerciseProgress(sessionId: string, exerciseId: string, progressData: any): Promise<SessionExerciseEntity> {
    try {
      const now = new Date();
      const updateData = {
        ...progressData,
        updated_at: now
      };

      const { setClause, params } = this.buildUpdateClause(updateData);

      const sql = `
        UPDATE session_exercises
        SET ${setClause}
        WHERE id = $${params.length + 1} AND session_id = $${params.length + 2}
        RETURNING *
      `;

      const result = await this.db.executeQuery<SessionExerciseEntity>(
        sql,
        [...params, exerciseId, sessionId],
        { cacheable: false }
      );

      if (result.length === 0) {
        throw this.createRepositoryError('EXERCISE_NOT_FOUND',
          `Exercise ${exerciseId} not found in session ${sessionId}`);
      }

      return this.mapSessionExerciseFromDatabase(result[0]);
    } catch (error) {
      throw this.createRepositoryError('UPDATE_EXERCISE_FAILED',
        `Failed to update exercise progress: ${exerciseId}`, error);
    }
  }

  /**
   * Complete an exercise
   */
  async completeExercise(sessionId: string, exerciseId: string): Promise<SessionExerciseEntity> {
    return this.updateExerciseProgress(sessionId, exerciseId, {
      status: 'completed',
      completed_at: new Date()
    });
  }

  /**
   * Get all exercises for a session
   */
  async getSessionExercises(sessionId: string, options: QueryOptions = {}): Promise<SessionExerciseEntity[]> {
    try {
      const sql = `
        SELECT * FROM session_exercises
        WHERE session_id = $1
        ORDER BY order_index ASC
      `;

      const result = await this.db.executeQuery<SessionExerciseEntity>(
        sql,
        [sessionId],
        options
      );

      return result.map(row => this.mapSessionExerciseFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('GET_SESSION_EXERCISES_FAILED',
        `Failed to get exercises for session: ${sessionId}`, error);
    }
  }

  // Analytics and statistics methods

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_sessions,
          AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration,
          AVG(CASE WHEN effort_rating IS NOT NULL THEN effort_rating END) as avg_effort_rating
        FROM ${this.tableName}
        WHERE user_id = $1
      `;

      const result = await this.db.executeQuery(sql, [userId]);
      return result[0];
    } catch (error) {
      throw this.createRepositoryError('GET_SESSION_STATS_FAILED',
        `Failed to get session stats for user: ${userId}`, error);
    }
  }

  /**
   * Get weekly statistics for a user
   */
  async getUserWeeklyStats(userId: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          DATE_TRUNC('week', scheduled_date) as week,
          COUNT(*) as sessions_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration
        FROM ${this.tableName}
        WHERE user_id = $1 AND scheduled_date >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', scheduled_date)
        ORDER BY week DESC
      `;

      const result = await this.db.executeQuery(sql, [userId]);
      return result;
    } catch (error) {
      throw this.createRepositoryError('GET_WEEKLY_STATS_FAILED',
        `Failed to get weekly stats for user: ${userId}`, error);
    }
  }

  /**
   * Get monthly statistics for a user
   */
  async getUserMonthlyStats(userId: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          DATE_TRUNC('month', scheduled_date) as month,
          COUNT(*) as sessions_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration
        FROM ${this.tableName}
        WHERE user_id = $1 AND scheduled_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', scheduled_date)
        ORDER BY month DESC
      `;

      const result = await this.db.executeQuery(sql, [userId]);
      return result;
    } catch (error) {
      throw this.createRepositoryError('GET_MONTHLY_STATS_FAILED',
        `Failed to get monthly stats for user: ${userId}`, error);
    }
  }

  /**
   * Get completion rate for a user
   */
  async getCompletionRate(userId: string, period = 'weekly'): Promise<number> {
    try {
      let intervalClause = '';
      switch (period) {
        case 'weekly':
          intervalClause = "AND scheduled_date >= NOW() - INTERVAL '1 week'";
          break;
        case 'monthly':
          intervalClause = "AND scheduled_date >= NOW() - INTERVAL '1 month'";
          break;
        case 'yearly':
          intervalClause = "AND scheduled_date >= NOW() - INTERVAL '1 year'";
          break;
      }

      const sql = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions
        FROM ${this.tableName}
        WHERE user_id = $1 ${intervalClause}
      `;

      const result = await this.db.executeQuery<{ total_sessions: string, completed_sessions: string }>(sql, [userId]);
      const { total_sessions, completed_sessions } = result[0];
      
      const total = parseInt(total_sessions, 10);
      const completed = parseInt(completed_sessions, 10);
      
      return total > 0 ? (completed / total) * 100 : 0;
    } catch (error) {
      throw this.createRepositoryError('GET_COMPLETION_RATE_FAILED',
        `Failed to get completion rate for user: ${userId}`, error);
    }
  }

  /**
   * Get average session duration for a user
   */
  async getAverageSessionDuration(userId: string, period = 'monthly'): Promise<number> {
    try {
      let intervalClause = '';
      switch (period) {
        case 'weekly':
          intervalClause = "AND completed_at >= NOW() - INTERVAL '1 week'";
          break;
        case 'monthly':
          intervalClause = "AND completed_at >= NOW() - INTERVAL '1 month'";
          break;
        case 'yearly':
          intervalClause = "AND completed_at >= NOW() - INTERVAL '1 year'";
          break;
      }

      const sql = `
        SELECT AVG(actual_duration) as avg_duration
        FROM ${this.tableName}
        WHERE user_id = $1 AND status = 'completed' AND actual_duration IS NOT NULL ${intervalClause}
      `;

      const result = await this.db.executeQuery<{ avg_duration: string }>(sql, [userId]);
      return parseFloat(result[0]?.avg_duration || '0');
    } catch (error) {
      throw this.createRepositoryError('GET_AVG_DURATION_FAILED',
        `Failed to get average session duration for user: ${userId}`, error);
    }
  }

  // Transaction support methods

  /**
   * Execute operations within a transaction
   */
  async executeWithTransaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    try {
      // Note: This would need actual transaction implementation in optimizedDb
      // For now, we'll execute the callback directly
      return await callback(null);
    } catch (error) {
      throw this.createRepositoryError('TRANSACTION_FAILED',
        'Transaction execution failed', error);
    }
  }

  /**
   * Bulk update multiple sessions
   */
  async bulkUpdateSessions(sessionIds: string[], updates: Partial<WorkoutSessionEntity>): Promise<WorkoutSessionEntity[]> {
    return this.executeWithTransaction(async (trx) => {
      const updatePromises = sessionIds.map(id => this.update(id, updates));
      return Promise.all(updatePromises);
    });
  }

  // Helper methods

  /**
   * Calculate completion percentage based on progress data
   */
  private calculateCompletionPercentage(progressData: SessionProgressData, sessionData: SessionData): number {
    const totalExercises = sessionData.totalExercises || 1;
    const exercisesCompleted = progressData.exercisesCompleted || 0;
    
    return Math.min(Math.round((exercisesCompleted / totalExercises) * 100), 100);
  }
}

// Export singleton instance
export const workoutSessionRepository = new WorkoutSessionRepositoryImpl();
export default workoutSessionRepository;