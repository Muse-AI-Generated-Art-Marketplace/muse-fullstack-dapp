import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  code?: string
  details?: any
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  const code = err.code || 'INTERNAL_ERROR'

  console.error(`Error ${statusCode}: ${message}`)
  console.error(err.stack)

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      }),
    },
  })
}

export const createError = (
  message: string, 
  statusCode: number = 500,
  code?: string,
  details?: any
): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  error.code = code || 'INTERNAL_ERROR'
  error.details = details
  return error
}

// Predefined error types
export const createValidationError = (message: string, details?: any): AppError => 
  createError(message, 400, 'VALIDATION_ERROR', details)

export const createNotFoundError = (resource: string): AppError => 
  createError(`${resource} not found`, 404, 'NOT_FOUND')

export const createUnauthorizedError = (message: string = 'Unauthorized'): AppError => 
  createError(message, 401, 'UNAUTHORIZED')

export const createForbiddenError = (message: string = 'Forbidden'): AppError => 
  createError(message, 403, 'FORBIDDEN')

export const createRateLimitError = (message: string = 'Rate limit exceeded'): AppError => 
  createError(message, 429, 'RATE_LIMIT_EXCEEDED')

export const createServiceUnavailableError = (message: string = 'Service temporarily unavailable'): AppError => 
  createError(message, 503, 'SERVICE_UNAVAILABLE')

export const createDatabaseError = (message: string = 'Database operation failed'): AppError => 
  createError(message, 500, 'DATABASE_ERROR')

export const createExternalServiceError = (service: string, message: string = 'External service error'): AppError => 
  createError(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service })
