import Bull, { Job, JobOptions, Queue } from 'bull'
import Redis from 'redis'
import { createLogger } from '@/utils/logger'

const logger = createLogger('JobQueueService')

export interface JobData {
  [key: string]: any
}

export interface JobResult {
  success: boolean
  data?: any
  error?: string
}

export enum JobType {
  AI_GENERATION = 'ai-generation',
  IMAGE_PROCESSING = 'image-processing',
  EMAIL_NOTIFICATION = 'email-notification',
  TRANSACTION_PROCESSING = 'transaction-processing',
  CACHE_WARMING = 'cache-warming',
  CLEANUP = 'cleanup'
}

class JobQueueService {
  private queues: Map<string, Queue> = new Map()
  private redisClient: Redis.RedisClientType | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize Redis connection for Bull queues
      this.redisClient = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1') // Use different DB for jobs
      })

      await this.redisClient.connect()

      // Initialize queues for different job types
      this.queues.set(JobType.AI_GENERATION, this.createQueue(JobType.AI_GENERATION))
      this.queues.set(JobType.IMAGE_PROCESSING, this.createQueue(JobType.IMAGE_PROCESSING))
      this.queues.set(JobType.EMAIL_NOTIFICATION, this.createQueue(JobType.EMAIL_NOTIFICATION))
      this.queues.set(JobType.TRANSACTION_PROCESSING, this.createQueue(JobType.TRANSACTION_PROCESSING))
      this.queues.set(JobType.CACHE_WARMING, this.createQueue(JobType.CACHE_WARMING))
      this.queues.set(JobType.CLEANUP, this.createQueue(JobType.CLEANUP))

      this.isInitialized = true
      logger.info('Job queue service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize job queue service:', error)
      throw error
    }
  }

  private createQueue(name: string): Queue {
    const queue = new Bull(name, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1')
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    })

    // Set up event listeners
    queue.on('completed', (job: Job, result: JobResult) => {
      logger.info(`Job ${job.id} (${job.name}) completed successfully`, { result })
    })

    queue.on('failed', (job: Job, err: Error) => {
      logger.error(`Job ${job.id} (${job.name}) failed:`, err)
    })

    queue.on('stalled', (job: Job) => {
      logger.warn(`Job ${job.id} (${job.name}) stalled`)
    })

    return queue
  }

  async addJob<T extends JobData>(
    type: JobType,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    const job = await queue.add(data, {
      ...options,
      // Set default priority based on job type
      priority: this.getJobPriority(type)
    })

    logger.info(`Job added: ${job.id} (${type})`)
    return job
  }

  private getJobPriority(type: JobType): number {
    const priorities = {
      [JobType.TRANSACTION_PROCESSING]: 10, // Highest priority
      [JobType.EMAIL_NOTIFICATION]: 8,
      [JobType.AI_GENERATION]: 5,
      [JobType.IMAGE_PROCESSING]: 5,
      [JobType.CACHE_WARMING]: 3,
      [JobType.CLEANUP]: 1 // Lowest priority
    }
    return priorities[type] || 5
  }

  async getJob(type: JobType, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    return await queue.getJob(jobId)
  }

  async getQueueStats(type?: JobType): Promise<any> {
    if (type) {
      const queue = this.queues.get(type)
      if (!queue) {
        throw new Error(`Queue not found for job type: ${type}`)
      }

      const waiting = await queue.getWaiting()
      const active = await queue.getActive()
      const completed = await queue.getCompleted()
      const failed = await queue.getFailed()

      return {
        type,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      }
    }

    // Return stats for all queues
    const allStats = {}
    for (const [jobType, queue] of this.queues.entries()) {
      const waiting = await queue.getWaiting()
      const active = await queue.getActive()
      const completed = await queue.getCompleted()
      const failed = await queue.getFailed()

      allStats[jobType] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      }
    }

    return allStats
  }

  async processJob(type: JobType, processor: (job: Job) => Promise<JobResult>): Promise<void> {
    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    queue.process(async (job: Job) => {
      try {
        logger.info(`Processing job ${job.id} (${type})`)
        const result = await processor(job)
        logger.info(`Job ${job.id} processed successfully`)
        return result
      } catch (error) {
        logger.error(`Error processing job ${job.id}:`, error)
        throw error
      }
    })

    logger.info(`Processor registered for job type: ${type}`)
  }

  async pauseQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    await queue.pause()
    logger.info(`Queue paused: ${type}`)
  }

  async resumeQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    await queue.resume()
    logger.info(`Queue resumed: ${type}`)
  }

  async clearQueue(type: JobType, state?: 'completed' | 'failed'): Promise<void> {
    const queue = this.queues.get(type)
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`)
    }

    if (state === 'completed') {
      await queue.getCompleted().then(jobs => jobs.forEach(job => job.remove()))
    } else if (state === 'failed') {
      await queue.getFailed().then(jobs => jobs.forEach(job => job.remove()))
    } else {
      await queue.clean(0, 'completed')
      await queue.clean(0, 'failed')
    }

    logger.info(`Queue cleared: ${type}`)
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      // Close all queues
      for (const [type, queue] of this.queues.entries()) {
        await queue.close()
        logger.info(`Queue closed: ${type}`)
      }

      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.disconnect()
      }

      this.isInitialized = false
      logger.info('Job queue service shut down successfully')
    } catch (error) {
      logger.error('Error shutting down job queue service:', error)
      throw error
    }
  }
}

export const jobQueueService = new JobQueueService()
