import express from 'express'
import { z } from 'zod'
import { jobQueueService, JobType } from '@/services/jobQueueService'
import { registerAllJobProcessors } from '@/services/jobProcessors'
import { createLogger } from '@/utils/logger'

const router = express.Router()
const logger = createLogger('JobRoutes')

// Initialize job processors
registerAllJobProcessors(jobQueueService)

// Validation schemas
const createJobSchema = z.object({
  type: z.enum(['ai-generation', 'image-processing', 'email-notification', 'transaction-processing', 'cache-warming', 'cleanup']),
  data: z.object({}).passthrough(),
  options: z.object({
    delay: z.number().min(0).optional(),
    priority: z.number().min(1).max(10).optional()
  }).optional()
})

const jobIdSchema = z.object({
  jobId: z.string().min(1)
})

// Middleware to validate job creation
const validateJobCreation = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.body = createJobSchema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    return res.status(400).json({ error: 'Invalid request format' })
  }
}

// Middleware to validate job ID
const validateJobId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.params = jobIdSchema.parse(req.params)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    return res.status(400).json({ error: 'Invalid job ID' })
  }
}

// POST /api/jobs - Create a new job
router.post('/', validateJobCreation, async (req: express.Request, res: express.Response) => {
  try {
    const { type, data, options } = req.body
    
    const job = await jobQueueService.addJob(type as JobType, data, options)
    
    logger.info(`Job created: ${job.id} (${type})`)
    
    res.status(201).json({
      success: true,
      data: {
        id: job.id,
        type: job.name,
        data: job.data,
        status: 'waiting',
        createdAt: new Date(),
        options
      }
    })
  } catch (error) {
    logger.error('Error creating job:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create job'
    })
  }
})

// GET /api/jobs/stats - Get job queue statistics
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const { type } = req.query
    
    let stats
    if (type) {
      stats = await jobQueueService.getQueueStats(type as JobType)
    } else {
      stats = await jobQueueService.getQueueStats()
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error fetching job stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job statistics'
    })
  }
})

// GET /api/jobs/:jobId - Get job details
router.get('/:jobId', validateJobId, async (req: express.Request, res: express.Response) => {
  try {
    const { jobId } = req.params
    const { type } = req.query as { type: JobType }
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Job type is required'
      })
    }
    
    const job = await jobQueueService.getJob(type as JobType, jobId)
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      })
    }
    
    const jobData = {
      id: job.id,
      type: job.name,
      data: job.data,
      status: await job.getState(),
      progress: job.progress(),
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attempts: job.attemptsMade,
      failedReason: job.failedReason
    }
    
    res.json({
      success: true,
      data: jobData
    })
  } catch (error) {
    logger.error('Error fetching job details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details'
    })
  }
})

// PUT /api/jobs/:type/pause - Pause a job queue
router.put('/:type/pause', async (req: express.Request, res: express.Response) => {
  try {
    const { type } = req.params
    
    await jobQueueService.pauseQueue(type as JobType)
    
    logger.info(`Queue paused: ${type}`)
    
    res.json({
      success: true,
      message: `Queue ${type} paused successfully`
    })
  } catch (error) {
    logger.error('Error pausing queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pause queue'
    })
  }
})

// PUT /api/jobs/:type/resume - Resume a job queue
router.put('/:type/resume', async (req: express.Request, res: express.Response) => {
  try {
    const { type } = req.params
    
    await jobQueueService.resumeQueue(type as JobType)
    
    logger.info(`Queue resumed: ${type}`)
    
    res.json({
      success: true,
      message: `Queue ${type} resumed successfully`
    })
  } catch (error) {
    logger.error('Error resuming queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resume queue'
    })
  }
})

// DELETE /api/jobs/:type/clear - Clear a job queue
router.delete('/:type/clear', async (req: express.Request, res: express.Response) => {
  try {
    const { type } = req.params
    const { state } = req.query as { state?: 'completed' | 'failed' }
    
    await jobQueueService.clearQueue(type as JobType, state)
    
    logger.info(`Queue cleared: ${type} (${state || 'all'})`)
    
    res.json({
      success: true,
      message: `Queue ${type} cleared successfully`
    })
  } catch (error) {
    logger.error('Error clearing queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to clear queue'
    })
  }
})

// POST /api/jobs/sample - Create sample jobs for testing
router.post('/sample', async (req: express.Request, res: express.Response) => {
  try {
    const sampleJobs = [
      {
        type: JobType.AI_GENERATION,
        data: {
          prompt: 'A beautiful sunset over mountains',
          userId: 'sample-user',
          style: 'realistic',
          dimensions: '1024x768'
        }
      },
      {
        type: JobType.EMAIL_NOTIFICATION,
        data: {
          to: 'user@example.com',
          subject: 'Welcome to Muse AI Marketplace',
          template: 'welcome',
          userId: 'sample-user'
        }
      },
      {
        type: JobType.CACHE_WARMING,
        data: {
          cacheKeys: ['popular_artworks', 'featured_artists', 'trending_styles'],
          data: {
            popular_artworks: [{ id: 1, title: 'Sample Artwork' }],
            featured_artists: [{ id: 1, name: 'Sample Artist' }],
            trending_styles: [{ name: 'Abstract', count: 42 }]
          }
        }
      }
    ]
    
    const createdJobs = []
    
    for (const jobData of sampleJobs) {
      const job = await jobQueueService.addJob(jobData.type, jobData.data)
      createdJobs.push({
        id: job.id,
        type: job.name,
        status: 'waiting'
      })
    }
    
    logger.info(`Created ${createdJobs.length} sample jobs`)
    
    res.status(201).json({
      success: true,
      data: createdJobs,
      message: 'Sample jobs created successfully'
    })
  } catch (error) {
    logger.error('Error creating sample jobs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create sample jobs'
    })
  }
})

export default router
