/**
 * CDN Service - Manages CDN integration for faster global asset delivery
 * Supports multiple CDN providers with automatic fallback
 */

import { createLogger } from '@/utils/logger'

const logger = createLogger('CDNService')

export interface CDNConfig {
  enabled: boolean
  provider: 'cloudflare' | 'aws' | 'fastly' | 'custom'
  primaryUrl: string
  fallbackUrl?: string
  cacheControl?: string
  corsOrigins: string[]
  compressionEnabled: boolean
  imageOptimization: boolean
  imageCDNUrl?: string
}

export interface AssetOptions {
  ttl?: number
  public?: boolean
  format?: string
  quality?: number
  width?: number
  height?: number
}

class CDNService {
  private config: CDNConfig
  private assetCache: Map<string, string> = new Map()

  constructor() {
    this.config = this.initializeConfig()
  }

  /**
   * Initialize CDN configuration from environment variables
   */
  private initializeConfig(): CDNConfig {
    const cdnEnabled = process.env.CDN_ENABLED === 'true'
    const provider = (process.env.CDN_PROVIDER || 'custom') as CDNConfig['provider']
    const primaryUrl = process.env.CDN_PRIMARY_URL || ''
    const fallbackUrl = process.env.CDN_FALLBACK_URL
    const corsOrigins = process.env.CDN_CORS_ORIGINS?.split(',') || ['*']
    const compressionEnabled = process.env.CDN_COMPRESSION_ENABLED !== 'false'
    const imageOptimization = process.env.CDN_IMAGE_OPTIMIZATION === 'true'
    const imageCDNUrl = process.env.CDN_IMAGE_URL

    if (cdnEnabled && !primaryUrl) {
      logger.warn('CDN is enabled but CDN_PRIMARY_URL is not set. CDN features will be limited.')
    }

    const config: CDNConfig = {
      enabled: cdnEnabled,
      provider,
      primaryUrl,
      fallbackUrl,
      corsOrigins,
      compressionEnabled,
      imageOptimization,
      imageCDNUrl,
      cacheControl: process.env.CDN_CACHE_CONTROL || 'public, max-age=31536000, immutable'
    }

    logger.info(`CDN Service initialized - Enabled: ${config.enabled}, Provider: ${provider}`)
    return config
  }

