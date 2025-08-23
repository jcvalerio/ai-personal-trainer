/**
 * Job Manager
 * Centralized job queue management and processor registration
 */

import JobQueueService from '@/lib/services/job-queue-service';
import WorkoutGenerationProcessor from './workout-generation-processor';

export class JobManager {
  private static instance: JobManager;
  private jobQueue: JobQueueService;
  private isInitialized = false;

  private constructor() {
    this.jobQueue = new JobQueueService({
      concurrency: parseInt(process.env.JOB_QUEUE_CONCURRENCY || '3'),
      maxAttempts: parseInt(process.env.JOB_QUEUE_MAX_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.JOB_QUEUE_RETRY_DELAY || '5000'),
      cleanupInterval: parseInt(
        process.env.JOB_QUEUE_CLEANUP_INTERVAL || '3600000'
      ), // 1 hour
      maxJobAge: parseInt(process.env.JOB_QUEUE_MAX_JOB_AGE || '604800000'), // 7 days
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  /**
   * Initialize job processors
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Register workout generation processor
    this.jobQueue.registerProcessor(
      'workout_generation',
      new WorkoutGenerationProcessor()
    );

    // Register other processors here as needed
    // this.jobQueue.registerProcessor('email_notification', new EmailNotificationProcessor())
    // this.jobQueue.registerProcessor('data_export', new DataExportProcessor())
    // this.jobQueue.registerProcessor('progress_analysis', new ProgressAnalysisProcessor())

    this.isInitialized = true;
    console.log('Job Manager initialized with processors');
  }

  /**
   * Get the job queue service
   */
  getJobQueue(): JobQueueService {
    return this.jobQueue;
  }

  /**
   * Add a workout generation job
   */
  async addWorkoutGenerationJob(data: {
    jobId: string;
    userId: string;
    organizationId?: string;
  }): Promise<any> {
    return await this.jobQueue.addJob('workout_generation', data, {
      priority: 10, // High priority for AI generation
    });
  }

  /**
   * Add an email notification job
   */
  async addEmailNotificationJob(data: {
    to: string;
    subject: string;
    template: string;
    data: any;
  }): Promise<any> {
    return await this.jobQueue.addJob('email_notification', data, {
      priority: 5, // Medium priority
    });
  }

  /**
   * Add a data export job
   */
  async addDataExportJob(data: {
    userId: string;
    exportType: string;
    dateRange?: { from: Date; to: Date };
  }): Promise<any> {
    return await this.jobQueue.addJob('data_export', data, {
      priority: 1, // Low priority, can take time
    });
  }

  /**
   * Add a progress analysis job
   */
  async addProgressAnalysisJob(data: {
    userId: string;
    analysisType: string;
    parameters: any;
  }): Promise<any> {
    return await this.jobQueue.addJob('progress_analysis', data, {
      priority: 3, // Medium-low priority
    });
  }

  /**
   * Schedule a recurring job
   */
  async scheduleRecurringJob(
    type: string,
    data: any,
    cronExpression: string
  ): Promise<any> {
    // This would integrate with a cron scheduler
    // For now, we'll just add it as a regular job
    return await this.jobQueue.addJob(type, {
      ...data,
      recurring: true,
      cron: cronExpression,
    });
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<any> {
    return await this.jobQueue.getJobStats();
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    status: string,
    limit?: number,
    offset?: number
  ): Promise<any> {
    return await this.jobQueue.getJobsByStatus(status, limit, offset);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<any> {
    return await this.jobQueue.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<any> {
    return await this.jobQueue.cancelJob(jobId);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<any> {
    return await this.jobQueue.retryJob(jobId);
  }

  /**
   * Health check for job system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    stats: any;
    issues: string[];
  }> {
    try {
      const stats = await this.getJobStats();
      if (!stats.success) {
        return {
          status: 'unhealthy',
          stats: null,
          issues: ['Failed to retrieve job statistics'],
        };
      }

      const jobStats = stats.data!;
      const issues: string[] = [];

      // Check for high failure rate
      const totalProcessed = jobStats.completed + jobStats.failed;
      if (totalProcessed > 0) {
        const failureRate = jobStats.failed / totalProcessed;
        if (failureRate > 0.1) {
          // More than 10% failure rate
          issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
        }
      }

      // Check for stuck jobs
      if (jobStats.running > 10) {
        issues.push(`Many jobs running simultaneously: ${jobStats.running}`);
      }

      // Check for backlog
      if (jobStats.pending > 100) {
        issues.push(`Large job backlog: ${jobStats.pending} pending jobs`);
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (issues.length > 2) {
        status = 'unhealthy';
      } else if (issues.length > 0) {
        status = 'degraded';
      }

      return {
        status,
        stats: jobStats,
        issues,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        stats: null,
        issues: ['Failed to perform health check', (error as Error).message],
      };
    }
  }

  /**
   * Shutdown the job manager gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Job Manager...');
    this.jobQueue.stopProcessing();
    this.jobQueue.destroy();
    this.isInitialized = false;
    console.log('Job Manager shut down successfully');
  }
}

// Create and export singleton instance
export const jobManager = JobManager.getInstance();

// Initialize on import
if (process.env.NODE_ENV !== 'test') {
  jobManager.initialize();
}

export default JobManager;
