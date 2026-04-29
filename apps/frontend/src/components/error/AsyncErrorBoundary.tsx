import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { AppError, ErrorHandler } from '@/utils/errorHandler'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  maxRetries?: number
  retryDelay?: number
  showNetworkStatus?: boolean
}

interface State {
  hasError: boolean
  error: AppError | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRetrying: boolean
  isOnline: boolean
}

export class AsyncErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null
  private maxRetries: number
  private retryDelay: number

  constructor(props: Props) {
    super(props)
    this.maxRetries = props.maxRetries || 5
    this.retryDelay = props.retryDelay || 1000
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      isOnline: navigator.onLine
    }
  }

  componentDidMount() {
    // Listen for network changes
    window.addEventListener('online', this.handleNetworkChange)
    window.addEventListener('offline', this.handleNetworkChange)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleNetworkChange)
    window.removeEventListener('offline', this.handleNetworkChange)
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error: ErrorHandler.handle(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorHandler.handle(error)
    
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(appError, errorInfo)
  }

  handleNetworkChange = () => {
    this.setState({ isOnline: navigator.onLine })
    
    // Auto-retry when coming back online for network errors
    if (navigator.onLine && this.state.error?.code === 'NETWORK_ERROR') {
      this.handleRetry()
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    this.setState({ isRetrying: true })

    // Exponential backoff for retries
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount)
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }))
    }, delay)
  }

  handleManualRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
    this.handleRetry()
  }

  renderNetworkStatus() {
    if (!this.props.showNetworkStatus) return null

    return (
      <div className="flex items-center space-x-2 text-sm mb-4">
        {this.state.isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-green-600">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-red-600">Offline</span>
          </>
        )}
      </div>
    )
  }

  renderErrorFallback() {
    const { error, retryCount, isRetrying, isOnline } = this.state
    const { fallback } = this.props

    if (fallback) {
      return fallback
    }

    const isNetworkError = error?.code === 'NETWORK_ERROR' || error?.code === 'API_ERROR'
    const canRetry = retryCount < this.maxRetries
    const isRetryableError = isNetworkError || error?.isRecoverable !== false

    return (
      <div className="flex flex-col items-center justify-center p-6 border border-orange-200 rounded-lg bg-orange-50" role="alert">
        <div className="text-center max-w-sm">
          {/* Error Icon */}
          <div className="mb-4">
            {isNetworkError ? (
              <WifiOff className="h-8 w-8 text-orange-500 mx-auto" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto" aria-hidden="true" />
            )}
          </div>

          {/* Network Status */}
          {this.renderNetworkStatus()}

          {/* Error Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNetworkError ? 'Connection Error' : 'Loading Error'}
          </h3>

          {/* Error Message */}
          <p className="text-gray-600 mb-4 text-sm">
            {error?.userMessage || 
             (isNetworkError 
               ? 'Unable to connect to the server. Please check your internet connection.'
               : 'Failed to load content. Please try again.'
             )}
          </p>

          {/* Retry Status */}
          {isRetrying && (
            <div className="flex items-center justify-center space-x-2 mb-4 text-sm text-orange-600">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Retrying...</span>
            </div>
          )}

          {/* Retry Count */}
          {retryCount > 0 && !isRetrying && (
            <p className="text-xs text-gray-500 mb-4">
              Retry attempt {retryCount} of {this.maxRetries}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {isRetryableError && canRetry && !isRetrying && (
              <Button
                onClick={this.handleManualRetry}
                variant="primary"
                size="sm"
                className="w-full"
                disabled={!isOnline && isNetworkError}
                aria-label="Retry the failed operation"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                {isNetworkError && !isOnline ? 'Waiting for Connection' : 'Retry'}
              </Button>
            )}

            {!canRetry && (
              <p className="text-xs text-gray-500 text-center">
                Maximum retry attempts reached. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback()
    }

    return this.props.children
  }
}

// Hook for async operations with automatic error boundary integration
export function useAsyncErrorBoundary() {
  const throwAsyncError = (error: unknown) => {
    // Throw the error asynchronously to be caught by the error boundary
    setTimeout(() => {
      throw error
    }, 0)
  }

  return { throwAsyncError }
}