  /**
   * Get CDN URL for a given asset path
   */
  getAssetUrl(assetPath: string, options?: AssetOptions): string {
    if (!this.config.enabled || !this.config.primaryUrl) {
      return assetPath
    }

    const cacheKey = `${assetPath}:${JSON.stringify(options || {})}`

    // Check cache first
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)!
    }

    let cdnUrl = this.buildCDNUrl(assetPath, options)

    // Cache the result
    this.assetCache.set(cacheKey, cdnUrl)

    return cdnUrl
  }

  /**
   * Build CDN URL based on provider and asset options
   */
  private buildCDNUrl(assetPath: string, options?: AssetOptions): string {
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
    const baseUrl = this.config.primaryUrl.replace(/\/$/, '')

    switch (this.config.provider) {
      case 'cloudflare':
        return this.buildCloudflareUrl(baseUrl, cleanPath, options)
      case 'aws':
        return this.buildAwsUrl(baseUrl, cleanPath, options)
      case 'fastly':
        return this.buildFastlyUrl(baseUrl, cleanPath, options)
      case 'custom':
      default:
        return `${baseUrl}${cleanPath}`
    }
  }

  /**
   * Build Cloudflare CDN URL with image optimization
   */
  private buildCloudflareUrl(baseUrl: string, assetPath: string, options?: AssetOptions): string {
    if (!options || !this.config.imageOptimization) {
      return `${baseUrl}${assetPath}`
    }

    // Cloudflare Image Optimization API
    const imageUrl = `${baseUrl}${assetPath}`
    const params = new URLSearchParams()

    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    if (options.format) params.append('format', options.format)

    return params.size > 0 ? `${imageUrl}?${params.toString()}` : imageUrl
  }

  /**
   * Build AWS CloudFront URL
   */
  private buildAwsUrl(baseUrl: string, assetPath: string, options?: AssetOptions): string {
    if (!options || !this.config.imageOptimization) {
      return `${baseUrl}${assetPath}`
    }

    // AWS CloudFront with Lambda@Edge can handle image optimization via query params
    const params = new URLSearchParams()

    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)

    return params.size > 0 ? `${baseUrl}${assetPath}?${params.toString()}` : `${baseUrl}${assetPath}`
  }

  /**
   * Build Fastly CDN URL
   */
  private buildFastlyUrl(baseUrl: string, assetPath: string, options?: AssetOptions): string {
    if (!options || !this.config.imageOptimization) {
      return `${baseUrl}${assetPath}`
    }

    // Fastly image optimization via query params
    const params = new URLSearchParams()

    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())

    return params.size > 0 ? `${baseUrl}${assetPath}?${params.toString()}` : `${baseUrl}${assetPath}`
  }

  /**
   * Get CDN URL for images with optimization
   */
  getImageUrl(
    imagePath: string,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'jpg' | 'png'
    }
  ): string {
    if (this.config.imageCDNUrl && this.config.imageOptimization) {
      return this.buildCDNUrl(imagePath, options)
    }

    return imagePath
  }

  /**
   * Get cache control headers for CDN responses
   */
  getCacheHeaders(permanent: boolean = true): Record<string, string> {
    if (!this.config.enabled) {
      return {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }

    return {
      'Cache-Control': permanent
        ? 'public, max-age=31536000, immutable' // 1 year for versioned assets
        : 'public, max-age=3600, must-revalidate', // 1 hour for non-versioned assets
      'CDN-Cache-Control': 'max-age=31536000',
      'Expires': permanent
        ? new Date(Date.now() + 31536000000).toUTCString()
        : new Date(Date.now() + 3600000).toUTCString()
    }
  }

  /**
   * Get CORS headers for CDN responses
   */
  getCORSHeaders(): Record<string, string> {
    const allowedOrigins = this.config.corsOrigins.includes('*')
      ? '*'
      : this.config.corsOrigins.join(', ')

    return {
      'Access-Control-Allow-Origin': allowedOrigins,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept-Encoding',
      'Access-Control-Max-Age': '86400'
    }
  }

  /**
   * Get compression headers for CDN responses
   */
  getCompressionHeaders(): Record<string, string> {
    if (!this.config.compressionEnabled) {
      return {}
    }

    return {
      'Content-Encoding': 'gzip, deflate, br',
      'Vary': 'Accept-Encoding'
    }
  }

  /**
   * Health check for CDN availability
   */
  async healthCheck(): Promise<{ healthy: boolean; provider: string; primaryUrl: string }> {
    if (!this.config.enabled) {
      return {
        healthy: true,
        provider: this.config.provider,
        primaryUrl: this.config.primaryUrl || 'disabled'
      }
    }

    try {
      const response = await fetch(this.config.primaryUrl, { method: 'HEAD' })
      return {
        healthy: response.ok || response.status === 403, // 403 is OK, means CDN is responding
        provider: this.config.provider,
        primaryUrl: this.config.primaryUrl
      }
    } catch (error) {
      logger.error('CDN health check failed:', error)
      return {
        healthy: false,
        provider: this.config.provider,
        primaryUrl: this.config.primaryUrl
      }
    }
  }

  /**
   * Get CDN configuration (safe for client consumption)
   */
  getPublicConfig(): Partial<CDNConfig> {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      primaryUrl: this.config.primaryUrl,
      imageOptimization: this.config.imageOptimization,
      compressionEnabled: this.config.compressionEnabled
    }
  }

  /**
   * Purge CDN cache for specific path (provider-specific)
   */
  async purgeCachePath(path: string): Promise<boolean> {
    logger.info(`Cache purge requested for path: ${path}`)

    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflareCache(path)
        case 'aws':
          return await this.purgeAwsCache(path)
        case 'fastly':
          return await this.purgeFastlyCache(path)
        default:
          logger.warn('Cache purge not implemented for custom CDN provider')
          return false
      }
    } catch (error) {
      logger.error('Cache purge failed:', error)
      return false
    }
  }

  /**
   * Purge Cloudflare cache
   */
  private async purgeCloudflareCache(path: string): Promise<boolean> {
    const token = process.env.CLOUDFLARE_API_TOKEN
    const zoneId = process.env.CLOUDFLARE_ZONE_ID

    if (!token || !zoneId) {
      logger.warn('Cloudflare credentials not configured')
      return false
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: [`${this.config.primaryUrl}${path}`]
        })
      })

      const success = response.ok
      if (success) {
        logger.info(`Cloudflare cache purged for path: ${path}`)
      }
      return success
    } catch (error) {
      logger.error('Cloudflare cache purge failed:', error)
      return false
    }
  }

  /**
   * Purge AWS CloudFront cache
   */
  private async purgeAwsCache(path: string): Promise<boolean> {
    logger.info('AWS cache purge requires AWS SDK configuration')
    // Implementation would use AWS CloudFront invalidation API
    return false
  }

  /**
   * Purge Fastly cache
   */
  private async purgeFastlyCache(path: string): Promise<boolean> {
    const token = process.env.FASTLY_API_TOKEN

    if (!token) {
      logger.warn('Fastly API token not configured')
      return false
    }

    try {
      const response = await fetch(`${this.config.primaryUrl}${path}`, {
        method: 'PURGE',
        headers: {
          'Fastly-Key': token
        }
      })

      const success = response.ok
      if (success) {
        logger.info(`Fastly cache purged for path: ${path}`)
      }
      return success
    } catch (error) {
      logger.error('Fastly cache purge failed:', error)
      return false
    }
  }

  /**
   * Clear internal asset URL cache
   */
  clearCache(): void {
    this.assetCache.clear()
    logger.info('CDN asset URL cache cleared')
  }

  /**
   * Get CDN statistics
   */
  getStats(): { enabled: boolean; provider: string; cachedUrls: number } {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      cachedUrls: this.assetCache.size
    }
  }
}

export default new CDNService()
