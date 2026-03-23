// Error Handling Test Suite
// This file contains test cases to validate the enhanced error handling system

import { ErrorHandler, AppError } from '../utils/errorHandler'

// Mock console methods to avoid test output pollution
const originalConsoleError = console.error
const originalConsoleLog = console.log

beforeAll(() => {
  console.error = jest.fn()
  console.log = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
})

describe('ErrorHandler', () => {
  describe('Network Errors', () => {
    test('should handle network connection errors', () => {
      const error = new Error('Network connection failed')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.userMessage).toBe('Network connection failed. Please check your internet connection and try again.')
      expect(result.isRecoverable).toBe(true)
    })

    test('should handle fetch errors', () => {
      const error = new Error('Failed to fetch')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('API_ERROR')
      expect(result.userMessage).toBe('Unable to connect to the server. Please try again later.')
    })
  })

  describe('HTTP Status Errors', () => {
    test('should handle 401 unauthorized errors', () => {
      const error = new Error('Request failed with status code 401')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('UNAUTHORIZED')
      expect(result.userMessage).toBe('Please connect your wallet to continue.')
    })

    test('should handle 403 forbidden errors', () => {
      const error = new Error('Request failed with status code 403')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('FORBIDDEN')
      expect(result.userMessage).toBe('You don\'t have permission to perform this action.')
      expect(result.isRecoverable).toBe(false)
    })

    test('should handle 404 not found errors', () => {
      const error = new Error('Request failed with status code 404')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('NOT_FOUND')
      expect(result.userMessage).toBe('The requested resource was not found.')
    })

    test('should handle 429 rate limit errors', () => {
      const error = new Error('Request failed with status code 429')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(result.userMessage).toBe('Too many requests. Please wait a moment and try again.')
    })

    test('should handle 500 server errors', () => {
      const error = new Error('Request failed with status code 500')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.userMessage).toBe('Server error occurred. Please try again later.')
    })
  })

  describe('Wallet Errors', () => {
    test('should handle wallet rejection errors', () => {
      const error = new Error('User rejected the transaction')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('WALLET_REJECTED')
      expect(result.userMessage).toBe('Transaction was cancelled. You can try again when ready.')
    })

    test('should handle insufficient balance errors', () => {
      const error = new Error('Insufficient balance for transaction')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('INSUFFICIENT_BALANCE')
      expect(result.userMessage).toBe('Insufficient balance for this transaction. Please add funds to your wallet.')
      expect(result.isRecoverable).toBe(false)
    })

    test('should handle wallet not connected errors', () => {
      const error = new Error('Wallet not connected')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('WALLET_NOT_CONNECTED')
      expect(result.userMessage).toBe('Please connect your wallet to continue.')
    })

    test('should handle wallet timeout errors', () => {
      const error = new Error('Wallet connection timed out')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('WALLET_TIMEOUT')
      expect(result.userMessage).toBe('Wallet connection timed out. Please try again.')
    })

    test('should handle wallet signature errors', () => {
      const error = new Error('Failed to sign transaction')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('WALLET_SIGNATURE_ERROR')
      expect(result.userMessage).toBe('Failed to sign transaction. Please check your wallet and try again.')
    })

    test('should handle wallet locked errors', () => {
      const error = new Error('Wallet is locked')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('WALLET_LOCKED')
      expect(result.userMessage).toBe('Wallet is locked. Please unlock your wallet and try again.')
    })
  })

  describe('Validation Errors', () => {
    test('should handle validation errors', () => {
      const error = new Error('Validation failed: Invalid input')
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.userMessage).toBe('Please check your input and try again.')
    })
  })

  describe('Unknown Errors', () => {
    test('should handle string errors', () => {
      const error = 'Unknown error occurred'
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.userMessage).toBe('An unexpected error occurred. Please try again.')
    })

    test('should handle null errors', () => {
      const error = null
      const result = ErrorHandler.handle(error)
      
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.userMessage).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('Utility Methods', () => {
    test('should determine recoverable errors correctly', () => {
      const recoverableError = ErrorHandler.handle(new Error('Network error'))
      const nonRecoverableError = ErrorHandler.handle(new Error('Insufficient balance'))
      
      expect(ErrorHandler.isRecoverable(recoverableError)).toBe(true)
      expect(ErrorHandler.isRecoverable(nonRecoverableError)).toBe(false)
    })

    test('should calculate retry delay correctly', () => {
      const delay1 = ErrorHandler.getRetryDelay(0)
      const delay2 = ErrorHandler.getRetryDelay(1)
      const delay3 = ErrorHandler.getRetryDelay(4)
      
      expect(delay1).toBe(1000)
      expect(delay2).toBe(2000)
      expect(delay3).toBe(10000) // Max delay
    })
  })
})

// Integration Test Examples
describe('Error Handling Integration', () => {
  test('should handle API response with error structure', () => {
    const apiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
        userMessage: 'Please check your input and try again.',
        details: { field: 'price', issue: 'must be positive' }
      }
    }

    // Simulate frontend handling
    const error = new Error(apiResponse.error.message)
    const handledError = ErrorHandler.handle(error)
    
    expect(handledError.code).toBe(apiResponse.error.code)
    expect(handledError.userMessage).toBe(apiResponse.error.userMessage)
  })

  test('should handle wallet operation errors', () => {
    const walletErrors = [
      'User rejected the transaction',
      'Insufficient balance',
      'Wallet not connected',
      'Wallet connection timed out'
    ]

    walletErrors.forEach(errorMessage => {
      const error = new Error(errorMessage)
      const handledError = ErrorHandler.handle(error)
      
      expect(handledError.code).toContain('WALLET')
      expect(handledError.userMessage).toBeTruthy()
      expect(handledError.timestamp).toBeTruthy()
    })
  })
})
