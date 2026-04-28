import React from 'react'
import { Grid } from '@/components/layout/Grid'

export interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots' | 'bars'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  className = '',
  text
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
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

// Page Loading Components
export interface PageLoadingProps {
  message?: string
  variant?: 'centered' | 'overlay'
  className?: string
}

export function PageLoading({ 
  message = 'Loading...', 
  variant = 'centered',
  className = '' 
}: PageLoadingProps) {
  if (variant === 'overlay') {
    return (
      <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loading variant="spinner" size="xl" />
          <p className="text-lg font-medium text-secondary-700">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center min-h-96 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <Loading variant="spinner" size="xl" />
        <p className="text-lg font-medium text-secondary-700">{message}</p>
      </div>
    </div>
  )
}

// Transaction Loading Component
export interface TransactionLoadingProps {
  message?: string
  steps?: string[]
  currentStep?: number
  className?: string
}

export function TransactionLoading({ 
  message = 'Processing transaction...',
  steps = ['Initiating', 'Processing', 'Confirming'],
  currentStep = 0,
  className = '' 
}: TransactionLoadingProps) {
  return (
    <div className={`flex flex-col items-center gap-4 p-6 ${className}`}>
      <Loading variant="bars" text={message} />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-200 text-secondary-600'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-secondary-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-secondary-600">
          {steps[currentStep]}
        </div>
      </div>
    </div>
  )
}

// Minting Loading Component
export interface MintingLoadingProps {
  currentStage?: 'generating' | 'minting' | 'confirming'
  progress?: number
  className?: string
}

export function MintingLoading({ 
  currentStage = 'generating',
  progress = 0,
  className = '' 
}: MintingLoadingProps) {
  const stages = {
    generating: { message: 'Generating artwork...', color: 'primary' },
    minting: { message: 'Minting to blockchain...', color: 'secondary' },
    confirming: { message: 'Confirming transaction...', color: 'success' }
  }

  const stage = stages[currentStage]

  return (
    <div className={`flex flex-col items-center gap-4 p-6 ${className}`}>
      <Loading variant="spinner" size="lg" text={stage.message} />
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary-600">Progress</span>
          <span className="text-secondary-800 font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-2">
          <div
            className={`bg-${stage.color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Button Loading Component
export interface ButtonLoadingProps {
  variant?: 'spinner' | 'dots'
  size?: 'sm' | 'md'
  className?: string
}

export function ButtonLoading({ 
  variant = 'spinner', 
  size = 'sm',
  className = '' 
}: ButtonLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  }

  if (variant === 'dots') {
    return (
      <div className={`flex gap-1 ${className}`}>
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    )
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  )
}

export interface LoadingCardProps {
  count?: number
  variant?: 'artwork' | 'default' | 'profile'
  className?: string
}

export function LoadingCard({
  count = 1,
  variant = 'default',
  className = ''
}: LoadingCardProps) {
  if (variant === 'artwork') {
    return (
      <Grid responsive className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
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
      </Grid>
    )
  }

  if (variant === 'profile') {
    return (
      <div className={`card p-6 space-y-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-secondary-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-secondary-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-secondary-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-secondary-100 rounded animate-pulse" />
          <div className="h-4 bg-secondary-100 rounded w-3/4 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-secondary-200 rounded w-12 mx-auto mb-1 animate-pulse" />
              <div className="h-3 bg-secondary-100 rounded w-16 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Grid responsive className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="h-4 bg-secondary-200 rounded animate-pulse" />
          <div className="h-3 bg-secondary-100 rounded w-3/4 animate-pulse" />
          <div className="h-20 bg-secondary-100 rounded animate-pulse" />
        </div>
      ))}
    </Grid>
  )
}

