export interface AppError {
  code: string
  message: string
  userMessage: string
  statusCode?: number
  isRecoverable?: boolean
  details?: any
  timestamp?: string
}

export class ErrorHandler {
  private static getErrorMessage(error: unknown): AppError {
    if (error instanceof Error) {
      return this.parseError(error)
    }
    
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        userMessage: 'An unexpected error occurred. Please try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      isRecoverable: true,
      timestamp: new Date().toISOString()
    }
  }

  private static parseError(error: Error): AppError {
    const errorMessage = error.message.toLowerCase()
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    // API errors
    if (errorMessage.includes('failed to fetch') || errorMessage.includes('api')) {
      return {
        code: 'API_ERROR',
        message: error.message,
        userMessage: 'Unable to connect to the server. Please try again later.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    // HTTP Status errors
    if (errorMessage.includes('status 401') || errorMessage.includes('unauthorized')) {
      return {
        code: 'UNAUTHORIZED',
        message: error.message,
        userMessage: 'Please connect your wallet to continue.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('status 403') || errorMessage.includes('forbidden')) {
      return {
        code: 'FORBIDDEN',
        message: error.message,
        userMessage: 'You don\'t have permission to perform this action.',
        isRecoverable: false,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('status 404') || errorMessage.includes('not found')) {
      return {
        code: 'NOT_FOUND',
        message: error.message,
        userMessage: 'The requested resource was not found.',
        isRecoverable: false,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('status 429') || errorMessage.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('status 500') || errorMessage.includes('internal server')) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
        userMessage: 'Server error occurred. Please try again later.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    // Wallet errors
    if (errorMessage.includes('wallet') || errorMessage.includes('freighter')) {
      return this.parseWalletError(error)
    }
    
    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        userMessage: 'Please check your input and try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    // Default error
    return {
      code: 'GENERAL_ERROR',
      message: error.message,
      userMessage: 'Something went wrong. Please try again.',
      isRecoverable: true,
      timestamp: new Date().toISOString()
    }
  }
  
  private static parseWalletError(error: Error): AppError {
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('declined') || errorMessage.includes('cancelled')) {
      return {
        code: 'WALLET_REJECTED',
        message: error.message,
        userMessage: 'Transaction was cancelled. You can try again when ready.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('insufficient') || errorMessage.includes('balance') || errorMessage.includes('funds')) {
      return {
        code: 'INSUFFICIENT_BALANCE',
        message: error.message,
        userMessage: 'Insufficient balance for this transaction. Please add funds to your wallet.',
        isRecoverable: false,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('not connected') || errorMessage.includes('no account')) {
      return {
        code: 'WALLET_NOT_CONNECTED',
        message: error.message,
        userMessage: 'Please connect your wallet to continue.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        code: 'WALLET_TIMEOUT',
        message: error.message,
        userMessage: 'Wallet connection timed out. Please try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('network') && errorMessage.includes('testnet')) {
      return {
        code: 'WALLET_NETWORK_MISMATCH',
        message: error.message,
        userMessage: 'Wallet network mismatch. Please ensure your wallet is set to the correct network.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('signature') || errorMessage.includes('sign')) {
      return {
        code: 'WALLET_SIGNATURE_ERROR',
        message: error.message,
        userMessage: 'Failed to sign transaction. Please check your wallet and try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
      return {
        code: 'WALLET_LOCKED',
        message: error.message,
        userMessage: 'Wallet is locked. Please unlock your wallet and try again.',
        isRecoverable: true,
        timestamp: new Date().toISOString()
      }
    }
    
    return {
      code: 'WALLET_ERROR',
      message: error.message,
      userMessage: 'Wallet operation failed. Please check your wallet and try again.',
      isRecoverable: true,
      timestamp: new Date().toISOString()
    }
  }
  
  public static handle(error: unknown): AppError {
    const appError = this.getErrorMessage(error)
    
    // Log error for debugging
    console.error('App Error:', {
      code: appError.code,
      message: appError.message,
      userMessage: appError.userMessage,
      timestamp: new Date().toISOString()
    })
    
    return appError
  }
  
  public static isRecoverable(error: AppError): boolean {
    return error.isRecoverable ?? true
  }
  
  public static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    return Math.min(1000 * Math.pow(2, attempt), 10000)
  }
}

// React Query error handler
export const queryErrorHandler = (error: unknown) => {
  const appError = ErrorHandler.handle(error)
  
  // You could integrate with a toast/notification system here
  console.error('Query Error:', appError.userMessage)
  
  return appError
}

// Async function wrapper with error handling
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> => {
  try {
    return await asyncFn()
  } catch (error) {
    const appError = ErrorHandler.handle(error)
    onError?.(appError)
    return null
  }
}
