/**
 * Workout Plan Repository Implementation
 * Provides data access layer for workout plans with fitness-specific queries
 * Extends BaseRepository with workout plan domain operations
 */

import { AbstractBaseRepository, type BaseEntity, type QueryOptions, type QueryFilters } from './base.repository';
import type { WorkoutPlan, WorkoutPlanFilters, CreateWorkoutPlanRequest, UpdateWorkoutPlanRequest } from '@/types/workouts';
import type { FitnessLevel } from '@/types/index';

// Extend BaseEntity for WorkoutPlan to ensure compatibility
export interface WorkoutPlanEntity extends BaseEntity, WorkoutPlan {}

// Repository interface defining workout plan specific operations
export interface WorkoutPlanRepository {
  // Base CRUD operations
  findById(id: string, options?: QueryOptions): Promise<WorkoutPlanEntity | null>;
  findMany(filters?: QueryFilters, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  create(data: Omit<WorkoutPlanEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutPlanEntity>;
  update(id: string, data: Partial<Omit<WorkoutPlanEntity, 'id' | 'createdAt'>>): Promise<WorkoutPlanEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: QueryFilters): Promise<number>;

  // Workout plan specific queries
  findByUserId(userId: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findActiveByUserId(userId: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findByStatus(status: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findTemplates(options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findPublicTemplates(options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findFeaturedTemplates(options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findByFitnessLevel(level: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  findByOrganizationId(orgId: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;
  search(query: string, options?: QueryOptions): Promise<WorkoutPlanEntity[]>;

  // Workout plan specific operations
  updateStatus(id: string, status: string): Promise<WorkoutPlanEntity>;
  incrementVersion(id: string): Promise<WorkoutPlanEntity>;
  clonePlan(planId: string, userId: string): Promise<WorkoutPlanEntity>;
}

/**
 * Concrete implementation of WorkoutPlanRepository
 */
export class WorkoutPlanRepositoryImpl extends AbstractBaseRepository<WorkoutPlanEntity> implements WorkoutPlanRepository {
  constructor() {
    super('workout_plans');
  }

  /**
   * Map domain entity to database row
   */
  protected mapToDatabase(entity: unknown): Record<string, unknown> {
    const plan = entity as WorkoutPlanEntity;
    return {
      id: plan.id,
      user_id: plan.userId,
      organization_id: plan.organizationId || null,
      name: plan.name,
      description: plan.description || null,
      duration_weeks: plan.durationWeeks,
      sessions_per_week: plan.sessionsPerWeek,
      fitness_goals: JSON.stringify(plan.fitnessGoals),
      target_fitness_level: plan.targetFitnessLevel,
      estimated_session_duration: plan.estimatedSessionDuration || null,
      ai_prompt_used: plan.aiPromptUsed || null,
      ai_model_version: plan.aiModelVersion || null,
      ai_generation_id: plan.aiGenerationId || null,
      generation_parameters: plan.generationParameters ? JSON.stringify(plan.generationParameters) : null,
      plan_data: JSON.stringify(plan.planData),
      weekly_schedule: JSON.stringify(plan.weeklySchedule),
      progression_rules: plan.progressionRules ? JSON.stringify(plan.progressionRules) : null,
      status: plan.status,
      started_at: plan.startedAt || null,
      completed_at: plan.completedAt || null,
      version: plan.version,
      parent_plan_id: plan.parentPlanId || null,
      is_template: plan.isTemplate,
      template_category: plan.templateCategory || null,
      is_public: plan.isPublic,
      is_featured: plan.isFeatured,
      is_active: plan.isActive,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    };
  }

  /**
   * Map database row to domain entity
   */
  protected mapFromDatabase(row: unknown): WorkoutPlanEntity {
    const dbRow = row as Record<string, unknown>;
    return {
      id: dbRow.id as string,
      userId: dbRow.user_id as string,
      organizationId: dbRow.organization_id as string | undefined,
      name: dbRow.name as string,
      description: dbRow.description as string | undefined,
      durationWeeks: dbRow.duration_weeks as number,
      sessionsPerWeek: dbRow.sessions_per_week as number,
      fitnessGoals: JSON.parse(dbRow.fitness_goals as string) as string[],
      targetFitnessLevel: dbRow.target_fitness_level as FitnessLevel,
      estimatedSessionDuration: dbRow.estimated_session_duration as number | undefined,
      aiPromptUsed: dbRow.ai_prompt_used as string | undefined,
      aiModelVersion: dbRow.ai_model_version as string | undefined,
      aiGenerationId: dbRow.ai_generation_id as string | undefined,
      generationParameters: dbRow.generation_parameters 
        ? JSON.parse(dbRow.generation_parameters as string) 
        : undefined,
      planData: JSON.parse(dbRow.plan_data as string),
      weeklySchedule: JSON.parse(dbRow.weekly_schedule as string),
      progressionRules: dbRow.progression_rules 
        ? JSON.parse(dbRow.progression_rules as string) 
        : undefined,
      status: dbRow.status as WorkoutPlan['status'],
      startedAt: dbRow.started_at ? new Date(dbRow.started_at as string) : undefined,
      completedAt: dbRow.completed_at ? new Date(dbRow.completed_at as string) : undefined,
      version: dbRow.version as number,
      parentPlanId: dbRow.parent_plan_id as string | undefined,
      isTemplate: dbRow.is_template as boolean,
      templateCategory: dbRow.template_category as string | undefined,
      isPublic: dbRow.is_public as boolean,
      isFeatured: dbRow.is_featured as boolean,
      isActive: dbRow.is_active as boolean,
      createdAt: new Date(dbRow.created_at as string),
      updatedAt: new Date(dbRow.updated_at as string),
    };
  }

  /**
   * Find workout plans by user ID
   */
  async findByUserId(userId: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ user_id: userId }, options);
  }

  /**
   * Find active workout plans by user ID
   */
  async findActiveByUserId(userId: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ 
      user_id: userId, 
      status: 'active',
      is_active: true 
    }, options);
  }

  /**
   * Find workout plans by status
   */
  async findByStatus(status: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ status }, options);
  }

  /**
   * Find all workout plan templates
   */
  async findTemplates(options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ is_template: true }, options);
  }

  /**
   * Find public workout plan templates
   */
  async findPublicTemplates(options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ 
      is_template: true, 
      is_public: true,
      is_active: true 
    }, options);
  }

  /**
   * Find featured workout plan templates
   */
  async findFeaturedTemplates(options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ 
      is_template: true, 
      is_featured: true,
      is_active: true 
    }, options);
  }

  /**
   * Find workout plans by fitness level
   */
  async findByFitnessLevel(level: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ target_fitness_level: level }, options);
  }

  /**
   * Find workout plans by organization ID
   */
  async findByOrganizationId(orgId: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    return this.findMany({ organization_id: orgId }, options);
  }

  /**
   * Search workout plans by text query
   */
  async search(query: string, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE (
          LOWER(name) LIKE $1 OR
          LOWER(description) LIKE $1 OR
          LOWER(template_category) LIKE $1 OR
          fitness_goals::text ILIKE $1
        )
        AND is_active = true
        ORDER BY 
          CASE WHEN is_featured THEN 0 ELSE 1 END,
          CASE WHEN is_public THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT $2
      `;

      const limit = options.limit || 50;
      const result = await this.db.executeQuery<WorkoutPlanEntity>(
        sql,
        [searchTerm, limit],
        {
          cacheable: options.cacheable,
          cacheKey: options.cacheKey || `workout-plans:search:${query}`,
          timeout: options.timeout
        }
      );

      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('SEARCH_FAILED',
        `Failed to search workout plans: ${query}`, error);
    }
  }

  /**
   * Update workout plan status
   */
  async updateStatus(id: string, status: string): Promise<WorkoutPlanEntity> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date()
    };

    // Set started_at when transitioning to active
    if (status === 'active') {
      updateData.started_at = new Date();
    }

    // Set completed_at when transitioning to completed
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    return this.update(id, updateData);
  }

  /**
   * Increment workout plan version
   */
  async incrementVersion(id: string): Promise<WorkoutPlanEntity> {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET version = version + 1, updated_at = $2
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.executeQuery<WorkoutPlanEntity>(
        sql,
        [id, new Date()],
        { cacheable: false }
      );

      if (result.length === 0) {
        throw this.createRepositoryError('NOT_FOUND',
          `Workout plan with id ${id} not found`);
      }

      return this.mapFromDatabase(result[0]);
    } catch (error) {
      throw this.createRepositoryError('VERSION_INCREMENT_FAILED',
        `Failed to increment version for workout plan: ${id}`, error);
    }
  }

  /**
   * Clone a workout plan for a new user
   */
  async clonePlan(planId: string, userId: string): Promise<WorkoutPlanEntity> {
    try {
      // First, get the original plan
      const originalPlan = await this.findById(planId);
      if (!originalPlan) {
        throw this.createRepositoryError('NOT_FOUND',
          `Workout plan with id ${planId} not found`);
      }

      // Create a new plan based on the original
      const clonedPlanData: Omit<WorkoutPlanEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        ...originalPlan,
        userId,
        name: `${originalPlan.name} (Copy)`,
        status: 'draft',
        version: 1,
        parentPlanId: planId,
        isTemplate: false,
        isPublic: false,
        isFeatured: false,
        startedAt: undefined,
        completedAt: undefined,
      };

      return this.create(clonedPlanData);
    } catch (error) {
      throw this.createRepositoryError('CLONE_FAILED',
        `Failed to clone workout plan: ${planId}`, error);
    }
  }

  /**
   * Build WHERE clause with workout plan specific filters
   */
  protected buildWorkoutPlanWhereClause(filters: WorkoutPlanFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(filters.status);
    }

    if (filters.isTemplate !== undefined) {
      conditions.push(`is_template = $${params.length + 1}`);
      params.push(filters.isTemplate);
    }

    if (filters.targetFitnessLevel) {
      conditions.push(`target_fitness_level = $${params.length + 1}`);
      params.push(filters.targetFitnessLevel);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(`(
        LOWER(name) LIKE $${params.length + 1} OR
        LOWER(description) LIKE $${params.length + 1} OR
        LOWER(template_category) LIKE $${params.length + 1}
      )`);
      params.push(searchTerm);
    }

    // Always filter for active records by default
    conditions.push('is_active = true');

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  /**
   * Find workout plans with advanced filtering
   */
  async findWithFilters(filters: WorkoutPlanFilters, options: QueryOptions = {}): Promise<WorkoutPlanEntity[]> {
    try {
      const { whereClause, params } = this.buildWorkoutPlanWhereClause(filters);
      const { orderClause } = this.buildOrderClause(options);
      const { limitClause, limitParams } = this.buildLimitClause(options);

      const sql = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `.trim();

      const allParams = [...params, ...limitParams];
      const cacheKey = options.cacheKey || `workout-plans:filter:${JSON.stringify(filters)}`;

      const result = await this.db.executeQuery<WorkoutPlanEntity>(
        sql,
        allParams,
        {
          cacheable: options.cacheable !== false,
          cacheKey,
          timeout: options.timeout
        }
      );

      return result.map(row => this.mapFromDatabase(row));
    } catch (error) {
      throw this.createRepositoryError('FILTER_QUERY_FAILED',
        `Failed to find workout plans with filters`, error);
    }
  }
}

// Export singleton instance
export const workoutPlanRepository = new WorkoutPlanRepositoryImpl();
export default workoutPlanRepository;