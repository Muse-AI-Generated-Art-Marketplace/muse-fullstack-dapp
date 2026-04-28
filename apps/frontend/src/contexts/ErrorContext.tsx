import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AppError, ErrorHandler } from '@/utils/errorHandler'

interface ErrorContextType {
  errors: AppError[]
  addError: (error: AppError) => void
  removeError: (id: string) => void
  clearErrors: () => void
  showError: (error: unknown) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([])

  const addError = useCallback((error: AppError) => {
    // Stamp a client-side deduplication id if missing
    if (!error.id) {
      error.id = Math.random().toString(36).slice(2, 11)
    }

    setErrors((prev) => {
      // Deduplicate by code + message
      const exists = prev.some((e) => e.code === error.code && e.message === error.message)
      if (exists) return prev
      // Keep last 10 only
      return [...prev, error].slice(-10)
    })

    // Auto-dismiss recoverable errors after 5 seconds
    if (error.isRecoverable !== false && error.code !== 'INSUFFICIENT_BALANCE') {
      setTimeout(() => {
        removeError(error.id!)
      }, 5000)
    }
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearErrors = useCallback(() => setErrors([]), [])

  const showError = useCallback(
    (error: unknown) => {
      const appError = ErrorHandler.handle(error)
      addError(appError)
    },
    [addError]
  )

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors, showError }}>
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
