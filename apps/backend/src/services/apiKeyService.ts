import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'
import { ApiKey, IApiKey } from '@/models/ApiKey'
import { createLogger } from '@/utils/logger'
import cacheService from './cacheService'

const logger = createLogger('ApiKeyService')

export interface CreateApiKeyRequest {
  name: string
  userId: string
  permissions: string[]
  rateLimit?: {
    requests?: number
    window?: number
  }
  expiresAt?: Date
}

export interface ApiKeyResponse {
  id: string
  name: string
  key: string // Only returned during creation
  permissions: string[]
  rateLimit: {
    requests: number
    window: number
  }
  isActive: boolean
  lastUsed?: Date
  expiresAt?: Date
  usageCount: number
  createdAt: Date
}

export interface ApiKeyValidation {
  isValid: boolean
  apiKey?: IApiKey
  error?: string
}

class ApiKeyService {
  private readonly HASH_SECRET = process.env.API_KEY_HASH_SECRET || 'default-secret-change-in-production'
  private readonly CACHE_PREFIX = 'apikey:'
  private readonly CACHE_TTL = 300 // 5 minutes

  private hashApiKey(key: string): string {
    return CryptoJS.SHA256(key + this.HASH_SECRET).toString()
  }

  private generateApiKey(): string {
    const prefix = 'muse_'
    const randomPart = uuidv4().replace(/-/g, '')
    return `${prefix}${randomPart}`
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    try {
      const key = this.generateApiKey()
      const hashedKey = this.hashApiKey(key)

      const apiKey = new ApiKey({
        name: request.name,
        key: hashedKey,
        hashedKey: hashedKey,
        userId: request.userId,
        permissions: request.permissions,
        rateLimit: {
          requests: request.rateLimit?.requests || 1000,
          window: request.rateLimit?.window || 3600000
        },
        expiresAt: request.expiresAt,
        isActive: true
      })

      await apiKey.save()

      // Cache the API key for quick validation
      await this.cacheApiKey(apiKey)

      logger.info(`API key created for user ${request.userId}: ${apiKey.name}`)

      return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        key: key, // Return the actual key only during creation
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        usageCount: apiKey.usageCount,
        createdAt: apiKey.createdAt
      }
    } catch (error) {
      logger.error('Error creating API key:', error)
      throw new Error('Failed to create API key')
    }
  }

  async validateApiKey(key: string): Promise<ApiKeyValidation> {
    try {
      // First check cache
      const cacheKey = `${this.CACHE_PREFIX}${this.hashApiKey(key)}`
      const cachedApiKey = await cacheService.get<IApiKey>(cacheKey)
      
      if (cachedApiKey) {
        // Update last used and usage count asynchronously
        this.updateApiKeyUsage(cachedApiKey._id.toString())
        
        if (!cachedApiKey.isActive) {
          return { isValid: false, error: 'API key is inactive' }
        }

        if (cachedApiKey.expiresAt && cachedApiKey.expiresAt < new Date()) {
          return { isValid: false, error: 'API key has expired' }
        }

        return { isValid: true, apiKey: cachedApiKey }
      }

      // If not in cache, check database
      const hashedKey = this.hashApiKey(key)
      const apiKey = await ApiKey.findOne({ 
        hashedKey: hashedKey,
        isActive: true 
      })

      if (!apiKey) {
        return { isValid: false, error: 'Invalid API key' }
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { isValid: false, error: 'API key has expired' }
      }

      // Cache the API key for future requests
      await this.cacheApiKey(apiKey)

      // Update usage asynchronously
      this.updateApiKeyUsage(apiKey._id.toString())

      return { isValid: true, apiKey }
    } catch (error) {
      logger.error('Error validating API key:', error)
      return { isValid: false, error: 'Validation failed' }
    }
  }

  private async cacheApiKey(apiKey: IApiKey): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${apiKey.hashedKey}`
      await cacheService.set(cacheKey, apiKey, this.CACHE_TTL)
    } catch (error) {
      logger.warn('Failed to cache API key:', error)
    }
  }

  private async updateApiKeyUsage(apiKeyId: string): Promise<void> {
    try {
      await ApiKey.findByIdAndUpdate(apiKeyId, {
        $set: { lastUsed: new Date() },
        $inc: { usageCount: 1 }
      })

      // Update cache
      const updatedApiKey = await ApiKey.findById(apiKeyId)
      if (updatedApiKey) {
        await this.cacheApiKey(updatedApiKey)
      }
    } catch (error) {
      logger.warn('Failed to update API key usage:', error)
    }
  }

  async getUserApiKeys(userId: string): Promise<ApiKeyResponse[]> {
    try {
      const apiKeys = await ApiKey.find({ 
        userId: userId 
      }).sort({ createdAt: -1 })

      return apiKeys.map(apiKey => ({
        id: apiKey._id.toString(),
        name: apiKey.name,
        key: '', // Never return the actual key in list view
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        usageCount: apiKey.usageCount,
        createdAt: apiKey.createdAt
      }))
    } catch (error) {
      logger.error('Error fetching user API keys:', error)
      throw new Error('Failed to fetch API keys')
    }
  }

  async revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    try {
      const apiKey = await ApiKey.findOneAndUpdate(
        { _id: apiKeyKeyId, userId: userId },
        { isActive: false },
        { new: true }
      )

      if (!apiKey) {
        return false
      }

      // Remove from cache
      const cacheKey = `${this.CACHE_PREFIX}${apiKey.hashedKey}`
      await cacheService.del(cacheKey)

      logger.info(`API key revoked: ${apiKeyKeyId}`)
      return true
    } catch (error) {
      logger.error('Error revoking API key:', error)
      throw new Error('Failed to revoke API key')
    }
  }

  async deleteApiKey(apiKeyId: string, userId: string): Promise<boolean> {
    try {
      const apiKey = await ApiKey.findOneAndDelete({ 
        _id: apiKeyKeyId, 
        userId: userId 
      })

      if (!apiKey) {
        return false
      }

      // Remove from cache
      const cacheKey = `${this.CACHE_PREFIX}${apiKey.hashedKey}`
      await cacheService.del(cacheKey)

      logger.info(`API key deleted: ${apiKeyKeyId}`)
      return true
    } catch (error) {
      logger.error('Error deleting API key:', error)
      throw new Error('Failed to delete API key')
    }
  }

  async getApiKeyStats(userId: string): Promise<{
    total: number
    active: number
    expired: number
    totalUsage: number
  }> {
    try {
      const stats = await ApiKey.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isActive', true] }, { $or: [{ $eq: ['$expiresAt', null] }, { $gt: ['$expiresAt', new Date()] }] }] },
                  1,
                  0
                ]
              }
            },
            expired: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isActive', true] }, { $lt: ['$expiresAt', new Date()] }] },
                  1,
                  0
                ]
              }
            },
            totalUsage: { $sum: '$usageCount' }
          }
        }
      ])

      return stats[0] || { total: 0, active: 0, expired: 0, totalUsage: 0 }
    } catch (error) {
      logger.error('Error getting API key stats:', error)
      return { total: 0, active: 0, expired: 0, totalUsage: 0 }
    }
  }
}

export const apiKeyService = new ApiKeyService()
