import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ComponentErrorBoundary, PageErrorBoundary, AsyncErrorBoundary } from '@/components/error'

// Test component that throws different types of errors
function ErrorTestComponent({ errorType }: { errorType: string }) {
  if (errorType === 'render') {
    throw new Error('This is a test render error')
  }
  
  if (errorType === 'network') {
    throw new Error('Failed to fetch: Network connection failed')
  }
  
  if (errorType === 'validation') {
    throw new Error('Validation failed: Invalid input data')
  }
  
  if (errorType === 'wallet') {
    throw new Error('Wallet connection failed: User rejected transaction')
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <p className="text-green-800">No error thrown. Type: {errorType}</p>
    </div>
  )
}

// Async component that throws errors
function AsyncErrorComponent() {
  const [shouldError, setShouldError] = useState(false)
  
  React.useEffect(() => {
    if (shouldError) {
      setTimeout(() => {
        throw new Error('Async error occurred after timeout')
      }, 100)
    }
  }, [shouldError])
  
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <p className="text-blue-800">Async Error Test Component</p>
      <Button 
        onClick={() => setShouldError(true)}
        className="mt-2"
        variant="outline"
        size="sm"
      >
        Trigger Async Error
      </Button>
    </div>
  )
}

export function ErrorBoundaryTest() {
  const [activeError, setActiveError] = useState<string | null>(null)
  const [testMode, setTestMode] = useState<'component' | 'page' | 'async'>('component')
  
  const renderTestBoundary = () => {
    const content = activeError ? (
      <ErrorTestComponent errorType={activeError} />
    ) : (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
        <p className="text-gray-600">Select an error type to test error boundaries</p>
      </div>
    )

    switch (testMode) {
      case 'component':
        return (
          <ComponentErrorBoundary 
            name="TestComponent" 
            showRetry={true}
            customMessage="Test component encountered an error. This is a demonstration of error boundary functionality."
          >
            {content}
          </ComponentErrorBoundary>
        )
      case 'page':
        return (
          <PageErrorBoundary 
            name="TestPage" 
            showRetry={true}
            showHome={true}
            customMessage="Test page encountered an error. This demonstrates page-level error handling."
          >
            {content}
          </PageErrorBoundary>
        )
      case 'async':
        return (
          <AsyncErrorBoundary 
            maxRetries={3}
            showNetworkStatus={true}
          >
            <AsyncErrorComponent />
          </AsyncErrorBoundary>
        )
      default:
        return content
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Boundary Test Suite</h1>
        <p className="text-gray-600 mb-6">
          Test the enhanced error boundary implementation by triggering different types of errors.
        </p>
        
        {/* Test Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Mode</h3>
          <div className="flex space-x-2">
            {(['component', 'page', 'async'] as const).map((mode) => (
              <Button
                key={mode}
                onClick={() => {
                  setTestMode(mode)
                  setActiveError(null)
                }}
                variant={testMode === mode ? 'primary' : 'outline'}
                size="sm"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)} Level
              </Button>
            ))}
          </div>
        </div>
        
        {/* Error Type Selection */}
        {testMode !== 'async' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Error Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { type: 'render', label: 'Render Error' },
                { type: 'network', label: 'Network Error' },
                { type: 'validation', label: 'Validation Error' },
                { type: 'wallet', label: 'Wallet Error' }
              ].map(({ type, label }) => (
                <Button
                  key={type}
                  onClick={() => setActiveError(type)}
                  variant={activeError === type ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Clear Button */}
        <div className="mb-6">
          <Button
            onClick={() => setActiveError(null)}
            variant="secondary"
            size="sm"
          >
            Clear Error
          </Button>
        </div>
        
        {/* Test Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Area</h3>
          {renderTestBoundary()}
        </div>
        
        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">How to Test:</h4>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>Select a test mode (component, page, or async)</li>
            <li>Choose an error type to trigger</li>
            <li>Observe how the error boundary catches and displays the error</li>
            <li>Try the retry functionality to see error recovery</li>
            <li>For async mode, click the button to trigger an async error</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
