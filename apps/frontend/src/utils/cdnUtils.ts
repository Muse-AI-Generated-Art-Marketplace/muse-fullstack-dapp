/**
 * Frontend CDN Utilities
 * Helpers for using CDN-optimized URLs in React components
 */

interface CDNConfig {
  enabled: boolean
  provider: string
  primaryUrl: string
  imageOptimization: boolean
  compressionEnabled: boolean
}

interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
}

class FrontendCDNUtils {
  private config: CDNConfig | null = null
  private configPromise: Promise<CDNConfig> | null = null

  /**
   * Fetch CDN configuration from backend
   */
  async getCDNConfig(): Promise<CDNConfig> {
    if (this.config) {
      return this.config
    }

    if (this.configPromise) {
      return this.configPromise
    }

    this.configPromise = this.fetchCDNConfig()
    return this.configPromise
  }

  /**
   * Fetch CDN configuration from API
   */
  private async fetchCDNConfig(): Promise<CDNConfig> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/cdn/config`)

      if (!response.ok) {
        throw new Error(`Failed to fetch CDN config: ${response.statusText}`)
      }

      const data = await response.json()
      this.config = data.data || {
        enabled: false,
        provider: 'custom',
        primaryUrl: '',
        imageOptimization: false,
        compressionEnabled: false
      }

      return this.config
    } catch (error) {
      console.error('Error fetching CDN configuration:', error)
      return {
        enabled: false,
        provider: 'custom',
        primaryUrl: '',
        imageOptimization: false,
        compressionEnabled: false
      }
    }
  }

  /**
   * Get optimized CDN URL for image from backend
   */
  async getImageUrl(
    imagePath: string,
    options?: ImageOptimizationOptions
  ): Promise<string> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/cdn/image-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imagePath,
          options: options || {}
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get image URL: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data?.optimizedUrl || imagePath
    } catch (error) {
      console.error('Error getting CDN image URL:', error)
      return imagePath
    }
  }

  /**
   * Get CDN URL for asset from backend
   */
  async getAssetUrl(
    assetPath: string,
    options?: any
  ): Promise<string> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/cdn/asset-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetPath,
          options: options || {}
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get asset URL: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data?.cdnUrl || assetPath
    } catch (error) {
      console.error('Error getting CDN asset URL:', error)
      return assetPath
    }
  }

  /**
   * Check CDN health
   */
  async checkCDNHealth(): Promise<{ healthy: boolean; provider: string }> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/cdn/health`, { method: 'POST' })

      if (!response.ok) {
        return { healthy: false, provider: 'unknown' }
      }

      const data = await response.json()
      return {
        healthy: data.data?.healthy ?? false,
        provider: data.data?.provider ?? 'unknown'
      }
    } catch (error) {
      console.error('Error checking CDN health:', error)
      return { healthy: false, provider: 'unknown' }
    }
  }

  /**
   * Prefetch image for faster loading
   */
  prefetchImage(imagePath: string): void {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = imagePath
    document.head.appendChild(link)
  }

  /**
   * Preload critical resource
   */
  preloadResource(resourcePath: string, type: 'script' | 'style' | 'image' = 'script'): void {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = type
    link.href = resourcePath
    document.head.appendChild(link)
  }

  /**
   * Get responsive image srcset for different screen sizes
   */
  async getResponsiveImageSrcSet(
    imagePath: string,
    sizes: number[] = [320, 640, 1024, 1920],
    format: 'webp' | 'avif' | 'jpg' = 'webp'
  ): Promise<string> {
    const srcset = await Promise.all(
      sizes.map(async (width) => {
        const url = await this.getImageUrl(imagePath, {
          width,
          quality: 80,
          format
        })
        return `${url} ${width}w`
      })
    )

    return srcset.join(', ')
  }

  /**
   * Detect if WebP is supported
   */
  supportsWebP(): boolean {
    if (typeof document === 'undefined') return false

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    try {
      return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
    } catch {
      return false
    }
  }

  /**
   * Detect if AVIF is supported
   */
  supportsAVIF(): boolean {
    // AVIF support detection is complex, typically done via feature detection
    // For now, return false unless explicitly detected
    return false
  }

  /**
   * Get best image format based on browser support
   */
  getBestImageFormat(): 'webp' | 'avif' | 'jpg' {
    if (this.supportsAVIF()) return 'avif'
    if (this.supportsWebP()) return 'webp'
    return 'jpg'
  }

  /**
   * Clear CDN cache (admin only)
   */
  async clearCDNCache(authToken?: string): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/cdn/clear-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error clearing CDN cache:', error)
      return false
    }
  }

  /**
   * Reset configuration cache
   */
  resetConfigCache(): void {
    this.config = null
    this.configPromise = null
  }
}

export default new FrontendCDNUtils()
