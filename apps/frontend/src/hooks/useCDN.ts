/**
 * React Hook for CDN Image Component
 * Provides optimized image loading with fallbacks
 */

import { useState, useEffect } from 'react'
import cdnUtils from '@/utils/cdnUtils'

interface UseCDNImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  alt: string
  className?: string
}

/**
 * Hook to get optimized CDN image URL
 */
export function useCDNImage(
  imagePath: string,
  options?: Omit<UseCDNImageOptions, 'alt' | 'className'>
) {
  const [imageUrl, setImageUrl] = useState<string>(imagePath)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      try {
        setLoading(true)
        const url = await cdnUtils.getImageUrl(imagePath, {
          ...options,
          format: options?.format || cdnUtils.getBestImageFormat()
        })

        if (isMounted) {
          setImageUrl(url)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load CDN image'))
          setImageUrl(imagePath) // Fallback to original
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [imagePath, options])

  return { imageUrl, loading, error }
}

/**
 * Hook to get responsive image srcset
 */
export function useResponsiveImage(
  imagePath: string,
  options?: {
    sizes?: number[]
    format?: 'webp' | 'avif' | 'jpg'
    quality?: number
  }
) {
  const [srcset, setSrcset] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSrcset = async () => {
      try {
        setLoading(true)
        const generatedSrcset = await cdnUtils.getResponsiveImageSrcSet(
          imagePath,
          options?.sizes,
          options?.format || cdnUtils.getBestImageFormat()
        )

        if (isMounted) {
          setSrcset(generatedSrcset)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load responsive srcset'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSrcset()

    return () => {
      isMounted = false
    }
  }, [imagePath, options])

  return { srcset, loading, error }
}

/**
 * Hook to check CDN health
 */
export function useCDNHealth() {
  const [health, setHealth] = useState<{
    healthy: boolean
    provider: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkHealth = async () => {
      try {
        setLoading(true)
        const healthStatus = await cdnUtils.checkCDNHealth()

        if (isMounted) {
          setHealth(healthStatus)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to check CDN health'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkHealth()

    return () => {
      isMounted = false
    }
  }, [])

  return { health, loading, error }
}

/**
 * Hook to get CDN configuration
 */
export function useCDNConfig() {
  const [config, setConfig] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadConfig = async () => {
      try {
        setLoading(true)
        const cdnConfig = await cdnUtils.getCDNConfig()

        if (isMounted) {
          setConfig(cdnConfig)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load CDN config'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadConfig()

    return () => {
      isMounted = false
    }
  }, [])

  return { config, loading, error }
}
