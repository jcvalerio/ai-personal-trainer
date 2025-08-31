/**
 * Progress Service
 * Handles user progress measurements and achievements
 */

import {
  BaseService,
  ServiceContext,
  ServiceResult,
  PaginationParams,
  PaginatedResult,
} from './base';
import {
  ProgressMeasurement,
  UserAchievement,
  CreateProgressMeasurementRequest,
  CreateUserAchievementRequest,
  ProgressMeasurementFilters,
  UserAchievementFilters,
  ProgressStats,
} from '@/types/workouts';

export class ProgressService extends BaseService {
  constructor() {
    super('progress_service');
  }

  // Progress Measurements Operations

  /**
   * Create a new progress measurement
   */
  async createProgressMeasurement(
    data: CreateProgressMeasurementRequest,
    context: ServiceContext
  ): Promise<ServiceResult<ProgressMeasurement>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(data, ['measurementType', 'value', 'unit']);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        // First, ensure user profile exists
        // Ensure a valid placeholder email to satisfy CHECK constraint
        const placeholderEmail = `${context.userId}@users.local`;
        const userResult = await client`
          INSERT INTO user_profiles (clerk_user_id, email, display_name)
          VALUES (${context.userId}, ${placeholderEmail}, 'User')
          ON CONFLICT (clerk_user_id) DO NOTHING
          RETURNING id
        `;

        // Get user ID (either newly created or existing)
        const userIdResult = await client`
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        `;

        if (userIdResult.length === 0) {
          throw new Error('Failed to create or find user profile');
        }

        const userId = userIdResult[0]?.id;
        if (!userId) {
          throw new Error('Failed to get user ID from user profile');
        }

        // Check for an existing identical measurement to avoid duplicate errors
        const existingMeasurement = await client`
          SELECT * FROM progress_measurements
          WHERE user_id = ${userId}
            AND measurement_type = ${sanitizedData.measurementType}
            AND unit = ${sanitizedData.unit}
            AND value = ${sanitizedData.value}
            AND measured_at = ${sanitizedData.measuredAt ? new Date(sanitizedData.measuredAt) : new Date()}
            AND COALESCE(measurement_location, '') = ${sanitizedData.measurementLocation || ''}
          LIMIT 1
        `;

        if (existingMeasurement.length > 0) {
          // Return existing to behave idempotently
          return this.mapProgressMeasurementFromDb(existingMeasurement[0]);
        }

        const measurementResult = await client`
          INSERT INTO progress_measurements (
            user_id,
            organization_id,
            measurement_type,
            measurement_location,
            value,
            unit,
            measured_at,
            measurement_method,
            measurement_device,
            body_composition,
            notes,
            photo_url
          ) VALUES (
            ${userId},
            ${context.organizationId || null},
            ${sanitizedData.measurementType},
            ${sanitizedData.measurementLocation || null},
            ${sanitizedData.value},
            ${sanitizedData.unit},
            ${sanitizedData.measuredAt ? new Date(sanitizedData.measuredAt) : new Date()},
            ${sanitizedData.measurementMethod || null},
            ${sanitizedData.measurementDevice || null},
            ${JSON.stringify(sanitizedData.bodyComposition || {})},
            ${sanitizedData.notes || null},
            ${sanitizedData.photoUrl || null}
          )
          RETURNING *
        `;

        if (measurementResult.length === 0) {
          throw new Error('Failed to create progress measurement');
        }

