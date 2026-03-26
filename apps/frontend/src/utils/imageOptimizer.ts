import { useState, useEffect } from 'react'

export interface ImageDimensions {
  width: number
  height: number
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  crop?: boolean
  fit?: 'cover' | 'contain' | 'fill'
}

export class ImageOptimizer {
  private static readonly DEFAULT_QUALITY = 75

  /**
   * Generate optimized image URL using a CDN service
   * In production, replace with your preferred CDN (Cloudinary, Imgix, etc.)
   */
  static generateOptimizedUrl(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!originalUrl) return ''

    // If it's already an optimized URL, return as-is
    if (originalUrl.includes('/api/image-optimizer')) {
      return originalUrl
    }

    // For local development, create a mock optimized URL
    if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      return originalUrl
    }

    const params = new URLSearchParams()
    
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality && options.quality !== this.DEFAULT_QUALITY) {
      params.append('q', options.quality.toString())
    }
    if (options.format && options.format !== 'webp') {
      params.append('fm', options.format)
    }
    if (options.crop) params.append('crop', 'true')
    if (options.fit && options.fit !== 'cover') {
      params.append('fit', options.fit)
    }

    const queryString = params.toString()
    return queryString ? `${originalUrl}?${queryString}` : originalUrl
  }

  /**
   * Get responsive image sources for different screen sizes
   */
  static generateResponsiveSources(
    originalUrl: string,
    baseOptions: ImageOptimizationOptions = {}
  ): { srcSet: string; sizes?: string; media?: string }[] {
    const breakpoints = [
      { width: 320, media: '(max-width: 640px)' },
      { width: 640, media: '(max-width: 768px)' },
      { width: 768, media: '(max-width: 1024px)' },
      { width: 1024, media: '(max-width: 1280px)' },
      { width: 1280, media: '(min-width: 1281px)' }
    ]

    return breakpoints.map(({ width, media }) => ({
      media,
      srcSet: this.generateOptimizedUrl(originalUrl, { ...baseOptions, width })
    }))
  }

  /**
   * Generate WebP and AVIF sources for modern browsers
   */
  static generateFormatSources(
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): { type: string; srcSet: string }[] {
    const formats: Array<{ type: string; format: 'avif' | 'webp' }> = [
      { type: 'image/avif', format: 'avif' },
      { type: 'image/webp', format: 'webp' }
    ]

    return formats.map(({ type, format }) => ({
      type,
      srcSet: this.generateOptimizedUrl(originalUrl, { ...options, format })
    }))
  }

  /**
   * Calculate optimal dimensions for different viewport sizes
   */
  static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    containerWidth: number,
    containerHeight?: number
  ): ImageDimensions {
    const aspectRatio = originalWidth / originalHeight
    let width = containerWidth
    let height = containerHeight || Math.round(containerWidth / aspectRatio)

    // Ensure we don't upscale images
    if (width > originalWidth) {
      width = originalWidth
      height = Math.round(width / aspectRatio)
    }

    if (height > originalHeight) {
      height = originalHeight
      width = Math.round(height * aspectRatio)
    }

    return { width, height }
  }

  /**
   * Generate a blur placeholder data URL
   */
  static generateBlurPlaceholder(
    width: number,
    height: number,
    color: string = '#f3f4f6'
  ): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    canvas.width = width
    canvas.height = height

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, this.lightenColor(color, 20))

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return canvas.toDataURL()
  }

  /**
   * Check if browser supports a specific image format
   */
  static supportsFormat(format: 'webp' | 'avif'): boolean {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    if (format === 'webp') {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    }
    
    if (format === 'avif') {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
    }

    return false
  }

  /**
   * Get the best supported format for the current browser
   */
  static getBestSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.supportsFormat('avif')) return 'avif'
    if (this.supportsFormat('webp')) return 'webp'
    return 'jpeg'
  }

  /**
   * Estimate file size reduction
   */
  static estimateSizeReduction(
    originalSize: number,
    originalFormat: string,
    targetFormat: 'webp' | 'avif',
    quality: number = this.DEFAULT_QUALITY
  ): number {
    const formatReductions: Record<string, number> = {
      'jpeg': targetFormat === 'webp' ? 0.25 : 0.35,
      'png': targetFormat === 'webp' ? 0.80 : 0.85,
      'webp': targetFormat === 'avif' ? 0.20 : 0,
      'avif': 0
    }

    const reduction = formatReductions[originalFormat] || 0
    const qualityFactor = quality / 100

    return Math.round(originalSize * reduction * qualityFactor)
  }

  private static lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }
}

/**
 * Hook for image optimization
 */
export function useImageOptimization(
  src: string,
  options: ImageOptimizationOptions = {}
) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return

    setIsLoading(true)
    setError(null)

    try {
      const optimized = ImageOptimizer.generateOptimizedUrl(src, options)
      setOptimizedSrc(optimized)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize image')
    } finally {
      setIsLoading(false)
    }
  }, [src, JSON.stringify(options)])

  return {
    src: optimizedSrc,
    isLoading,
    error,
    generateResponsiveSources: (baseOptions?: ImageOptimizationOptions) =>
      ImageOptimizer.generateResponsiveSources(src, { ...options, ...baseOptions }),
    generateFormatSources: (baseOptions?: ImageOptimizationOptions) =>
      ImageOptimizer.generateFormatSources(src, { ...options, ...baseOptions })
  }
}
