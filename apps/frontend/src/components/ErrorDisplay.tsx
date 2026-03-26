import React from 'react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { AppError, ErrorHandler } from '@/utils/errorHandler'
import { Button } from '@/components/ui/Button'

interface ErrorDisplayProps {
  error: AppError | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  showRetry = true,
  showDismiss = true
}: ErrorDisplayProps) {
  if (!error) return null

  const getErrorIcon = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'API_ERROR':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'WALLET_ERROR':
      case 'WALLET_REJECTED':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'INSUFFICIENT_BALANCE':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getErrorColor = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'API_ERROR':
        return 'border-orange-200 bg-orange-50 text-orange-800'
      case 'WALLET_ERROR':
      case 'WALLET_REJECTED':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'INSUFFICIENT_BALANCE':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-red-200 bg-red-50 text-red-800'
    }
  }

  return (
    <div 
      className={`border rounded-lg p-4 ${getErrorColor()} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        <div aria-hidden="true">
          {getErrorIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">
            {error.code.replace('_', ' ').charAt(0).toUpperCase() + error.code.replace('_', ' ').slice(1)}
          </h3>
          <p className="text-sm">{error.userMessage}</p>

          {error.isRecoverable && showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center space-x-1 text-sm font-medium underline hover:no-underline focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
              aria-label={`Retry failed action: ${error.code.replace('_', ' ')}`}
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              <span>Try Again</span>
            </button>
          )}
        </div>

        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors focus-visible:ring-2"
            aria-label="Dismiss this error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

// Smaller inline error component
interface InlineErrorProps {
  error: AppError | null
  className?: string
}

export function InlineError({ error, className = '' }: InlineErrorProps) {
  if (!error) return null

  return (
    <div className={`text-sm text-red-600 mt-1 ${className}`}>
      {error.userMessage}
    </div>
  )
}

// Toast-style error component
interface ToastErrorProps {
  error: AppError | null
  onDismiss?: () => void
  autoDismiss?: boolean
}

export function ToastError({ error, onDismiss, autoDismiss = true }: ToastErrorProps) {
  if (!error) return null

  React.useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onDismiss])

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-red-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {error.code.replace('_', ' ').charAt(0).toUpperCase() + error.code.replace('_', ' ').slice(1)}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{error.userMessage}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: ErrorHandler.handle(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                {this.state.error.userMessage}
              </p>
              <Button
                onClick={this.handleRetry}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

