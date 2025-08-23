/**
 * AI Workout Generation Service
 * Handles AI-powered workout and exercise generation
 */

import { BaseService, ServiceContext, ServiceResult } from './base';
import {
  WorkoutGenerationRequest,
  ExerciseRecommendationRequest,
  WorkoutGenerationJob,
} from '@/types/workouts';

export interface AIProvider {
  name: string;
  generateWorkoutPlan(
    prompt: string,
    parameters: Record<string, any>
  ): Promise<any>;
  generateExerciseRecommendations(
    prompt: string,
    parameters: Record<string, any>
  ): Promise<any>;
  generateSingleSession(
    prompt: string,
    parameters: Record<string, any>
  ): Promise<any>;
}

export interface AIResponse {
  content: any;
  tokensUsed: number;
  costCents: number;
  processingTimeMs: number;
  modelVersion: string;
}

export interface GenerationJobUpdate {
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  errorMessage?: string;
  resultData?: any;
  tokensUsed?: number;
  costCents?: number;
  processingDurationMs?: number;
}

export class AIWorkoutService extends BaseService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = 'openai';

  constructor() {
    super('ai_workout_service');
    this.initializeProviders();
  }

  /**
   * Initialize AI providers
   */
  private initializeProviders(): void {
    // OpenAI provider will be implemented
    if (process.env.OPENAI_API_KEY) {
      // this.providers.set('openai', new OpenAIProvider())
      console.log('OpenAI provider would be initialized here');
    }

    // Anthropic provider will be implemented
    if (process.env.ANTHROPIC_API_KEY) {
      // this.providers.set('anthropic', new AnthropicProvider())
      console.log('Anthropic provider would be initialized here');
    }

    // Google provider will be implemented
    if (process.env.GOOGLE_AI_API_KEY) {
      // this.providers.set('google', new GoogleProvider())
      console.log('Google AI provider would be initialized here');
    }
  }

  /**
   * Create a new workout generation job
   */
  async createWorkoutGenerationJob(
    request: WorkoutGenerationRequest,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutGenerationJob>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(request, [
        'jobType',
        'generationPrompt',
        'userPreferences',
        'fitnessProfile',
      ]);

      const sanitizedRequest = this.sanitizeInput(request);

      // Create generation job record
      const result = await this.executeWithTransaction(async (client) => {
        const jobResult = await client`
          INSERT INTO workout_generation_jobs (
            user_id,
            organization_id,
            job_type,
            status,
            generation_prompt,
            user_preferences,
            fitness_profile,
            equipment_available,
            time_constraints,
            ai_provider,
            ai_model,
            model_version,
            generation_parameters
          ) VALUES (
            (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId}),
            ${context.organizationId || null},
            ${sanitizedRequest.jobType},
            'pending',
            ${sanitizedRequest.generationPrompt},
            ${JSON.stringify(sanitizedRequest.userPreferences)},
            ${JSON.stringify(sanitizedRequest.fitnessProfile)},
            ${JSON.stringify(sanitizedRequest.equipmentAvailable || [])},
            ${JSON.stringify(sanitizedRequest.timeConstraints || {})},
            ${this.defaultProvider},
            ${this.getDefaultModel(this.defaultProvider)},
            ${this.getModelVersion(this.defaultProvider)},
            ${JSON.stringify(sanitizedRequest.generationParameters || {})}
          )
          RETURNING *
        `;

        if (jobResult.length === 0) {
          throw new Error('Failed to create workout generation job');
        }

        return this.mapWorkoutGenerationJobFromDb(jobResult[0]);
      });

      if (result.success) {
        await this.logEvent(
          'generation_job_created',
          'AI workout generation job created',
          context,
          {
            jobId: result.data.id,
            jobType: result.data.jobType,
          }
        );

        // Start background processing
        this.processGenerationJobAsync(result.data.id, context).catch(
          (error) => {
            console.error('Background job processing failed:', error);
          }
        );

        return this.createSuccessResult(
          result.data,
          'Workout generation job created successfully'
        );
      }

      return result;
    } catch (error) {
      return this.handleError(error, 'createWorkoutGenerationJob');
    }
  }

  /**
   * Get workout generation jobs for a user
   */
  async getWorkoutGenerationJobs(
    context: ServiceContext,
    filters?: { jobType?: string; status?: string; limit?: number }
  ): Promise<ServiceResult<WorkoutGenerationJob[]>> {
    try {
      this.validateContext(context);

      const limit = Math.min(100, filters?.limit || 50);

      let whereClause =
        'WHERE wgj.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = $1)';
      const values: any[] = [context.userId];
      let paramIndex = 2;

      if (filters?.jobType) {
        whereClause += ` AND wgj.job_type = $${paramIndex++}`;
        values.push(filters.jobType);
      }

      if (filters?.status) {
        whereClause += ` AND wgj.status = $${paramIndex++}`;
        values.push(filters.status);
      }

      const sql = `
        SELECT wgj.*
        FROM workout_generation_jobs wgj
        ${whereClause}
        ORDER BY wgj.created_at DESC
        LIMIT $${paramIndex}
      `;

      const result = await this.db.queryRaw(sql, [...values, limit]);

      const jobs = result.map((row) => this.mapWorkoutGenerationJobFromDb(row));

      await this.logEvent(
        'generation_jobs_accessed',
        'AI generation jobs accessed',
        context
      );

      return this.createSuccessResult(jobs);
    } catch (error) {
      return this.handleError(error, 'getWorkoutGenerationJobs');
    }
  }

  /**
   * Get a specific workout generation job
   */
  async getWorkoutGenerationJob(
    jobId: string,
    context: ServiceContext
  ): Promise<ServiceResult<WorkoutGenerationJob>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        SELECT wgj.*
        FROM workout_generation_jobs wgj
        WHERE wgj.id = ${jobId} 
        AND wgj.user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId})
      `;

      if (result.length === 0) {
        return this.createErrorResult('Generation job not found', 'NOT_FOUND');
      }

      const job = this.mapWorkoutGenerationJobFromDb(result[0]);

      await this.logEvent(
        'generation_job_accessed',
        'AI generation job accessed',
        context,
        { jobId }
      );

      return this.createSuccessResult(job);
    } catch (error) {
      return this.handleError(error, 'getWorkoutGenerationJob');
    }
  }

  /**
   * Cancel a workout generation job
   */
  async cancelWorkoutGenerationJob(
    jobId: string,
    context: ServiceContext
  ): Promise<ServiceResult<boolean>> {
    try {
      this.validateContext(context);

      const result = await this.db`
        UPDATE workout_generation_jobs 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${jobId} 
        AND user_id = (SELECT id FROM user_profiles WHERE clerk_user_id = ${context.userId})
        AND status IN ('pending', 'generating')
      `;

      if (result.length === 0) {
        return this.createErrorResult(
          'Generation job not found or cannot be cancelled',
          'NOT_FOUND'
        );
      }

      await this.logEvent(
        'generation_job_cancelled',
        'AI generation job cancelled',
        context,
        { jobId }
      );

      return this.createSuccessResult(
        true,
        'Generation job cancelled successfully'
      );
    } catch (error) {
      return this.handleError(error, 'cancelWorkoutGenerationJob');
    }
  }

  /**
   * Generate exercise recommendations
   */
  async generateExerciseRecommendations(
    request: ExerciseRecommendationRequest,
    context: ServiceContext
  ): Promise<ServiceResult<any[]>> {
    try {
      this.validateContext(context);
      this.validateRequiredFields(request, [
        'targetMuscleGroups',
        'sessionDuration',
      ]);

      const provider = this.providers.get(this.defaultProvider);
      if (!provider) {
        return this.createErrorResult(
          'AI provider not available',
          'SERVICE_UNAVAILABLE'
        );
      }

      // Build recommendation prompt
      const prompt = this.buildExerciseRecommendationPrompt(request, context);
      const parameters = this.buildExerciseRecommendationParameters(request);

      await this.logEvent(
        'exercise_recommendations_started',
        'Exercise recommendations generation started',
        context
      );

      // Generate recommendations
      const startTime = Date.now();
      const response = await provider.generateExerciseRecommendations(
        prompt,
        parameters
      );
      const processingTime = Date.now() - startTime;

      // Parse and validate AI response
      const recommendations = this.parseExerciseRecommendations(response);

      await this.logEvent(
        'exercise_recommendations_completed',
        'Exercise recommendations generated',
        context,
        {
          count: recommendations.length,
          processingTimeMs: processingTime,
          tokensUsed: response.tokensUsed,
        }
      );

      return this.createSuccessResult(recommendations);
    } catch (error) {
      return this.handleError(error, 'generateExerciseRecommendations');
    }
  }

  /**
   * Process workout generation job asynchronously
   */
  private async processGenerationJobAsync(
    jobId: string,
    context: ServiceContext
  ): Promise<void> {
    try {
      // Update job status to generating
      await this.updateJobStatus(jobId, { status: 'generating' });

      // Get job details
      const jobResult = await this.getWorkoutGenerationJob(jobId, context);
      if (!jobResult.success || !jobResult.data) {
        throw new Error('Job not found');
      }

      const job = jobResult.data;
      const provider = this.providers.get(job.aiProvider);
      if (!provider) {
        throw new Error('AI provider not available');
      }

      const startTime = Date.now();

      try {
        let aiResponse: any;

        switch (job.jobType) {
          case 'workout_plan':
            const planPrompt = this.buildWorkoutPlanPrompt(job, context);
            const planParameters = this.buildWorkoutPlanParameters(job);
            aiResponse = await provider.generateWorkoutPlan(
              planPrompt,
              planParameters
            );
            break;

          case 'single_session':
            const sessionPrompt = this.buildSingleSessionPrompt(job, context);
            const sessionParameters = this.buildSessionParameters(job);
            aiResponse = await provider.generateSingleSession(
              sessionPrompt,
              sessionParameters
            );
            break;

          case 'exercise_recommendation':
            const exercisePrompt =
              this.buildExerciseRecommendationPromptFromJob(job, context);
            const exerciseParameters = this.buildExerciseParametersFromJob(job);
            aiResponse = await provider.generateExerciseRecommendations(
              exercisePrompt,
              exerciseParameters
            );
            break;

          default:
            throw new Error(`Unsupported job type: ${job.jobType}`);
        }

        const processingTime = Date.now() - startTime;

        // Process AI response and create workout plan/session if applicable
        const resultData = await this.processAIResponse(
          job,
          aiResponse,
          context
        );

        // Update job as completed
        await this.updateJobStatus(jobId, {
          status: 'completed',
          resultData,
          tokensUsed: aiResponse.tokensUsed,
          costCents: aiResponse.costCents,
          processingDurationMs: processingTime,
        });

        await this.logEvent(
          'generation_job_completed',
          'AI generation job completed successfully',
          context,
          {
            jobId,
            processingTimeMs: processingTime,
            tokensUsed: aiResponse.tokensUsed,
          }
        );
      } catch (error) {
        const processingTime = Date.now() - startTime;

        // Update job as failed
        await this.updateJobStatus(jobId, {
          status: 'failed',
          errorMessage: (error as Error).message,
          processingDurationMs: processingTime,
        });

        await this.logEvent(
          'generation_job_failed',
          'AI generation job failed',
          context,
          {
            jobId,
            error: (error as Error).message,
            processingTimeMs: processingTime,
          }
        );

        throw error;
      }
    } catch (error) {
      console.error(`Error processing generation job ${jobId}:`, error);
    }
  }

  /**
   * Update job status and metadata
   */
  private async updateJobStatus(
    jobId: string,
    update: GenerationJobUpdate
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (update.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(update.status);
    }

    if (update.errorMessage !== undefined) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(update.errorMessage);
    }

    if (update.resultData !== undefined) {
      updates.push(`result_data = $${paramIndex++}`);
      values.push(JSON.stringify(update.resultData));
    }

    if (update.tokensUsed !== undefined) {
      updates.push(`tokens_used = $${paramIndex++}`);
      values.push(update.tokensUsed);
    }

    if (update.costCents !== undefined) {
      updates.push(`cost_cents = $${paramIndex++}`);
      values.push(update.costCents);
    }

    if (update.processingDurationMs !== undefined) {
      updates.push(`processing_duration_ms = $${paramIndex++}`);
      values.push(update.processingDurationMs);
    }

    if (
      update.status === 'generating' &&
      !updates.find((u) => u.includes('started_at'))
    ) {
      updates.push(`started_at = CURRENT_TIMESTAMP`);
    }

    if (['completed', 'failed', 'cancelled'].includes(update.status || '')) {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(jobId);

    if (updates.length > 1) {
      // More than just updated_at
      const sql = `
        UPDATE workout_generation_jobs 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await this.db.queryRaw(sql, values);
    }
  }

  // Prompt building methods
  private buildWorkoutPlanPrompt(
    job: WorkoutGenerationJob,
    context: ServiceContext
  ): string {
    const preferences = job.userPreferences;
    const profile = job.fitnessProfile;

    return `Generate a comprehensive ${preferences.trainingDaysPerWeek}-day per week workout plan for a ${profile.currentLevel} level individual.

User Requirements:
- Fitness Goals: ${preferences.fitnessGoals.join(', ')}
- Training Days: ${preferences.trainingDaysPerWeek} days per week
- Session Duration: ${preferences.sessionDurationMinutes} minutes per session
- Equipment Available: ${job.equipmentAvailable.length > 0 ? 'Yes' : 'Minimal/Bodyweight'}
- Fitness Level: ${profile.currentLevel}
- Injuries/Limitations: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'None'}

Custom Prompt: ${job.generationPrompt}

Please provide a structured workout plan with:
1. Weekly schedule
2. Exercise selection with sets, reps, and progression
3. Warm-up and cool-down routines
4. Progression strategy
5. Recovery and rest day recommendations

Format the response as structured JSON that can be parsed programmatically.`;
  }

  private buildSingleSessionPrompt(
    job: WorkoutGenerationJob,
    context: ServiceContext
  ): string {
    const preferences = job.userPreferences;
    const profile = job.fitnessProfile;

    return `Generate a single workout session for a ${profile.currentLevel} level individual.

Session Requirements:
- Duration: ${preferences.sessionDurationMinutes} minutes
- Fitness Goals: ${preferences.fitnessGoals.join(', ')}
- Equipment Available: ${job.equipmentAvailable.length > 0 ? 'Yes' : 'Minimal/Bodyweight'}
- Fitness Level: ${profile.currentLevel}
- Injuries/Limitations: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'None'}

Custom Prompt: ${job.generationPrompt}

Please provide a complete workout session with:
1. Warm-up exercises (5-10 minutes)
2. Main workout with specific exercises, sets, reps, and rest periods
3. Cool-down routine (5-10 minutes)
4. Exercise modifications for different fitness levels
5. Safety considerations

Format the response as structured JSON.`;
  }

  private buildExerciseRecommendationPrompt(
    request: ExerciseRecommendationRequest,
    context: ServiceContext
  ): string {
    return `Recommend ${request.count} exercises for a workout session.

Requirements:
- Target Muscle Groups: ${request.targetMuscleGroups.join(', ')}
- Exclude: ${request.excludeMuscleGroups?.join(', ') || 'None'}
- Exercise Types: ${request.exerciseTypes?.join(', ') || 'Any'}
- Difficulty: ${request.difficultyLevel || 'Any'}
- Session Duration: ${request.sessionDuration} minutes
- Equipment: ${(request.equipmentAvailable?.length ?? 0) > 0 ? 'Available' : 'Minimal/Bodyweight'}
- Goals: ${request.fitnessGoals?.join(', ') || 'General fitness'}
- Limitations: ${request.limitations?.join(', ') || 'None'}

Provide exercises with detailed instructions, sets, reps, and modifications.
Format as structured JSON with exercise details.`;
  }

  private buildExerciseRecommendationPromptFromJob(
    job: WorkoutGenerationJob,
    context: ServiceContext
  ): string {
    // This would be built from job parameters if the job type is exercise_recommendation
    return job.generationPrompt;
  }

  // Parameter building methods
  private buildWorkoutPlanParameters(
    job: WorkoutGenerationJob
  ): Record<string, any> {
    return {
      maxTokens: 4000,
      temperature: 0.7,
      structuredOutput: true,
      ...job.generationParameters,
    };
  }

  private buildSessionParameters(
    job: WorkoutGenerationJob
  ): Record<string, any> {
    return {
      maxTokens: 2000,
      temperature: 0.7,
      structuredOutput: true,
      ...job.generationParameters,
    };
  }

  private buildExerciseRecommendationParameters(
    request: ExerciseRecommendationRequest
  ): Record<string, any> {
    return {
      maxTokens: 1500,
      temperature: 0.8,
      structuredOutput: true,
    };
  }

  private buildExerciseParametersFromJob(
    job: WorkoutGenerationJob
  ): Record<string, any> {
    return {
      maxTokens: 1500,
      temperature: 0.8,
      structuredOutput: true,
      ...job.generationParameters,
    };
  }

  // AI response processing
  private async processAIResponse(
    job: WorkoutGenerationJob,
    response: any,
    context: ServiceContext
  ): Promise<any> {
    switch (job.jobType) {
      case 'workout_plan':
        return this.processWorkoutPlanResponse(response, job, context);
      case 'single_session':
        return this.processSessionResponse(response, job, context);
      case 'exercise_recommendation':
        return this.processExerciseRecommendationResponse(response);
      default:
        return response;
    }
  }

  private async processWorkoutPlanResponse(
    response: any,
    job: WorkoutGenerationJob,
    context: ServiceContext
  ): Promise<any> {
    // This would create actual workout plan in database if needed
    // For now, just return the structured response
    return {
      type: 'workout_plan',
      generatedContent: response.content,
      metadata: {
        jobId: job.id,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async processSessionResponse(
    response: any,
    job: WorkoutGenerationJob,
    context: ServiceContext
  ): Promise<any> {
    // This would create actual session in database if needed
    return {
      type: 'workout_session',
      generatedContent: response.content,
      metadata: {
        jobId: job.id,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private processExerciseRecommendationResponse(response: any): any[] {
    return this.parseExerciseRecommendations(response);
  }

  private parseExerciseRecommendations(response: any): any[] {
    // Parse AI response into structured exercise recommendations
    if (response.content && Array.isArray(response.content.exercises)) {
      return response.content.exercises;
    }
    return [];
  }

  // Helper methods
  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4';
      case 'anthropic':
        return 'claude-3-sonnet';
      case 'google':
        return 'gemini-pro';
      default:
        return 'gpt-4';
    }
  }

  private getModelVersion(provider: string): string {
    switch (provider) {
      case 'openai':
        return '2024-02-15';
      case 'anthropic':
        return '2024-02-15';
      case 'google':
        return '1.0';
      default:
        return '1.0';
    }
  }

  private mapWorkoutGenerationJobFromDb(row: any): WorkoutGenerationJob {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      jobType: row.job_type,
      status: row.status,
      generationPrompt: row.generation_prompt,
      userPreferences: row.user_preferences || {},
      fitnessProfile: row.fitness_profile || {},
      equipmentAvailable: row.equipment_available || [],
      timeConstraints: row.time_constraints || {},
      aiProvider: row.ai_provider,
      aiModel: row.ai_model,
      modelVersion: row.model_version,
      generationParameters: row.generation_parameters || {},
      resultData: row.result_data || {},
      generatedPlanId: row.generated_plan_id,
      generatedSessionId: row.generated_session_id,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      processingDurationMs: row.processing_duration_ms,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      tokensUsed: row.tokens_used,
      costCents: row.cost_cents ? parseFloat(row.cost_cents) : 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export default AIWorkoutService;
