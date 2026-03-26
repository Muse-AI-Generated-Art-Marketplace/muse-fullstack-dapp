import React from 'react'

export interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  if (variant === 'spinner') {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={`animate-spin rounded-full border-2 border-primary-600 border-t-transparent ${sizeClasses[size]} ${className}`}
      />
    )
  }

  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-label="Loading content"
        aria-busy="true"
        className={`bg-secondary-200 rounded-md animate-pulse ${className}`}
      />
    )
  }

  if (variant === 'pulse') {
    return (
      <div
        role="status"
        aria-label="Refreshing"
        aria-busy="true"
        className={`bg-secondary-100 rounded-md animate-pulse ${className}`}
      />
    )
  }

  return null
}

export interface LoadingCardProps {
  count?: number
  variant?: 'artwork' | 'default'
  className?: string
}

export function LoadingCard({
  count = 1,
  variant = 'default',
  className = ''
}: LoadingCardProps) {
  if (variant === 'artwork') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card-mobile overflow-hidden">
            <div className="aspect-square bg-secondary-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-secondary-200 rounded animate-pulse" />
              <div className="h-3 bg-secondary-100 rounded w-3/4 animate-pulse" />
              <div className="flex justify-between">
                <div className="h-3 bg-secondary-200 rounded w-1/4 animate-pulse" />
                <div className="h-8 bg-secondary-200 rounded w-20 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="h-4 bg-secondary-200 rounded animate-pulse" />
          <div className="h-3 bg-secondary-100 rounded w-3/4 animate-pulse" />
          <div className="h-20 bg-secondary-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
