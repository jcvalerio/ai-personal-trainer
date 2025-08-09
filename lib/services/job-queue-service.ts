/**
 * Job Queue Service
 * Handles background job processing for async operations
 */

import { BaseService, ServiceContext, ServiceResult } from './base'

export interface Job {
  id: string
  type: string
  priority: number
  data: any
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  result?: any
}

export interface JobProcessor {
  process(job: Job): Promise<any>
}

export interface JobQueueOptions {
  concurrency?: number
  maxAttempts?: number
  retryDelay?: number
  cleanupInterval?: number
  maxJobAge?: number
}

export interface JobStats {
  pending: number
  running: number
  completed: number
  failed: number
  totalProcessed: number
  averageProcessingTime: number
}

export class JobQueueService extends BaseService {
  private processors: Map<string, JobProcessor> = new Map()
  private runningJobs: Map<string, Promise<void>> = new Map()
  private isProcessing = false
  private processingInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout
  
  private options: Required<JobQueueOptions> = {
    concurrency: 5,
    maxAttempts: 3,
    retryDelay: 5000, // 5 seconds
    cleanupInterval: 3600000, // 1 hour
    maxJobAge: 604800000 // 7 days
  }

  constructor(options?: JobQueueOptions) {
    super('job_queue_service')
    if (options) {
      this.options = { ...this.options, ...options }
    }
    this.initializeCleanup()
  }

  /**
   * Register a job processor
   */
  registerProcessor(jobType: string, processor: JobProcessor): void {
    this.processors.set(jobType, processor)
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    type: string,
    data: any,
    options?: {
      priority?: number
      delay?: number
      maxAttempts?: number
      scheduledAt?: Date
    }
  ): Promise<ServiceResult<Job>> {
    try {
      const priority = options?.priority || 0
      const maxAttempts = options?.maxAttempts || this.options.maxAttempts
      const scheduledAt = options?.scheduledAt || (options?.delay ? new Date(Date.now() + options.delay) : new Date())

      const result = await this.executeWithTransaction(async (client) => {
        // Create jobs table if it doesn't exist (in a real implementation, this would be in migrations)
        await client.query(`
          CREATE TABLE IF NOT EXISTS job_queue (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type VARCHAR(100) NOT NULL,
            priority INTEGER DEFAULT 0,
            data JSONB NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            result_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // Create index if it doesn't exist
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_job_queue_status_priority 
          ON job_queue(status, priority DESC, scheduled_at ASC)
        `)

        // Insert job
        const jobResult = await client.query(`
          INSERT INTO job_queue (
            type, priority, data, max_attempts, scheduled_at
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [type, priority, JSON.stringify(data), maxAttempts, scheduledAt])

        if (jobResult.rows.length === 0) {
          throw new Error('Failed to create job')
        }

        return this.mapJobFromDb(jobResult.rows[0])
      })

      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing()
      }

      return this.createSuccessResult(result, 'Job added to queue successfully')
    } catch (error) {
      return this.handleError(error, 'addJob')
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<ServiceResult<Job>> {
    try {
      const result = await this.db.query(`
        SELECT * FROM job_queue WHERE id = $1
      `, [jobId])

      if (result.rows.length === 0) {
        return this.createErrorResult('Job not found', 'NOT_FOUND')
      }

      const job = this.mapJobFromDb(result.rows[0])
      return this.createSuccessResult(job)
    } catch (error) {
      return this.handleError(error, 'getJob')
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    status: string,
    limit = 50,
    offset = 0
  ): Promise<ServiceResult<Job[]>> {
    try {
      const result = await this.db.query(`
        SELECT * FROM job_queue 
        WHERE status = $1 
        ORDER BY priority DESC, created_at ASC 
        LIMIT $2 OFFSET $3
      `, [status, limit, offset])

      const jobs = result.rows.map(row => this.mapJobFromDb(row))
      return this.createSuccessResult(jobs)
    } catch (error) {
      return this.handleError(error, 'getJobsByStatus')
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<ServiceResult<JobStats>> {
    try {
      const result = await this.db.query(`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) as avg_processing_time
        FROM job_queue 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
      `)

      const stats: JobStats = {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0,
        averageProcessingTime: 0
      }

      let totalProcessingTime = 0
      let processedCount = 0

      result.rows.forEach(row => {
        const count = parseInt(row.count)
        const avgTime = parseFloat(row.avg_processing_time) || 0

        switch (row.status) {
          case 'pending':
            stats.pending = count
            break
          case 'running':
            stats.running = count
            break
          case 'completed':
            stats.completed = count
            processedCount += count
            totalProcessingTime += avgTime * count
            break
          case 'failed':
            stats.failed = count
            processedCount += count
            break
        }
      })

      stats.totalProcessed = processedCount
      stats.averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0

      return this.createSuccessResult(stats)
    } catch (error) {
      return this.handleError(error, 'getJobStats')
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.db.query(`
        UPDATE job_queue 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status IN ('pending', 'running')
        RETURNING id
      `, [jobId])

      if (result.rows.length === 0) {
        return this.createErrorResult('Job not found or cannot be cancelled', 'NOT_FOUND')
      }

      return this.createSuccessResult(true, 'Job cancelled successfully')
    } catch (error) {
      return this.handleError(error, 'cancelJob')
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.db.query(`
        UPDATE job_queue 
        SET status = 'pending', 
            attempts = 0,
            error_message = NULL,
            scheduled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'failed'
        RETURNING id
      `, [jobId])

      if (result.rows.length === 0) {
        return this.createErrorResult('Job not found or not in failed state', 'NOT_FOUND')
      }

      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing()
      }

      return this.createSuccessResult(true, 'Job queued for retry')
    } catch (error) {
      return this.handleError(error, 'retryJob')
    }
  }

  /**
   * Start job processing
   */
  private startProcessing(): void {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    this.processingInterval = setInterval(() => {
      this.processJobs().catch(error => {
        console.error('Error in job processing:', error)
      })
    }, 1000) // Check for jobs every second
  }

  /**
   * Stop job processing
   */
  stopProcessing(): void {
    this.isProcessing = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
  }

  /**
   * Process pending jobs
   */
  private async processJobs(): Promise<void> {
    if (this.runningJobs.size >= this.options.concurrency) {
      return
    }

    try {
      // Get next jobs to process
      const availableSlots = this.options.concurrency - this.runningJobs.size
      const result = await this.db.query(`
        SELECT * FROM job_queue 
        WHERE status = 'pending' 
        AND scheduled_at <= CURRENT_TIMESTAMP
        ORDER BY priority DESC, scheduled_at ASC 
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `, [availableSlots])

      if (result.rows.length === 0) {
        return
      }

      // Start processing each job
      for (const jobRow of result.rows) {
        const job = this.mapJobFromDb(jobRow)
        this.processJob(job).catch(error => {
          console.error(`Error processing job ${job.id}:`, error)
        })
      }
    } catch (error) {
      console.error('Error fetching jobs to process:', error)
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const processor = this.processors.get(job.type)
    if (!processor) {
      await this.markJobFailed(job.id, `No processor registered for job type: ${job.type}`)
      return
    }

    // Mark job as running
    const processingPromise = this.executeJobWithProcessor(job, processor)
    this.runningJobs.set(job.id, processingPromise)

    try {
      await processingPromise
    } finally {
      this.runningJobs.delete(job.id)
    }
  }

  /**
   * Execute job with processor
   */
  private async executeJobWithProcessor(job: Job, processor: JobProcessor): Promise<void> {
    try {
      // Update job as running
      await this.db.query(`
        UPDATE job_queue 
        SET status = 'running', 
            attempts = attempts + 1,
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [job.id])

      // Process the job
      const startTime = Date.now()
      const result = await processor.process(job)
      const processingTime = Date.now() - startTime

      // Mark job as completed
      await this.db.query(`
        UPDATE job_queue 
        SET status = 'completed',
            result_data = $1,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [JSON.stringify(result), job.id])

      console.log(`Job ${job.id} completed in ${processingTime}ms`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if job should be retried
      const updatedJob = await this.getJobFromDb(job.id)
      if (updatedJob && updatedJob.attempts < updatedJob.maxAttempts) {
        // Schedule retry
        const retryDelay = this.calculateRetryDelay(updatedJob.attempts)
        const nextRetry = new Date(Date.now() + retryDelay)
        
        await this.db.query(`
          UPDATE job_queue 
          SET status = 'pending',
              error_message = $1,
              scheduled_at = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [errorMessage, nextRetry, job.id])

        console.log(`Job ${job.id} failed, retrying in ${retryDelay}ms`)
      } else {
        // Mark as permanently failed
        await this.markJobFailed(job.id, errorMessage)
        console.error(`Job ${job.id} permanently failed:`, errorMessage)
      }
    }
  }

