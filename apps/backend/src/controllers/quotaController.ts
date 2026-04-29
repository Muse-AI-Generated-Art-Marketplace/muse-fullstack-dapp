import { Request, Response } from 'express'
import quotaService from '@/services/quotaService'
import { createLogger } from '@/utils/logger'
import { ApiResponse, UserQuota, UserTier } from '@/types'

const logger = createLogger('QuotaController')

export const getQuotaStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.publicKey || `ip:${req.ip}`
    const stats = await quotaService.getQuotaStats(userId)
    
    const response: ApiResponse = {
      success: true,
      data: {
        tier: stats.current.tier.name,
        requestsUsed: stats.current.requestsUsed,
        requestsLimit: stats.current.requestsLimit,
        remaining: stats.usage.remaining,
        percentage: Math.round(stats.usage.percentage),
        resetIn: Math.ceil(stats.usage.resetIn / 60000), // minutes
        resetTime: stats.current.resetTime,
        features: stats.current.tier.features
      }
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting quota status:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'QUOTA_STATUS_ERROR',
        message: 'Error retrieving quota status',
        userMessage: 'Unable to retrieve your quota information',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getQuotaHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.publicKey || `ip:${req.ip}`
    
    // This would typically query a database for historical usage
    // For now, return mock data
    const history = [
      {
        date: new Date(Date.now() - 86400000).toISOString(),
        requestsUsed: 45,
        requestsLimit: 100,
        tier: 'free'
      },
      {
        date: new Date(Date.now() - 172800000).toISOString(),
        requestsUsed: 78,
        requestsLimit: 100,
        tier: 'free'
      }
    ]
    
    const response: ApiResponse = {
      success: true,
      data: history
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting quota history:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'QUOTA_HISTORY_ERROR',
        message: 'Error retrieving quota history',
        userMessage: 'Unable to retrieve your quota history',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const getAvailableTiers = async (req: Request, res: Response) => {
  try {
    const tiers = await quotaService.getAllTiers()
    
    const response: ApiResponse = {
      success: true,
      data: tiers.map(tier => ({
        name: tier.name,
        requestsPerWindow: tier.requestsPerWindow,
        windowSizeMs: tier.windowSizeMs,
        features: tier.features,
        priority: tier.priority
      }))
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting available tiers:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TIERS_ERROR',
        message: 'Error retrieving available tiers',
        userMessage: 'Unable to retrieve subscription tiers',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

// Admin endpoints
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const stats = await quotaService.getSystemStats()
    
    const response: ApiResponse = {
      success: true,
      data: stats
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error getting system stats:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SYSTEM_STATS_ERROR',
        message: 'Error retrieving system statistics',
        userMessage: 'Unable to retrieve system statistics',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const updateUserTier = async (req: Request, res: Response) => {
  try {
    const { userId, tierName } = req.body
    
    if (!userId || !tierName) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: userId, tierName',
          userMessage: 'Please provide both user ID and tier name',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }
    
    const updatedQuota = await quotaService.updateUserTier(userId, tierName)
    
    const response: ApiResponse = {
      success: true,
      data: updatedQuota,
      message: `User ${userId} updated to ${tierName} tier`
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error updating user tier:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPDATE_TIER_ERROR',
        message: 'Error updating user tier',
        userMessage: 'Unable to update user subscription tier',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const resetUserQuota = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required field: userId',
          userMessage: 'Please provide the user ID',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }
    
    const resetQuota = await quotaService.resetUserQuota(userId)
    
    const response: ApiResponse = {
      success: true,
      data: resetQuota,
      message: `Quota reset for user ${userId}`
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error resetting user quota:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RESET_QUOTA_ERROR',
        message: 'Error resetting user quota',
        userMessage: 'Unable to reset user quota',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export const updateTierConfig = async (req: Request, res: Response) => {
  try {
    const { tierName, updates } = req.body
    
    if (!tierName || !updates) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: tierName, updates',
          userMessage: 'Please provide both tier name and updates',
          statusCode: 400
        }
      }
      return res.status(400).json(response)
    }
    
    await quotaService.updateTierConfig(tierName, updates)
    
    const response: ApiResponse = {
      success: true,
      message: `Tier configuration updated for ${tierName}`
    }
    
    res.json(response)
  } catch (error) {
    logger.error('Error updating tier config:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPDATE_CONFIG_ERROR',
        message: 'Error updating tier configuration',
        userMessage: 'Unable to update tier configuration',
        statusCode: 500
      }
    }
    
    res.status(500).json(response)
  }
}

export default {
  getQuotaStatus,
  getQuotaHistory,
  getAvailableTiers,
  getSystemStats,
  updateUserTier,
  resetUserQuota,
  updateTierConfig
}
