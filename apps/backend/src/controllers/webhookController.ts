import { Request, Response } from 'express'
import webhookService from '@/services/webhookService'
import { createLogger } from '@/utils/logger'
import { ApiResponse, Webhook, WebhookDelivery } from '@/types'

const logger = createLogger('WebhookController')

export const createWebhook = async (req: Request, res: Response) => {
  try {
    const { url, events, secret, headers, retryConfig } = req.body
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'URL and events array are required',
          userMessage: 'Please provide a valid URL and at least one event type',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }

    const webhookData = {
      url,
      events,
      secret,
      headers,
      retryConfig: retryConfig || {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 30000
      },
      isActive: true,
      userId
    }

    const webhook = await webhookService.createWebhook(webhookData)

    const response: ApiResponse = {
      success: true,
      data: webhook,
      message: 'Webhook created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    logger.error('Error creating webhook:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_WEBHOOK_ERROR',
        message: 'Error creating webhook',
        userMessage: 'Unable to create webhook. Please check your input and try again.',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const webhooks = await webhookService.getWebhooksForUser(userId)

    const response: ApiResponse = {
      success: true,
      data: webhooks
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting webhooks:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_WEBHOOKS_ERROR',
        message: 'Error retrieving webhooks',
        userMessage: 'Unable to retrieve your webhooks',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const getWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const webhook = await webhookService.getWebhook(id)

    if (!webhook) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: 'Webhook not found',
          userMessage: 'The requested webhook does not exist',
          statusCode: 404
        }
      }
      return res.status(404).json(response)
    }

    // Check if user owns this webhook
    if (webhook.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You do not have permission to access this webhook',
          statusCode: 403
        }
      }
      return res.status(403).json(response)
    }

    const response: ApiResponse = {
      success: true,
      data: webhook
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting webhook:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_WEBHOOK_ERROR',
        message: 'Error retrieving webhook',
        userMessage: 'Unable to retrieve webhook information',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { url, events, secret, headers, retryConfig, isActive } = req.body
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const existingWebhook = await webhookService.getWebhook(id)
    if (!existingWebhook) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: 'Webhook not found',
          userMessage: 'The requested webhook does not exist',
          statusCode: 404
        }
      }
      return res.status(404).json(response)
    }

    // Check if user owns this webhook
    if (existingWebhook.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You do not have permission to update this webhook',
          statusCode: 403
        }
      }
      return res.status(403).json(response)
    }

    const updates: Partial<Webhook> = {}
    if (url !== undefined) updates.url = url
    if (events !== undefined) updates.events = events
    if (secret !== undefined) updates.secret = secret
    if (headers !== undefined) updates.headers = headers
    if (retryConfig !== undefined) updates.retryConfig = retryConfig
    if (isActive !== undefined) updates.isActive = isActive

    const updatedWebhook = await webhookService.updateWebhook(id, updates)

    const response: ApiResponse = {
      success: true,
      data: updatedWebhook,
      message: 'Webhook updated successfully'
    }

    res.json(response)
  } catch (error) {
    logger.error('Error updating webhook:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPDATE_WEBHOOK_ERROR',
        message: 'Error updating webhook',
        userMessage: 'Unable to update webhook. Please check your input and try again.',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const webhook = await webhookService.getWebhook(id)
    if (!webhook) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: 'Webhook not found',
          userMessage: 'The requested webhook does not exist',
          statusCode: 404
        }
      }
      return res.status(404).json(response)
    }

    // Check if user owns this webhook
    if (webhook.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You do not have permission to delete this webhook',
          statusCode: 403
        }
      }
      return res.status(403).json(response)
    }

    await webhookService.deleteWebhook(id)

    const response: ApiResponse = {
      success: true,
      message: 'Webhook deleted successfully'
    }

    res.json(response)
  } catch (error) {
    logger.error('Error deleting webhook:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DELETE_WEBHOOK_ERROR',
        message: 'Error deleting webhook',
        userMessage: 'Unable to delete webhook',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { testEvent } = req.body
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const webhook = await webhookService.getWebhook(id)
    if (!webhook) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: 'Webhook not found',
          userMessage: 'The requested webhook does not exist',
          statusCode: 404
        }
      }
      return res.status(404).json(response)
    }

    // Check if user owns this webhook
    if (webhook.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You do not have permission to test this webhook',
          statusCode: 403
        }
      }
      return res.status(403).json(response)
    }

    const result = await webhookService.testWebhook(id, testEvent)

    const response: ApiResponse = {
      success: true,
      data: result,
      message: result.success ? 'Webhook test successful' : 'Webhook test failed'
    }

    res.json(response)
  } catch (error) {
    logger.error('Error testing webhook:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TEST_WEBHOOK_ERROR',
        message: 'Error testing webhook',
        userMessage: 'Unable to test webhook',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const getWebhookDeliveries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { limit = 50 } = req.query
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const webhook = await webhookService.getWebhook(id)
    if (!webhook) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: 'Webhook not found',
          userMessage: 'The requested webhook does not exist',
          statusCode: 404
        }
      }
      return res.status(404).json(response)
    }

    // Check if user owns this webhook
    if (webhook.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You do not have permission to view deliveries for this webhook',
          statusCode: 403
        }
      }
      return res.status(403).json(response)
    }

    const deliveries = await webhookService.getWebhookDeliveries(id, parseInt(limit as string))

    const response: ApiResponse = {
      success: true,
      data: deliveries
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting webhook deliveries:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_DELIVERIES_ERROR',
        message: 'Error retrieving webhook deliveries',
        userMessage: 'Unable to retrieve webhook delivery information',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const getWebhookStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.publicKey

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          userMessage: 'Please provide your authentication credentials',
          statusCode: 401
        }
      }
      return res.status(401).json(response)
    }

    const stats = await webhookService.getWebhookStats(userId)

    const response: ApiResponse = {
      success: true,
      data: stats
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting webhook stats:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_STATS_ERROR',
        message: 'Error retrieving webhook statistics',
        userMessage: 'Unable to retrieve webhook statistics',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const getAvailableEvents = async (req: Request, res: Response) => {
  try {
    const availableEvents = [
      {
        type: 'artwork.created',
        description: 'Triggered when a new artwork is created',
        dataSchema: {
          artworkId: 'string',
          creatorId: 'string',
          title: 'string',
          category: 'string'
        }
      },
      {
        type: 'artwork.sold',
        description: 'Triggered when an artwork is sold',
        dataSchema: {
          artworkId: 'string',
          sellerId: 'string',
          buyerId: 'string',
          price: 'string'
        }
      },
      {
        type: 'user.registered',
        description: 'Triggered when a new user registers',
        dataSchema: {
          userId: 'string',
          publicKey: 'string',
          timestamp: 'number'
        }
      },
      {
        type: 'transaction.completed',
        description: 'Triggered when a transaction is completed',
        dataSchema: {
          transactionId: 'string',
          type: 'string',
          amount: 'string',
          status: 'string'
        }
      },
      {
        type: 'ai.generation.completed',
        description: 'Triggered when AI art generation is completed',
        dataSchema: {
          generationId: 'string',
          userId: 'string',
          prompt: 'string',
          imageUrl: 'string'
        }
      }
    ]

    const response: ApiResponse = {
      success: true,
      data: availableEvents
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting available events:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_EVENTS_ERROR',
        message: 'Error retrieving available events',
        userMessage: 'Unable to retrieve available events',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

// Admin endpoints
export const getSystemWebhookStats = async (req: Request, res: Response) => {
  try {
    const stats = await webhookService.getWebhookStats()

    const response: ApiResponse = {
      success: true,
      data: stats
    }

    res.json(response)
  } catch (error) {
    logger.error('Error getting system webhook stats:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_SYSTEM_STATS_ERROR',
        message: 'Error retrieving system webhook statistics',
        userMessage: 'Unable to retrieve system webhook statistics',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export const cleanupDeliveries = async (req: Request, res: Response) => {
  try {
    const { maxAge } = req.body
    
    webhookService.cleanup(maxAge)

    const response: ApiResponse = {
      success: true,
      message: 'Webhook delivery cleanup completed'
    }

    res.json(response)
  } catch (error) {
    logger.error('Error cleaning up webhook deliveries:', error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: 'Error cleaning up webhook deliveries',
        userMessage: 'Unable to clean up webhook deliveries',
        statusCode: 500
      }
    }

    res.status(500).json(response)
  }
}

export default {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  getWebhookStats,
  getAvailableEvents,
  getSystemWebhookStats,
  cleanupDeliveries
}
