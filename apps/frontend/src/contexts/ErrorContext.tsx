import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AppError } from '@/utils/errorHandler'

interface ErrorContextType {
  errors: AppError[]
  addError: (error: AppError) => void
  removeError: (id: string) => void
  clearErrors: () => void
  showError: (error: unknown) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([])

  const addError = useCallback((error: AppError) => {
    const errorWithId = {
      ...error,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: error.timestamp || new Date().toISOString()
    }
    
    setErrors(prev => {
      // Avoid duplicate errors
      const exists = prev.some(e => e.code === error.code && e.message === error.message)
      if (exists) return prev
      
      // Keep only last 10 errors
      const updated = [...prev, errorWithId]
      return updated.slice(-10)
    })

    // Auto-dismiss non-critical errors after 5 seconds
    if (error.isRecoverable !== false && error.code !== 'INSUFFICIENT_BALANCE') {
      setTimeout(() => {
        removeError(errorWithId.id)
      }, 5000)
    }
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const showError = useCallback((error: unknown) => {
    // Import ErrorHandler dynamically to avoid circular dependencies
    import('@/utils/errorHandler').then(({ ErrorHandler }) => {
      const appError = ErrorHandler.handle(error)
      addError(appError)
    })
  }, [addError])

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    showError
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useErrorContext() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  return context
}

// Extend AppError interface to include id
declare module '@/utils/errorHandler' {
  interface AppError {
    id?: string
  }
}
