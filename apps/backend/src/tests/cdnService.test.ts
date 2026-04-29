/**
 * CDN Service Unit Tests
 */

import cdnService from '@/services/cdnService'

describe('CDN Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    cdnService.clearCache()
  })

  describe('getAssetUrl', () => {
    it('should return original path when CDN is disabled', () => {
      process.env.CDN_ENABLED = 'false'
      const url = cdnService.getAssetUrl('/images/test.jpg')
      expect(url).toBe('/images/test.jpg')
    })

    it('should return CDN URL when enabled', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      const url = cdnService.getAssetUrl('/images/test.jpg')
      expect(url).toContain('https://cdn.example.com')
      expect(url).toContain('/images/test.jpg')
    })

    it('should cache generated URLs', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const url1 = cdnService.getAssetUrl('/images/test.jpg')
      const url2 = cdnService.getAssetUrl('/images/test.jpg')
      
      expect(url1).toBe(url2)
      expect(cdnService.getStats().cachedUrls).toBeGreaterThan(0)
    })

    it('should handle paths with and without leading slash', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const url1 = cdnService.getAssetUrl('images/test.jpg')
      const url2 = cdnService.getAssetUrl('/images/test.jpg')
      
      expect(url1).toContain('images/test.jpg')
      expect(url2).toContain('images/test.jpg')
    })
  })

  describe('getImageUrl', () => {
    beforeEach(() => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      process.env.CDN_IMAGE_OPTIMIZATION = 'true'
    })

    it('should generate image URL with optimization', () => {
      const url = cdnService.getImageUrl('/artworks/piece.jpg', {
        width: 800,
        height: 600,
        quality: 85
      })
      
      expect(url).toContain('https://cdn.example.com')
      expect(url).toContain('artworks/piece.jpg')
    })

    it('should handle image optimization options', () => {
      const url = cdnService.getImageUrl('/test.jpg', {
        width: 400,
        height: 300,
        format: 'webp',
        quality: 90
      })
      
      expect(url).toBeTruthy()
    })

    it('should return original path when image optimization disabled', () => {
      process.env.CDN_IMAGE_OPTIMIZATION = 'false'
      const url = cdnService.getImageUrl('/test.jpg')
      expect(url).toBe('/test.jpg')
    })
  })

  describe('getCacheHeaders', () => {
    it('should return aggressive cache headers for versioned assets', () => {
      process.env.CDN_ENABLED = 'true'
      const headers = cdnService.getCacheHeaders(true)
      
      expect(headers['Cache-Control']).toContain('max-age=31536000')
      expect(headers['Cache-Control']).toContain('immutable')
    })

    it('should return moderate cache headers for non-versioned assets', () => {
      process.env.CDN_ENABLED = 'true'
      const headers = cdnService.getCacheHeaders(false)
      
      expect(headers['Cache-Control']).toContain('max-age=3600')
      expect(headers['Cache-Control']).toContain('must-revalidate')
    })

    it('should return no-cache headers when CDN disabled', () => {
      process.env.CDN_ENABLED = 'false'
      const headers = cdnService.getCacheHeaders(true)
      
      expect(headers['Cache-Control']).toContain('no-cache')
      expect(headers['Cache-Control']).toContain('no-store')
    })
  })

  describe('getCORSHeaders', () => {
    it('should return CORS headers with configured origins', () => {
      process.env.CDN_CORS_ORIGINS = 'https://example.com,https://app.example.com'
      const headers = cdnService.getCORSHeaders()
      
      expect(headers['Access-Control-Allow-Origin']).toBeTruthy()
      expect(headers['Access-Control-Allow-Methods']).toBeTruthy()
    })

    it('should handle wildcard CORS origins', () => {
      process.env.CDN_CORS_ORIGINS = '*'
      const headers = cdnService.getCORSHeaders()
      
      expect(headers['Access-Control-Allow-Origin']).toBe('*')
    })
  })

  describe('getCompressionHeaders', () => {
    it('should return compression headers when enabled', () => {
      process.env.CDN_COMPRESSION_ENABLED = 'true'
      const headers = cdnService.getCompressionHeaders()
      
      expect(headers['Content-Encoding']).toBeTruthy()
      expect(headers['Vary']).toBe('Accept-Encoding')
    })

    it('should return empty object when compression disabled', () => {
      process.env.CDN_COMPRESSION_ENABLED = 'false'
      const headers = cdnService.getCompressionHeaders()
      
      expect(Object.keys(headers).length).toBe(0)
    })
  })

  describe('getPublicConfig', () => {
    it('should return sanitized configuration', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PROVIDER = 'cloudflare'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const config = cdnService.getPublicConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.provider).toBe('cloudflare')
      expect(config.primaryUrl).toBe('https://cdn.example.com')
    })
  })

  describe('getStats', () => {
    it('should return service statistics', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PROVIDER = 'custom'
      
      const stats = cdnService.getStats()
      
      expect(stats.enabled).toBe(true)
      expect(stats.provider).toBe('custom')
      expect(typeof stats.cachedUrls).toBe('number')
    })
  })

  describe('clearCache', () => {
    it('should clear internal asset cache', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      // Generate some URLs to cache
      cdnService.getAssetUrl('/test1.jpg')
      cdnService.getAssetUrl('/test2.jpg')
      
      let stats = cdnService.getStats()
      expect(stats.cachedUrls).toBeGreaterThan(0)
      
      // Clear cache
      cdnService.clearCache()
      
      stats = cdnService.getStats()
      expect(stats.cachedUrls).toBe(0)
    })
  })

  describe('Provider-specific URL building', () => {
    beforeEach(() => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
    })

    it('should build Cloudflare URLs correctly', () => {
      process.env.CDN_PROVIDER = 'cloudflare'
      process.env.CDN_IMAGE_OPTIMIZATION = 'true'
      
      const url = cdnService.getAssetUrl('/image.jpg', { width: 800 })
      expect(url).toBeTruthy()
    })

    it('should build AWS URLs correctly', () => {
      process.env.CDN_PROVIDER = 'aws'
      process.env.CDN_IMAGE_OPTIMIZATION = 'true'
      
      const url = cdnService.getAssetUrl('/image.jpg', { width: 800 })
      expect(url).toBeTruthy()
    })

    it('should build Fastly URLs correctly', () => {
      process.env.CDN_PROVIDER = 'fastly'
      process.env.CDN_IMAGE_OPTIMIZATION = 'true'
      
      const url = cdnService.getAssetUrl('/image.jpg', { width: 800 })
      expect(url).toBeTruthy()
    })
  })

  describe('Health check', () => {
    it('should return health status', async () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      // Mock fetch for testing
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200
        })
      ) as jest.Mock
      
      const health = await cdnService.healthCheck()
      
      expect(health.healthy).toBeDefined()
      expect(health.provider).toBeDefined()
      expect(health.primaryUrl).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty asset path', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const url = cdnService.getAssetUrl('')
      expect(url).toBeTruthy()
    })

    it('should handle URL with multiple slashes', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com/'
      
      const url = cdnService.getAssetUrl('/images/test.jpg')
      expect(url).not.toContain('//')
    })

    it('should handle very long asset paths', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const longPath = '/very/long/nested/path/to/some/deep/asset/file.jpg'
      const url = cdnService.getAssetUrl(longPath)
      
      expect(url).toContain('file.jpg')
    })

    it('should handle special characters in paths', () => {
      process.env.CDN_ENABLED = 'true'
      process.env.CDN_PRIMARY_URL = 'https://cdn.example.com'
      
      const pathWithSpecialChars = '/images/art-work_2024.jpg'
      const url = cdnService.getAssetUrl(pathWithSpecialChars)
      
      expect(url).toContain('art-work_2024.jpg')
    })
  })
})
