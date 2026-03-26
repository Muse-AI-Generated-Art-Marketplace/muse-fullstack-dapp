import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Keypair } from 'stellar-sdk'
import User from '@/models/User'
import { createError } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AuthController')
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret_donotuseinprod'
const TOKEN_EXPIRY = '24h'

/**
 * Validates a signature from a Stellar wallet.
 * In a real implementation, you'd use a challenge-based system to prevent replay attacks.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, signature, payload } = req.body

    if (!address || !signature || !payload) {
      return next(createError('Missing address, signature, or payload', 400))
    }

    // Verify signature using Stellar SDK
    const keypair = Keypair.fromPublicKey(address)
    const isVerified = keypair.verify(Buffer.from(payload), Buffer.from(signature, 'base64'))

    if (!isVerified) {
      return next(createError('Invalid signature provided', 401))
    }

    // Check if user exists or create a new one
    let user = await User.findOne({ address })
    if (!user) {
      user = await User.create({
        address,
        username: 'New Artist',
        bio: 'Just joined Muse marketplace'
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        address: user.address,
        id: user._id 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          address: user.address,
          username: user.username,
          profileImage: user.profileImage
        }
      }
    })

    logger.info(`User logged in successfully: ${address}`)
  } catch (error) {
    logger.error('Login failed:', error)
    next(createError('Authentication failed', 500))
  }
}

/**
 * Placeholder for fetching a challenge/nonce for more secure login
 */
export const getChallenge = (req: Request, res: Response) => {
  // In a robust implementation, generate a random nonce and store in Redis with TTL
  const nonce = `Muse Authentication Challenge: ${Math.random().toString(36).substring(7)}`
  res.json({
    success: true,
    data: { challenge: nonce }
  })
}
