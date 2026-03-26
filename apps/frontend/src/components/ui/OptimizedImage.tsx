import React, { useState, useRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Image as ImageIcon } from 'lucide-react'

export interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty' | 'color'
  blurDataURL?: string
  sizes?: string
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  format = 'auto',
  onError,
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)

  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px',
    skip: priority
  })

  const refs = (node: HTMLImageElement | null) => {
    imgRef.current = node
    inViewRef(node)
  }

  const generateOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return ''
    
    // For external images, we'll use a proxy service for optimization
    if (originalSrc.startsWith('http')) {
      const params = new URLSearchParams({
        url: originalSrc,
        q: quality.toString(),
        fm: format === 'auto' ? 'webp' : format,
        w: width?.toString() || '',
        h: height?.toString() || ''
      })
      
      // Using a hypothetical image optimization service
      // In production, you'd use services like Cloudinary, Imgix, or your own
      return `/api/image-optimizer?${params.toString()}`
    }
    
    return originalSrc
  }

  const generatePlaceholderSrc = () => {
    if (blurDataURL) return blurDataURL
    
    // Generate a simple gradient placeholder
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    canvas.width = width || 400
    canvas.height = height || 300
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    return canvas.toDataURL()
  }

  useEffect(() => {
    if (priority || inView) {
      setImageSrc(generateOptimizedSrc(src))
    }
  }, [priority, inView, src, width, height, quality, format])

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    onError?.(e)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoaded(false)
    setImageSrc(generateOptimizedSrc(src))
  }

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${className}`}
        style={{ width, height }}
        onClick={handleRetry}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleRetry()}
        aria-label="Retry loading image"
      >
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Failed to load</p>
          <p className="text-xs text-gray-400 mt-1">Click to retry</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {placeholder !== 'empty' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"
          style={{
            backgroundImage: placeholder === 'blur' && blurDataURL 
              ? `url(${blurDataURL})` 
              : placeholder === 'blur' 
                ? `url(${generatePlaceholderSrc()})` 
                : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: placeholder === 'blur' ? 'blur(20px)' : 'none',
            transform: placeholder === 'blur' ? 'scale(1.1)' : 'scale(1)'
          }}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          ref={refs}
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Progressive loading indicator */}
      {!isLoaded && imageSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