  /**
   * Mark job as failed
   */
  private async markJobFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.db.query(`
      UPDATE job_queue 
      SET status = 'failed',
          error_message = $1,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [errorMessage, jobId])
  }

  /**
   * Get job from database
   */
  private async getJobFromDb(jobId: string): Promise<Job | null> {
    const result = await this.db.query(`
      SELECT * FROM job_queue WHERE id = $1
    `, [jobId])

    return result.rows.length > 0 ? this.mapJobFromDb(result.rows[0]) : null
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempts: number): number {
    return Math.min(this.options.retryDelay * Math.pow(2, attempts - 1), 300000) // Max 5 minutes
  }

  /**
   * Initialize cleanup process
   */
  private initializeCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs().catch(error => {
        console.error('Error in job cleanup:', error)
      })
    }, this.options.cleanupInterval)
  }

  /**
   * Clean up old jobs
   */
  private async cleanupOldJobs(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.options.maxJobAge)
      
      const result = await this.db.query(`
        DELETE FROM job_queue 
        WHERE status IN ('completed', 'failed', 'cancelled') 
        AND completed_at < $1
        RETURNING id
      `, [cutoffDate])

      if (result.rows.length > 0) {
        console.log(`Cleaned up ${result.rows.length} old jobs`)
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error)
    }
  }

  /**
   * Map database row to Job object
   */
  private mapJobFromDb(row: any): Job {
    return {
      id: row.id,
      type: row.type,
      priority: row.priority,
      data: row.data || {},
      status: row.status,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error_message,
      result: row.result_data
    }
  }

  /**
   * Cleanup when service is destroyed
   */
  destroy(): void {
    this.stopProcessing()
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }
}

export default JobQueueService