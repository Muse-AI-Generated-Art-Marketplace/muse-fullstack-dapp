import { Request, Response, NextFunction } from 'express'

// ---------------------------------------------------------------------------
// AppError — typed, operational error class
// ---------------------------------------------------------------------------
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly userMessage: string
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    userMessage?: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.userMessage = userMessage ?? message
    this.isOperational = true
    this.details = details
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  userMessage?: string,
  details?: unknown
): AppError => new AppError(message, statusCode, code ?? 'INTERNAL_ERROR', userMessage, details)

export const createValidationError = (message: string, details?: unknown): AppError =>
  new AppError(message, 400, 'VALIDATION_ERROR', 'Please check your input and try again.', details)

export const createNotFoundError = (resource: string): AppError =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND', `The requested ${resource.toLowerCase()} could not be found.`)

export const createUnauthorizedError = (message = 'Unauthorized'): AppError =>
  new AppError(message, 401, 'UNAUTHORIZED', 'Please connect your wallet or log in to continue.')

export const createForbiddenError = (message = 'Forbidden'): AppError =>
  new AppError(message, 403, 'FORBIDDEN', "You don't have permission to perform this action.")

export const createRateLimitError = (message = 'Rate limit exceeded'): AppError =>
  new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please wait a moment and try again.')

export const createServiceUnavailableError = (message = 'Service temporarily unavailable'): AppError =>
  new AppError(message, 503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again later.')

export const createDatabaseError = (message = 'Database operation failed'): AppError =>
  new AppError(message, 500, 'DATABASE_ERROR', 'A database error occurred. Please try again.')

export const createExternalServiceError = (service: string, message = 'External service error'): AppError =>
  new AppError(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', `Communication with ${service} failed. Please try again.`, { service })

// ---------------------------------------------------------------------------
// Global Express error-handling middleware
// ---------------------------------------------------------------------------
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError
  const statusCode = isAppError ? err.statusCode : 500
  const code = isAppError ? err.code : 'INTERNAL_ERROR'
  const userMessage = isAppError
    ? err.userMessage
    : 'An unexpected error occurred. Please try again later.'

  // Log full details server-side
  const requestId = (req as Request & { requestId?: string }).requestId
  const logPrefix = requestId ? `[${requestId}]` : ''
  console.error(
    `${logPrefix} [${new Date().toISOString()}] [ERROR] ${statusCode} ${code}: ${err.message}`,
    {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ...(isAppError && err.details ? { details: err.details } : {}),
    }
  )

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: userMessage,
      userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        developerMessage: err.message,
        stack: err.stack,
        details: isAppError ? err.details : undefined,
      }),
      requestId,
    },
  })
}

// ---------------------------------------------------------------------------
// Not-found catch-all (place before errorHandler in Express chain)
// ---------------------------------------------------------------------------
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(createNotFoundError(`Route ${req.method} ${req.path}`))
}
