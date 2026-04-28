import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { createError } from './errorHandler'

/**
 * Higher-order middleware that validates request data against a Zod schema.
 * Checks body, query, and params.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        
        return next(createError(`Validation failed: ${message}`, 400))
      }
      next(error)
    }
  }
}
