import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { AppError, ErrorHandler } from '@/utils/errorHandler'
import { logError } from '@/services/errorLogger'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  showRetry?: boolean
  showHome?: boolean
  showBack?: boolean
  customMessage?: string
  level?: 'page' | 'component' | 'critical'
  name?: string
}

interface State {
  hasError: boolean
  error: AppError | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
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
    
    // Enhanced error logging with component context
    logError({
      message: appError.message,
      stack: (typeof appError.details === 'string' ? appError.details : JSON.stringify(appError.details)) || error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      componentName: this.props.name || 'Unknown',
      level: this.props.level || 'component',
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    })

    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(appError, errorInfo)
  }

  componentWillUnmount() {
    // Clean up any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      // Max retries reached, don't retry again
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  renderErrorFallback() {
    const { error, retryCount } = this.state
    const { 
      fallback, 
      showRetry = true, 
      showHome = true, 
      showBack = false,
      customMessage,
      level = 'component',
      name 
    } = this.props

    if (fallback) {
      return fallback
    }

    const isPageLevel = level === 'page'
    const isCritical = level === 'critical'
    const canRetry = retryCount < this.maxRetries

    const containerClasses = isPageLevel 
      ? 'min-h-screen flex items-center justify-center bg-gray-50'
      : 'flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50'

    const contentClasses = isPageLevel
      ? 'max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'
      : 'text-center max-w-sm'

    return (
      <div className={containerClasses} role="alert" aria-live="assertive">
        <div className={contentClasses}>
          {/* Error Icon */}
          <div className="mb-4">
            <AlertTriangle 
              className={`${
                isPageLevel ? 'h-16 w-16' : 'h-8 w-8'
              } text-red-500 mx-auto`}
              aria-hidden="true"
            />
          </div>

          {/* Error Title */}
          <h1 className={`${
            isPageLevel ? 'text-2xl' : 'text-lg'
          } font-semibold text-gray-900 mb-2`}>
            {isCritical ? 'Critical Error' : 'Something went wrong'}
          </h1>

          {/* Component Name (for debugging) */}
          {name && import.meta.env.DEV && (
            <p className="text-xs text-gray-500 mb-2 font-mono">
              Component: {name}
            </p>
          )}

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            {customMessage || error?.userMessage || 
             (isPageLevel 
               ? 'An unexpected error occurred. We\'ve been notified and are working to fix this issue.'
               : 'This component encountered an error.'
             )}
          </p>

          {/* Retry Count Indicator */}
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Retry attempt {retryCount} of {this.maxRetries}
            </p>
          )}

          {/* Action Buttons */}
          <div className={`flex flex-col ${isPageLevel ? 'space-y-3' : 'space-y-2'}`}>
            {showRetry && canRetry && (
              <Button
                onClick={this.handleRetry}
                variant="primary"
                size={isPageLevel ? 'lg' : 'md'}
                className="w-full"
                aria-label="Retry the failed operation"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </Button>
            )}

            {showRetry && !canRetry && (
              <Button
                onClick={this.handleReload}
                variant="secondary"
                size={isPageLevel ? 'lg' : 'md'}
                className="w-full"
                aria-label="Reload the page"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Reload Page
              </Button>
            )}

            {showHome && (
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size={isPageLevel ? 'lg' : 'md'}
                className="w-full"
                aria-label="Go to homepage"
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Go Home
              </Button>
            )}

            {showBack && (
              <Button
                onClick={this.handleGoBack}
                variant="ghost"
                size="sm"
                className="w-full"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Go Back
              </Button>
            )}
          </div>

          {/* Error Details (Development Only) */}
          {import.meta.env.DEV && error && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Code:</strong> {error.code}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                {this.state.errorInfo && (
                  <div className="mt-2">
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
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

// Convenience wrapper for common use cases
export function PageErrorBoundary({ children, name, ...props }: Omit<Props, 'level'>) {
  return (
    <EnhancedErrorBoundary level="page" name={name} {...props}>
      {children}
    </EnhancedErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children, name, ...props }: Omit<Props, 'level'>) {
  return (
    <EnhancedErrorBoundary level="component" name={name} {...props}>
      {children}
    </EnhancedErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children, name, ...props }: Omit<Props, 'level'>) {
  return (
    <EnhancedErrorBoundary level="critical" name={name} {...props}>
      {children}
    </EnhancedErrorBoundary>
  )
}
