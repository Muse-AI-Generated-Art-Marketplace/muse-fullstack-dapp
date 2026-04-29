import { Router, Request, Response } from 'express'
import { database } from '@/config/database'
import { createLogger } from '@/utils/logger'

const router = Router()
const logger = createLogger('DatabaseMetrics')

// Get database pool statistics
router.get('/pool', async (req: Request, res: Response) => {
  try {
    const poolStats = database.getConnectionPoolStats()
    res.json({
      success: true,
      data: {
        ...poolStats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching pool stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool statistics'
    })
  }
})

// Get detailed connection metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = database.getConnectionMetrics()
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching connection metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connection metrics'
    })
  }
})

// Perform health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthResult = await database.healthCheck()
    const statusCode = healthResult.status === 'healthy' ? 200 : 503
    
    res.status(statusCode).json({
      success: healthResult.status === 'healthy',
      data: {
        ...healthResult,
        timestamp: new Date().toISOString(),
        connectionStatus: database.getConnectionStatus()
      }
    })
  } catch (error) {
    logger.error('Error during health check:', error)
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    })
  }
})

// Reset metrics (admin only)
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Add admin authentication check here if needed
    database.resetMetrics()
    logger.info('Database metrics reset via API')
    res.json({
      success: true,
      message: 'Database metrics reset successfully'
    })
  } catch (error) {
    logger.error('Error resetting metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    })
  }
})

export default router
