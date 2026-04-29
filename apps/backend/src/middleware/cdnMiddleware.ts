/**
 * CDN Middleware - Handles CDN-specific headers and cache control
 * Applies appropriate caching strategies for static assets
 */

import { Request, Response, NextFunction } from 'express'
import cdnService from '@/services/cdnService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('CDNMiddleware')

/**
 * Static asset file extensions that should have aggressive caching
 */
const STATIC_ASSET_PATTERNS = [
  /\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i,
  /^\/static\//,
  /^\/assets\//,
  /^\/images\//,
  /^\/fonts\//
]

/**
 * Check if path is a static asset
 */
function isStaticAsset(path: string): boolean {
  return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(path))
}

/**
 * Check if path should have versioned cache headers (long-lived)
 */
function isVersionedAsset(path: string): boolean {
  // Typically, build tools add hash to filenames
  // e.g., main.abc123def.js, style.xyz789.css
  return /\.[a-f0-9]{8,}\.(js|css|woff|woff2|ttf|eot|svg)$/i.test(path)
}

/**
 * CDN middleware to apply cache headers for static assets
 */
export function cdnMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store original setHeader for tracking
  const originalSetHeader = res.setHeader

  res.setHeader = function (name: string, value: string | string[] | number): Response {
    // Apply CDN headers for static assets
    if (isStaticAsset(req.path)) {
      const isVersioned = isVersionedAsset(req.path)

      // Apply cache headers
      if (name.toLowerCase() === 'cache-control') {
        const cacheHeaders = cdnService.getCacheHeaders(isVersioned)
        res.setHeader('Cache-Control', cacheHeaders['Cache-Control'])
      }

      // Apply compression headers if enabled
      const compressionHeaders = cdnService.getCompressionHeaders()
      if (compressionHeaders['Content-Encoding']) {
        res.setHeader('Content-Encoding', compressionHeaders['Content-Encoding'])
        res.setHeader('Vary', compressionHeaders['Vary'])
      }

      // Add CDN provider header (optional, for debugging)
      const config = cdnService.getPublicConfig()
      if (config.enabled && config.provider) {
        res.setHeader('X-CDN-Provider', config.provider)
      }

      // Add ETag for cache validation
      if (name.toLowerCase() === 'etag' && isVersioned) {
        // Immutable assets can use more aggressive caching
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    }

    return originalSetHeader.call(this, name, value) as Response
  } as any

  next()
}

/**
 * CDN headers middleware - Adds CDN-specific response headers
 */
export function addCDNHeaders(req: Request, res: Response, next: NextFunction): void {
  // Only add CDN headers for static assets
  if (isStaticAsset(req.path)) {
    const isVersioned = isVersionedAsset(req.path)
    const cacheHeaders = cdnService.getCacheHeaders(isVersioned)
    const corsHeaders = cdnService.getCORSHeaders()
    const compressionHeaders = cdnService.getCompressionHeaders()

    // Apply all headers
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    Object.entries(compressionHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    // Add CDN info header
    const config = cdnService.getPublicConfig()
    if (config.enabled) {
      res.setHeader('X-CDN-Enabled', 'true')
      res.setHeader('X-CDN-Provider', config.provider || 'custom')
    }

    logger.debug(`CDN headers applied for static asset: ${req.path}`)
  }

  next()
}

/**
 * Middleware to expose CDN configuration to requests
 */
export function injectCDNConfig(req: Request, res: Response, next: NextFunction): void {
  // Attach CDN config to request for use in route handlers
  ;(req as any).cdnConfig = cdnService.getPublicConfig()
  ;(req as any).cdnService = cdnService

  next()
}

/**
 * Express middleware factory with options
 */
export function createCDNMiddleware() {
  return [addCDNHeaders, injectCDNConfig]
}
