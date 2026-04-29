import cacheService from './cacheService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('QuotaService')

export interface UserQuota {
  userId: string
  tier: UserTier
  requestsUsed: number
  requestsLimit: number
  windowStart: number
  windowEnd: number
  resetTime: number
}

export interface UserTier {
  name: string
  requestsPerWindow: number
  windowSizeMs: number
  features: string[]
  priority: number
}

export interface QuotaConfig {
  tiers: Record<string, UserTier>
  defaultTier: string
  windowSizeMs: number
}

// Default quota configuration
const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  tiers: {
    free: {
      name: 'Free',
      requestsPerWindow: 100,
      windowSizeMs: 60 * 60 * 1000, // 1 hour
      features: ['basic_api', 'artwork_view', 'user_profile'],
      priority: 1
    },
    creator: {
      name: 'Creator',
      requestsPerWindow: 1000,
      windowSizeMs: 60 * 60 * 1000, // 1 hour
      features: ['basic_api', 'artwork_view', 'user_profile', 'artwork_create', 'ai_generation'],
      priority: 2
    },
    pro: {
      name: 'Pro',
      requestsPerWindow: 5000,
      windowSizeMs: 60 * 60 * 1000, // 1 hour
      features: ['basic_api', 'artwork_view', 'user_profile', 'artwork_create', 'ai_generation', 'advanced_analytics', 'bulk_operations'],
      priority: 3
    },
    enterprise: {
      name: 'Enterprise',
      requestsPerWindow: 20000,
      windowSizeMs: 60 * 60 * 1000, // 1 hour
      features: ['basic_api', 'artwork_view', 'user_profile', 'artwork_create', 'ai_generation', 'advanced_analytics', 'bulk_operations', 'custom_models', 'priority_support'],
      priority: 4
    }
  },
  defaultTier: 'free',
  windowSizeMs: 60 * 60 * 1000 // 1 hour
}

class QuotaService {
  private config: QuotaConfig
  private cacheKeyPrefix = 'quota:'

  constructor(config: QuotaConfig = DEFAULT_QUOTA_CONFIG) {
    this.config = config
  }

  async getUserQuota(userId: string): Promise<UserQuota> {
    const cacheKey = this.getCacheKey(userId)
    let quota = await cacheService.get<UserQuota>(cacheKey)

    if (!quota) {
      quota = await this.initializeUserQuota(userId)
    }

    // Check if window has expired
    const now = Date.now()
    if (now > quota.windowEnd) {
      quota = await this.resetUserQuota(userId)
    }

    return quota
  }

  async checkQuota(userId: string, requiredRequests: number = 1): Promise<{ allowed: boolean; quota: UserQuota; remaining: number }> {
    const quota = await this.getUserQuota(userId)
    const remaining = quota.requestsLimit - quota.requestsUsed

    if (remaining < requiredRequests) {
      logger.warn(`Quota exceeded for user ${userId}: ${quota.requestsUsed}/${quota.requestsLimit}`)
      return {
        allowed: false,
        quota,
        remaining
      }
    }

    return {
      allowed: true,
      quota,
      remaining
    }
  }

  async consumeQuota(userId: string, requests: number = 1): Promise<UserQuota> {
    const quota = await this.getUserQuota(userId)
    
    // Check if consumption is allowed
    const check = await this.checkQuota(userId, requests)
    if (!check.allowed) {
      throw new Error(`Quota exceeded. User ${userId} has ${check.remaining} requests remaining but needs ${requests}`)
    }

    // Update quota
    quota.requestsUsed += requests
    
    // Save to cache
    await cacheService.set(this.getCacheKey(userId), quota, Math.ceil(quota.windowEnd / 1000))
    
    logger.info(`Consumed ${requests} requests for user ${userId}. Total: ${quota.requestsUsed}/${quota.requestsLimit}`)
    
    return quota
  }

  async updateUserTier(userId: string, tierName: string): Promise<UserQuota> {
    const tier = this.config.tiers[tierName]
    if (!tier) {
      throw new Error(`Invalid tier: ${tierName}`)
    }

    const quota: UserQuota = {
      userId,
      tier,
      requestsUsed: 0,
      requestsLimit: tier.requestsPerWindow,
      windowStart: Date.now(),
      windowEnd: Date.now() + tier.windowSizeMs,
      resetTime: Date.now() + tier.windowSizeMs
    }

    await cacheService.set(this.getCacheKey(userId), quota, Math.ceil(quota.windowEnd / 1000))
    
    logger.info(`Updated user ${userId} to tier ${tierName}`)
    
    return quota
  }

  async resetUserQuota(userId: string): Promise<UserQuota> {
    const currentQuota = await this.getUserQuota(userId)
    
    const resetQuota: UserQuota = {
      ...currentQuota,
      requestsUsed: 0,
      windowStart: Date.now(),
      windowEnd: Date.now() + currentQuota.tier.windowSizeMs,
      resetTime: Date.now() + currentQuota.tier.windowSizeMs
    }

    await cacheService.set(this.getCacheKey(userId), resetQuota, Math.ceil(resetQuota.windowEnd / 1000))
    
    logger.info(`Reset quota for user ${userId}`)
    
    return resetQuota
  }

  async getQuotaStats(userId: string): Promise<{
    current: UserQuota
    usage: {
      percentage: number
      remaining: number
      resetIn: number
    }
  }> {
    const quota = await this.getUserQuota(userId)
    const now = Date.now()
    
    return {
      current: quota,
      usage: {
        percentage: (quota.requestsUsed / quota.requestsLimit) * 100,
        remaining: quota.requestsLimit - quota.requestsUsed,
        resetIn: Math.max(0, quota.windowEnd - now)
      }
    }
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const quota = await this.getUserQuota(userId)
    return quota.tier.features.includes(feature)
  }

  private async initializeUserQuota(userId: string): Promise<UserQuota> {
    const defaultTier = this.config.tiers[this.config.defaultTier]
    
    const quota: UserQuota = {
      userId,
      tier: defaultTier,
      requestsUsed: 0,
      requestsLimit: defaultTier.requestsPerWindow,
      windowStart: Date.now(),
      windowEnd: Date.now() + defaultTier.windowSizeMs,
      resetTime: Date.now() + defaultTier.windowSizeMs
    }

    await cacheService.set(this.getCacheKey(userId), quota, Math.ceil(quota.windowEnd / 1000))
    
    return quota
  }

  private getCacheKey(userId: string): string {
    return `${this.cacheKeyPrefix}${userId}`
  }

  // Admin methods
  async getAllTiers(): Promise<UserTier[]> {
    return Object.values(this.config.tiers).sort((a, b) => b.priority - a.priority)
  }

  async updateTierConfig(tierName: string, updates: Partial<UserTier>): Promise<void> {
    const tier = this.config.tiers[tierName]
    if (!tier) {
      throw new Error(`Tier ${tierName} not found`)
    }

    this.config.tiers[tierName] = { ...tier, ...updates }
    logger.info(`Updated tier configuration for ${tierName}`)
  }

  async getSystemStats(): Promise<{
    totalUsers: number
    activeUsers: number
    tierDistribution: Record<string, number>
    totalRequests: number
  }> {
    // This would typically query a database
    // For now, return mock data
    return {
      totalUsers: 0,
      activeUsers: 0,
      tierDistribution: {},
      totalRequests: 0
    }
  }
}

// Create singleton instance
const quotaService = new QuotaService()

export default quotaService
export { QuotaService, DEFAULT_QUOTA_CONFIG }
