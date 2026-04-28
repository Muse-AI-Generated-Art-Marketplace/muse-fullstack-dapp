import { Request, Response, NextFunction } from 'express'
import { createUnauthorizedError } from './errorHandler'
import { AuthenticatedRequest } from '@/types'

// Simple authentication middleware for Stellar public key authentication
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      const error = createUnauthorizedError('Authorization header required')
      return res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          userMessage: 'Please provide your Stellar public key in the Authorization header'
        }
      })
    }

    // Extract public key from "Bearer <public-key>" format
    const match = authHeader.match(/^Bearer\s+(.+)$/)
    if (!match) {
      const error = createUnauthorizedError('Invalid authorization format')
      return res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          userMessage: 'Please use "Bearer <your-stellar-public-key>" format'
        }
      })
    }

    const publicKey = match[1]
    
    // Basic validation for Stellar public key
    if (!isValidStellarPublicKey(publicKey)) {
      const error = createUnauthorizedError('Invalid Stellar public key')
      return res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          userMessage: 'Please provide a valid Stellar public key'
        }
      })
    }

    // Set user information on request
    req.user = {
      publicKey,
      network: process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
    }

    next()
  } catch (error) {
    const authError = createUnauthorizedError('Authentication failed')
    res.status(401).json({
      success: false,
      error: {
        code: authError.code,
        message: authError.message,
        userMessage: 'Authentication failed. Please check your credentials.'
      }
    })
  }
}

// Optional authentication middleware - doesn't fail if no auth provided
export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/)
      if (match) {
        const publicKey = match[1]
        if (isValidStellarPublicKey(publicKey)) {
          req.user = {
            publicKey,
            network: process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
          }
        }
      }
    }

    next()
  } catch (error) {
    // Don't fail the request, just continue without authentication
    next()
  }
}

// Helper function to validate Stellar public key
const isValidStellarPublicKey = (publicKey: string): boolean => {
  // Stellar public keys start with 'G' and are 56 characters long
  // They contain only base32 characters
  const stellarPublicKeyRegex = /^G[A-Z0-9]{55}$/
  return stellarPublicKeyRegex.test(publicKey)
}

export default authMiddleware
