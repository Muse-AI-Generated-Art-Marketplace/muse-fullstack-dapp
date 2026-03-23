import { X, AlertTriangle, Wifi, WifiOff, CreditCard, Shield, Ban } from 'lucide-react'
import { useErrorContext } from '@/contexts/ErrorContext'
import { AppError } from '@/utils/errorHandler'

export function ErrorToast() {
  const { errors, removeError } = useErrorContext()

  const getErrorIcon = (error: AppError) => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'API_ERROR':
        return <WifiOff className="h-5 w-5 text-orange-500" />
      case 'WALLET_ERROR':
      case 'WALLET_REJECTED':
      case 'WALLET_NOT_CONNECTED':
        return <CreditCard className="h-5 w-5 text-yellow-500" />
      case 'INSUFFICIENT_BALANCE':
        return <Ban className="h-5 w-5 text-red-500" />
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return <Shield className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
  }

  const getErrorColor = (error: AppError) => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'API_ERROR':
        return 'border-orange-200 bg-orange-50 text-orange-800'
      case 'WALLET_ERROR':
      case 'WALLET_REJECTED':
      case 'WALLET_NOT_CONNECTED':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'INSUFFICIENT_BALANCE':
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-red-200 bg-red-50 text-red-800'
    }
  }

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`border rounded-lg shadow-lg p-4 ${getErrorColor(error)} transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start space-x-3">
            {getErrorIcon(error)}
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">
                {formatErrorTitle(error.code)}
              </h4>
              <p className="text-sm opacity-90">
                {error.userMessage}
              </p>
              
              {error.details && (
                <details className="mt-2 text-xs opacity-75">
                  <summary className="cursor-pointer hover:opacity-100">
                    Technical details
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {typeof error.details === 'string' 
                      ? error.details 
                      : JSON.stringify(error.details, null, 2)
                    }
                  </pre>
                </details>
              )}
            </div>
            
            <button
              onClick={() => removeError(error.id!)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatErrorTitle(code: string): string {
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