        return this.mapProgressMeasurementFromDb(measurementResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent(
        'measurement_created',
        'Progress measurement created',
        context,
        {
          measurementId: result.data.id,
          type: result.data.measurementType,
        }
      );

      return this.createSuccessResult(
        result.data,
        'Progress measurement created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createProgressMeasurement');
    }
  }

  /**
   * Get progress measurements for a user
   */
  async getProgressMeasurements(
    context: ServiceContext,
    filters?: ProgressMeasurementFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<ProgressMeasurement>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } =
        this.buildProgressMeasurementFilters(filters, context);
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 20);
      const limit = pagination?.limit || 20;
      const sortBy = pagination?.sortBy || 'measured_at';
      const sortOrder = pagination?.sortOrder || 'desc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM progress_measurements pm
        JOIN user_profiles up ON pm.user_id = up.id
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT pm.*
        FROM progress_measurements pm
        JOIN user_profiles up ON pm.user_id = up.id
        ${whereClause}
        ORDER BY pm.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const measurements = result.map((row) =>
        this.mapProgressMeasurementFromDb(row)
      );
      const paginatedResult = this.applyPagination(
        measurements,
        total,
        pagination || {}
      );

      await this.logEvent(
        'measurements_accessed',
        'Progress measurements accessed',
        context
      );

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getProgressMeasurements');
    }
  }

  /**
   * Get progress statistics for a user
   */
  async getProgressStats(
    context: ServiceContext,
    timeframe?: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<ServiceResult<ProgressStats>> {
    try {
      this.validateContext(context);

      const timeframeDays = this.getTimeframeDays(timeframe || 'month');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      const result = await this.db`
        SELECT 
          measurement_type,
          COUNT(*) as measurement_count,
          AVG(value) as average_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
          unit,
          MIN(measured_at) as first_measurement,
          MAX(measured_at) as last_measurement
        FROM progress_measurements pm
        WHERE pm.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId})
        AND pm.measured_at >= ${startDate.toISOString()}
        GROUP BY measurement_type, unit
        ORDER BY measurement_type
      `;

      // Calculate trends for each measurement type
      const trends = await this.calculateProgressTrends(
        context.userId,
        timeframeDays
      );

      const stats: ProgressStats = {
        timeframe: timeframe || 'month',
        startDate,
        endDate: new Date(),
        measurementSummary: result.map((row: any) => ({
          measurementType: row.measurement_type as
            | 'weight'
            | 'body_fat'
            | 'muscle_mass'
            | 'circumference',
          unit: row.unit as string,
          count: parseInt(row.measurement_count as string),
          average: parseFloat(row.average_value as string),
          min: parseFloat(row.min_value as string),
          max: parseFloat(row.max_value as string),
          median: parseFloat(row.median_value as string),
          firstMeasurement: new Date(row.first_measurement as string),
          lastMeasurement: new Date(row.last_measurement as string),
          trend: trends[row.measurement_type as string] || 'stable',
        })),
        overallTrend: this.calculateOverallTrend(trends),
      };

      await this.logEvent(
        'stats_accessed',
        'Progress statistics accessed',
        context
      );

      return this.createSuccessResult(stats);
    } catch (error) {
      return this.handleError(error, 'getProgressStats');
    }
  }

  /**
   * Update a progress measurement
   */
  async updateProgressMeasurement(
    measurementId: string,
    data: Partial<CreateProgressMeasurementRequest>,
    context: ServiceContext
  ): Promise<ServiceResult<ProgressMeasurement>> {
    try {
      this.validateContext(context);

      const sanitizedData = this.sanitizeInput(data);
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      const updateFields = [
        'value',
        'unit',
        'measuredAt',
        'measurementMethod',
        'measurementDevice',
        'bodyComposition',
        'notes',
        'photoUrl',
      ];

      const anySanitized = sanitizedData as Record<string, unknown>;
      updateFields.forEach((field) => {
        const dbField = this.camelToSnakeCase(field);
        if (anySanitized[field] !== undefined) {
          if (field === 'bodyComposition') {
            updates.push(`${dbField} = $${paramIndex++}`);
            values.push(JSON.stringify(anySanitized[field]));
          } else if (field === 'measuredAt') {
            updates.push(`${dbField} = $${paramIndex++}`);
            values.push(
              new Date(anySanitized[field] as string | number | Date)
            );
          } else {
            updates.push(`${dbField} = $${paramIndex++}`);
            values.push(anySanitized[field]);
          }
        }
      });

      if (updates.length === 0) {
        const existing = await this.getProgressMeasurement(
          measurementId,
          context
        );
        return existing.success
          ? this.createSuccessResult(existing.data!, 'No changes to update')
          : existing;
      }

      values.push(measurementId);

      const result = await this.db.queryRaw(
        `
        UPDATE progress_measurements 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex + 1}
        )
        RETURNING *
      `,
        [...values, context.userId]
      );

      if (result.length === 0) {
        return this.createErrorResult(
          'Progress measurement not found or access denied',
          'NOT_FOUND'
        );
      }

      const updatedMeasurement = this.mapProgressMeasurementFromDb(result[0]);

      await this.logEvent(
        'measurement_updated',
        'Progress measurement updated',
        context,
        {
          measurementId,
          updatedFields: Object.keys(sanitizedData),
        }
      );

      return this.createSuccessResult(
        updatedMeasurement,
        'Progress measurement updated successfully'
      );
    } catch (error) {
      return this.handleError(error, 'updateProgressMeasurement');
    }
  }

  /**
   * Delete a progress measurement
   */
  async deleteProgressMeasurement(
    measurementId: string,
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        DELETE FROM progress_measurements 
        WHERE id = ${measurementId} AND user_id = (
          SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
        )
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Progress measurement not found or access denied',
          'NOT_FOUND'
        );
      }

      await this.logEvent(
        'measurement_deleted',
        'Progress measurement deleted',
        context,
        { measurementId }
      );

      return this.createSuccessResult(
        true,
        'Progress measurement deleted successfully'
      );
    } catch (error) {
      return this.handleError(error, 'deleteProgressMeasurement');
    }
  }

  // User Achievements Operations

  /**
   * Create a new user achievement
   */
  async createUserAchievement(
    data: CreateUserAchievementRequest,
    context: ServiceContext
  ): Promise<ServiceResult<UserAchievement>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(data, [
        'achievementType',
        'achievementName',
        'description',
      ]);

      const sanitizedData = this.sanitizeInput(data);

      const result = await this.executeWithTransaction(async (client) => {
        const achievementResult = await client`
          INSERT INTO user_achievements (
            user_id,
            organization_id,
            achievement_type,
            achievement_name,
            description,
            value,
            unit,
            category,
            achieved_at,
            previous_best,
            improvement_percentage,
            related_session_id,
            related_exercise_id,
            badge_icon,
            badge_color,
            is_milestone,
            milestone_level,
            points_awarded,
            is_public
          ) VALUES (
            (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}),
            ${context.organizationId || null},
            ${sanitizedData.achievementType},
            ${sanitizedData.achievementName},
            ${sanitizedData.description},
            ${sanitizedData.value || null},
            ${sanitizedData.unit || null},
            ${sanitizedData.category || null},
            ${sanitizedData.achievedAt ? new Date(sanitizedData.achievedAt) : new Date()},
            ${sanitizedData.previousBest || null},
            ${sanitizedData.improvementPercentage || null},
            ${sanitizedData.relatedSessionId || null},
            ${sanitizedData.relatedExerciseId || null},
            ${sanitizedData.badgeIcon || null},
            ${sanitizedData.badgeColor || null},
            ${sanitizedData.isMilestone || false},
            ${sanitizedData.milestoneLevel || null},
            ${sanitizedData.pointsAwarded || 0},
            ${sanitizedData.isPublic || false}
          )
          RETURNING *
        `;

        if (achievementResult.length === 0) {
          throw new Error('Failed to create user achievement');
        }

        return this.mapUserAchievementFromDb(achievementResult[0]);
      });

      // Check if the transaction was successful
      if (!result.success) {
        return result;
      }

      await this.logEvent(
        'achievement_created',
        'User achievement created',
        context,
        {
          achievementId: result.data.id,
          type: result.data.achievementType,
        }
      );

      return this.createSuccessResult(
        result.data,
        'Achievement created successfully'
      );
    } catch (error) {
      return this.handleError(error, 'createUserAchievement');
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(
    context: ServiceContext,
    filters?: UserAchievementFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResult<PaginatedResult<UserAchievement>>> {
    try {
      this.validateContext(context);

      const { clause: whereClause, values } = this.buildUserAchievementFilters(
        filters,
        context
      );
      const offset = ((pagination?.page || 1) - 1) * (pagination?.limit || 20);
      const limit = pagination?.limit || 20;
      const sortBy = pagination?.sortBy || 'achieved_at';
      const sortOrder = pagination?.sortOrder || 'desc';

      // Get total count
      const countResult = await this.db.queryRaw<{ total: string }>(
        `
        SELECT COUNT(*) as total
        FROM user_achievements ua
        JOIN user_profiles up ON ua.user_id = up.id
        ${whereClause}
      `,
        values
      );

      const total = parseInt(countResult[0]!.total as string);

      // Get paginated results
      const result = await this.db.queryRaw(
        `
        SELECT ua.*
        FROM user_achievements ua
        JOIN user_profiles up ON ua.user_id = up.id
        ${whereClause}
        ORDER BY ua.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
        [...values, limit, offset]
      );

      const achievements = result.map((row) =>
        this.mapUserAchievementFromDb(row)
      );
      const paginatedResult = this.applyPagination(
        achievements,
        total,
        pagination || {}
      );

      await this.logEvent(
        'achievements_accessed',
        'User achievements accessed',
        context
      );

      return this.createSuccessResult(paginatedResult);
    } catch (error) {
      return this.handleError(error, 'getUserAchievements');
    }
  }

  // Helper Methods

  private async getProgressMeasurement(
    measurementId: string,
    context: ServiceContext
  ): Promise<ServiceResult<ProgressMeasurement>> {
    const result = await this.db`
      SELECT *
      FROM progress_measurements
      WHERE id = ${measurementId} AND user_id = (
        SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}
      )
    `;

    if (result.length === 0) {
      return this.createErrorResult(
        'Progress measurement not found',
        'NOT_FOUND'
      );
    }

    return this.createSuccessResult(
      this.mapProgressMeasurementFromDb(result[0])
    );
  }

  private buildProgressMeasurementFilters(
    filters: ProgressMeasurementFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Always filter by user
    conditions.push(
      `pm.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++})`
    );
    values.push(context.userId);

    if (filters.measurementType) {
      conditions.push(`pm.measurement_type = $${paramIndex++}`);
      values.push(filters.measurementType);
    }

    if (filters.measurementLocation) {
      conditions.push(`pm.measurement_location = $${paramIndex++}`);
      values.push(filters.measurementLocation);
    }

    if (filters.dateFrom) {
      conditions.push(`pm.measured_at >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`pm.measured_at <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private buildUserAchievementFilters(
    filters: UserAchievementFilters = {},
    context: ServiceContext
  ) {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by user or public achievements
    conditions.push(
      `(ua.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $${paramIndex++}) OR ua.is_public = true)`
    );
    values.push(context.userId);

    if (filters.achievementType) {
      conditions.push(`ua.achievement_type = $${paramIndex++}`);
      values.push(filters.achievementType);
    }

    if (filters.category) {
      conditions.push(`ua.category = $${paramIndex++}`);
      values.push(filters.category);
    }

    if (filters.isMilestone !== undefined) {
      conditions.push(`ua.is_milestone = $${paramIndex++}`);
      values.push(filters.isMilestone);
    }

    if (filters.dateFrom) {
      conditions.push(`ua.achieved_at >= $${paramIndex++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`ua.achieved_at <= $${paramIndex++}`);
      values.push(filters.dateTo);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private async calculateProgressTrends(userId: string, timeframeDays: number) {
    const result = await this.db`
      WITH trend_data AS (
        SELECT 
          measurement_type,
          value,
          measured_at,
          LAG(value) OVER (PARTITION BY measurement_type ORDER BY measured_at) as prev_value
        FROM progress_measurements pm
        WHERE pm.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = ${userId})
        AND pm.measured_at >= ${new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString()}
        ORDER BY measurement_type, measured_at
      )
      SELECT 
        measurement_type,
        COUNT(*) as measurement_count,
        AVG(CASE WHEN prev_value IS NOT NULL THEN value - prev_value ELSE 0 END) as avg_change
      FROM trend_data
      GROUP BY measurement_type
    `;

    const trends: Record<string, 'improving' | 'declining' | 'stable'> = {};

    result.forEach((row: any) => {
      const avgChange = parseFloat(row.avg_change as string);
      if (avgChange > 0.1) {
        trends[row.measurement_type as string] = 'improving';
      } else if (avgChange < -0.1) {
        trends[row.measurement_type as string] = 'declining';
      } else {
        trends[row.measurement_type as string] = 'stable';
      }
    });

    return trends;
  }

  private calculateOverallTrend(
    trends: Record<string, 'improving' | 'declining' | 'stable'>
  ): 'improving' | 'declining' | 'stable' {
    const trendValues = Object.values(trends);
    const improvingCount = trendValues.filter((t) => t === 'improving').length;
    const decliningCount = trendValues.filter((t) => t === 'declining').length;

    if (improvingCount > decliningCount) {
      return 'improving';
    } else if (decliningCount > improvingCount) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  }

  private mapProgressMeasurementFromDb(row: any): ProgressMeasurement {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      measurementType: row.measurement_type,
      measurementLocation: row.measurement_location,
      value: parseFloat(row.value),
      unit: row.unit,
      measuredAt: new Date(row.measured_at),
      measurementMethod: row.measurement_method,
      measurementDevice: row.measurement_device,
      bodyComposition: row.body_composition || {},
      notes: row.notes,
      photoUrl: row.photo_url,
      isVerified: row.is_verified,
      verifiedBy: row.verified_by,
      confidenceScore: row.confidence_score,
      createdAt: new Date(row.created_at),
    };
  }

  private mapUserAchievementFromDb(row: any): UserAchievement {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      achievementType: row.achievement_type,
      achievementName: row.achievement_name,
      description: row.description,
      value: row.value ? parseFloat(row.value) : undefined,
      unit: row.unit,
      category: row.category,
      achievedAt: new Date(row.achieved_at),
      previousBest: row.previous_best
        ? parseFloat(row.previous_best)
        : undefined,
      improvementPercentage: row.improvement_percentage
        ? parseFloat(row.improvement_percentage)
        : undefined,
      relatedSessionId: row.related_session_id,
      relatedExerciseId: row.related_exercise_id,
      badgeIcon: row.badge_icon,
      badgeColor: row.badge_color,
      isMilestone: row.is_milestone,
      milestoneLevel: row.milestone_level,
      pointsAwarded: row.points_awarded,
      isPublic: row.is_public,
      sharedAt: row.shared_at ? new Date(row.shared_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

export default ProgressService;
