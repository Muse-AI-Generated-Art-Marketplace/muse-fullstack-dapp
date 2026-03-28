import express from 'express'
import { z } from 'zod'
import { apiKeyService, CreateApiKeyRequest } from '@/services/apiKeyService'
import { createLogger } from '@/utils/logger'

const router = express.Router()
const logger = createLogger('ApiKeyRoutes')

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'admin'])).min(1),
  rateLimit: z.object({
    requests: z.number().min(1).max(100000).optional(),
    window: z.number().min(60000).optional()
  }).optional(),
  expiresAt: z.string().datetime().optional()
})

const apiKeyIdSchema = z.object({
  apiKeyId: z.string().min(1)
})

// Middleware to validate API key requests
const validateApiKeyRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = createApiKeySchema.parse(req.body)
    }
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

// Middleware to validate API key ID
const validateApiKeyId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.params = apiKeyIdSchema.parse(req.params)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    return res.status(400).json({ error: 'Invalid API key ID' })
  }
}

// POST /api/keys - Create new API key
router.post('/', validateApiKeyRequest, async (req: express.Request, res: express.Response) => {
  try {
    // Assuming user ID is available from authentication middleware
    const userId = (req as any).user?.id || 'temp-user-id' // This should come from auth middleware
    
    const createRequest: CreateApiKeyRequest = {
      ...req.body,
      userId,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    }

    const apiKey = await apiKeyService.createApiKey(createRequest)
    
    logger.info(`API key created for user ${userId}: ${apiKey.name}`)
    
    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Save this key securely as it will not be shown again.'
    })
  } catch (error) {
    logger.error('Error creating API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    })
  }
})

// GET /api/keys - Get all API keys for user
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || 'temp-user-id' // This should come from auth middleware
    
    const apiKeys = await apiKeyService.getUserApiKeys(userId)
    
    res.json({
      success: true,
      data: apiKeys
    })
  } catch (error) {
    logger.error('Error fetching API keys:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    })
  }
})

// GET /api/keys/stats - Get API key usage statistics
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || 'temp-user-id' // This should come from auth middleware
    
    const stats = await apiKeyService.getApiKeyStats(userId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error fetching API key stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API key statistics'
    })
  }
})

// PUT /api/keys/:apiKeyId/revoke - Revoke API key
router.put('/:apiKeyId/revoke', validateApiKeyId, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || 'temp-user-id' // This should come from auth middleware
    const { apiKeyId } = req.params
    
    const success = await apiKeyService.revokeApiKey(apiKeyId, userId)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or you do not have permission to revoke it'
      })
    }
    
    logger.info(`API key revoked: ${apiKeyId} by user ${userId}`)
    
    res.json({
      success: true,
      message: 'API key revoked successfully'
    })
  } catch (error) {
    logger.error('Error revoking API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    })
  }
})

// DELETE /api/keys/:apiKeyId - Delete API key
router.delete('/:apiKeyId', validateApiKeyId, async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || 'temp-user-id' // This should come from auth middleware
    const { apiKeyId } = req.params
    
    const success = await apiKeyService.deleteApiKey(apiKeyId, userId)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or you do not have permission to delete it'
      })
    }
    
    logger.info(`API key deleted: ${apiKeyId} by user ${userId}`)
    
    res.json({
      success: true,
      message: 'API key deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting API key:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key'
    })
  }
})

export default router
