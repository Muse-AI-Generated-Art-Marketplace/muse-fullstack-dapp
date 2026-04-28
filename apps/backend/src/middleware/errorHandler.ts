import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  status: number
  code?: string
  details?: any
  isOperational: boolean

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export const createError = (
  message: string,
  status = 500,
  code?: string,
  details?: any
): AppError => {
  return new AppError(message, status, code, details)
}

export const createNotFoundError = (resource: string): AppError => {
  return createError(`${resource} not found`, 404, 'NOT_FOUND')
}

export const createValidationError = (message: string, details?: any): AppError => {
  return createError(message, 400, 'VALIDATION_ERROR', details)
}

export const createExternalServiceError = (service: string, message: string): AppError => {
  return createError(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
}

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const error = err as AppError
  const status = error?.status ?? 500
  const response = {
    success: false,
    message: error?.message || 'Internal Server Error',
    code: error?.code,
    details: error?.details
  } as {
    success: false
    message: string
    code?: string
    details?: any
    stack?: string
  }

  if (process.env.NODE_ENV !== 'production' && error?.stack) {
    response.stack = error.stack
  }

  res.status(status).json(response)
}
