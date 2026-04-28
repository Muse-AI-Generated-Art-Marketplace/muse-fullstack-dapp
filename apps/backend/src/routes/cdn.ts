/**
 * CDN Routes - Endpoints for CDN management and asset URL generation
 */

import { Router, Request, Response, NextFunction } from 'express'
import cdnService from '@/services/cdnService'
import { adminAuthMiddleware } from '@/middleware/adminAuth'
import { createLogger } from '@/utils/logger'

const router = Router()
const logger = createLogger('CDNRoutes')

/**
 * GET /api/cdn/config
 * Get public CDN configuration
 */
router.get('/config', (_req: Request, res: Response) => {
  try {
    const config = cdnService.getPublicConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    logger.error('Failed to get CDN config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get CDN configuration'
    })
  }
})

/**
 * GET /api/cdn/stats
 * Get CDN service statistics (admin only)
 */
router.get(
  '/stats',
  adminAuthMiddleware,
  (_req: Request, res: Response) => {
    try {
      const stats = cdnService.getStats()
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Failed to get CDN stats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get CDN statistics'
      })
    }
  }
)

/**
 * POST /api/cdn/asset-url
 * Generate CDN URL for an asset
 * Body: { assetPath: string, options?: AssetOptions }
 */
router.post(
  '/asset-url',
  (req: Request, res: Response) => {
    try {
      const { assetPath, options } = req.body

      if (!assetPath || typeof assetPath !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'assetPath is required and must be a string'
        })
      }

      const cdnUrl = cdnService.getAssetUrl(assetPath, options)

      res.json({
        success: true,
        data: {
          originalPath: assetPath,
          cdnUrl,
          options: options || {}
        }
      })
    } catch (error) {
      logger.error('Failed to generate CDN URL:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to generate CDN URL'
      })
    }
  }
)

/**
 * POST /api/cdn/image-url
 * Generate optimized CDN URL for an image
 * Body: { imagePath: string, options?: ImageOptions }
 */
router.post(
  '/image-url',
  (req: Request, res: Response) => {
    try {
      const { imagePath, options } = req.body

      if (!imagePath || typeof imagePath !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'imagePath is required and must be a string'
        })
      }

      const imageUrl = cdnService.getImageUrl(imagePath, options)

      res.json({
        success: true,
        data: {
          originalPath: imagePath,
          optimizedUrl: imageUrl,
          options: options || {}
        }
      })
    } catch (error) {
      logger.error('Failed to generate image URL:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to generate image URL'
      })
    }
  }
)

/**
 * POST /api/cdn/health
 * Health check for CDN availability
 */
router.post(
  '/health',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await cdnService.healthCheck()
      res.json({
        success: true,
        data: health
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/cdn/purge-cache
 * Purge CDN cache for specific path (admin only)
 * Body: { path: string }
 */
router.post(
  '/purge-cache',
  adminAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.body

      if (!path || typeof path !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'path is required and must be a string'
        })
      }

      const success = await cdnService.purgeCachePath(path)

      res.json({
        success,
        message: success ? 'Cache purge initiated' : 'Cache purge failed',
        path
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/cdn/clear-cache
 * Clear internal asset URL cache (admin only)
 */
router.post(
  '/clear-cache',
  adminAuthMiddleware,
  (_req: Request, res: Response) => {
    try {
      cdnService.clearCache()
      res.json({
        success: true,
        message: 'CDN asset URL cache cleared'
      })
    } catch (error) {
      logger.error('Failed to clear CDN cache:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to clear CDN cache'
      })
    }
  }
)

/**
 * GET /api/cdn/cache-headers/:type
 * Get cache headers for specific asset type
 * Params: type = 'versioned' | 'non-versioned'
 */
router.get(
  '/cache-headers/:type',
  (req: Request, res: Response) => {
    try {
      const { type } = req.params
      const isVersioned = type === 'versioned'

      if (!['versioned', 'non-versioned'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'type must be either "versioned" or "non-versioned"'
        })
      }

      const headers = cdnService.getCacheHeaders(isVersioned)

      res.json({
        success: true,
        data: {
          assetType: type,
          headers
        }
      })
    } catch (error) {
      logger.error('Failed to get cache headers:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get cache headers'
      })
    }
  }
)

export default router
