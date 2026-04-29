import { Request, Response, NextFunction } from 'express'
import { validate } from '../middleware/validate'
import { z } from 'zod'

// Mock request, response, and next function
const mockRequest = (body: any = {}, query: any = {}, params: any = {}) => {
  return {
    body,
    query,
    params,
  } as Partial<Request>
}

const mockResponse = () => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockNext = jest.fn()

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Valid Input', () => {
    it('should pass validation for valid data', async () => {
      const schema = z.object({
        body: z.object({
          name: z.string().min(3),
          age: z.number().min(0),
        }),
      })

      const req = mockRequest({ name: 'John', age: 25 })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should pass validation for valid query parameters', async () => {
      const schema = z.object({
        query: z.object({
          page: z.string().transform(Number),
          limit: z.string().transform(Number),
        }),
      })

      const req = mockRequest({}, { page: '1', limit: '10' })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should pass validation for valid path parameters', async () => {
      const schema = z.object({
        params: z.object({
          id: z.string().uuid(),
        }),
      })

      const req = mockRequest({}, {}, { id: '123e4567-e89b-12d3-a456-426614174000' })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  describe('Invalid Input', () => {
    it('should fail validation for invalid body data', async () => {
      const schema = z.object({
        body: z.object({
          name: z.string().min(3),
          age: z.number().min(0),
        }),
      })

      const req = mockRequest({ name: 'Jo', age: -5 }) // Invalid: name too short, age negative
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Validation failed'),
          statusCode: 400,
        })
      )
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should fail validation for missing required fields', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
      })

      const req = mockRequest({ email: 'test@example.com' }) // Missing password
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Validation failed'),
          statusCode: 400,
        })
      )
    })

    it('should fail validation for invalid email format', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
        }),
      })

      const req = mockRequest({ email: 'invalid-email' })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Validation failed'),
          statusCode: 400,
        })
      )
    })
  })

  describe('Complex Schemas', () => {
    it('should validate Stellar address format', async () => {
      const schema = z.object({
        params: z.object({
          address: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format'),
        }),
      })

      // Valid Stellar address
      const validReq = mockRequest({}, {}, { 
        address: 'GABCD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' 
      })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(validReq as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()

      // Invalid Stellar address
      jest.clearAllMocks()
      const invalidReq = mockRequest({}, {}, { address: 'invalid-address' })
      
      await middleware(invalidReq as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Validation failed'),
          statusCode: 400,
        })
      )
    })

    it('should validate nested objects', async () => {
      const schema = z.object({
        body: z.object({
          user: z.object({
            profile: z.object({
              username: z.string().min(3),
              bio: z.string().max(500).optional(),
            }),
            preferences: z.object({
              theme: z.enum(['light', 'dark']),
              notifications: z.boolean(),
            }),
          }),
        }),
      })

      const req = mockRequest({
        user: {
          profile: {
            username: 'testuser',
            bio: 'Test bio',
          },
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      })
      const res = mockResponse()
      const next = mockNext

      const middleware = validate(schema)
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith()
    })
  })
})
