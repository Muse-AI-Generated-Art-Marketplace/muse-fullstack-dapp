import { createHash } from 'crypto'
import * as StellarSdk from 'stellar-sdk'
import { createLogger } from '@/utils/logger'
import User from '@/models/User'

const logger = createLogger('VerificationService')

export interface VerificationChallenge {
  message: string
  nonce: string
  timestamp: number
  expiresAt: number
}

export interface VerificationResult {
  success: boolean
  user?: any
  error?: string
  isNewUser?: boolean
}

export class VerificationService {
  private static instance: VerificationService
  private challenges = new Map<string, VerificationChallenge>()

  private constructor() {}

  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService()
    }
    return VerificationService.instance
  }

  /**
   * Generate a verification challenge for wallet signature
   */
  public generateChallenge(address: string): VerificationChallenge {
    const nonce = this.generateNonce()
    const timestamp = Date.now()
    const expiresAt = timestamp + 5 * 60 * 1000 // 5 minutes expiration

    const message = `Welcome to Muse AI Art Marketplace!

Please sign this message to verify your wallet address and authenticate.

This request will not trigger any blockchain transaction or cost any fees.

Nonce: ${nonce}
Address: ${address}
Timestamp: ${timestamp}
Expires: ${new Date(expiresAt).toISOString()}

By signing, you agree to our Terms of Service and Privacy Policy.`

    const challenge: VerificationChallenge = {
      message,
      nonce,
      timestamp,
      expiresAt
    }

    // Store challenge for verification
    this.challenges.set(address.toLowerCase(), challenge)

    // Clean up expired challenges periodically
    this.cleanupExpiredChallenges()

    logger.debug('Generated verification challenge', { address, nonce, expiresAt })

    return challenge
  }

  /**
   * Verify wallet signature and authenticate user
   */
  public async verifySignature(
    address: string,
    signature: string,
    username?: string
  ): Promise<VerificationResult> {
    try {
      // Normalize address
      const normalizedAddress = address.toLowerCase()
      
      // Get stored challenge
      const challenge = this.challenges.get(normalizedAddress)
      if (!challenge) {
        return {
          success: false,
          error: 'No active verification challenge found. Please request a new challenge.'
        }
      }

      // Check if challenge has expired
      if (Date.now() > challenge.expiresAt) {
        this.challenges.delete(normalizedAddress)
        return {
          success: false,
          error: 'Verification challenge has expired. Please request a new challenge.'
        }
      }

      // Verify signature
      const isValidSignature = this.verifyStellarSignature(
        challenge.message,
        signature,
        address
      )

      if (!isValidSignature) {
        return {
          success: false,
          error: 'Invalid signature. Please ensure you are signing with the correct wallet.'
        }
      }

      // Find or create user
      let user = await User.findOne({ address: normalizedAddress })
      let isNewUser = false

      if (!user) {
        // Create new user
        if (!username) {
          username = `user_${normalizedAddress.slice(2, 8)}`
        }

        user = new User({
          address: normalizedAddress,
          username,
          tier: 'verified', // New users start as verified
          isVerified: true
        })

        await user.save()
        isNewUser = true

        logger.info('New user created and verified', { address: normalizedAddress, username })
      } else {
        // Update existing user verification status
        if (!user.isVerified) {
          user.isVerified = true
          await user.save()
          logger.info('User verification status updated', { address: normalizedAddress })
        }
      }

      // Clean up challenge after successful verification
      this.challenges.delete(normalizedAddress)

      return {
        success: true,
        user: {
          id: user._id.toString(),
          address: user.address,
          username: user.username,
          tier: user.tier,
          isVerified: user.isVerified
        },
        isNewUser
      }

    } catch (error) {
      logger.error('Verification failed:', error)
      return {
        success: false,
        error: 'Verification process failed. Please try again.'
      }
    }
  }

  /**
   * Verify Stellar signature
   */
  private verifyStellarSignature(message: string, signature: string, address: string): boolean {
    try {
      // Create a keypair from the provided address
      const publicKey = StellarSdk.Keypair.fromPublicKey(address)
      
      // Verify the signature
      const isValid = publicKey.verify(Buffer.from(message), Buffer.from(signature, 'base64'))
      
      return isValid
    } catch (error) {
      logger.error('Stellar signature verification error:', error)
      return false
    }
  }

  /**
   * Generate a random nonce
   */
  private generateNonce(): string {
    const timestamp = Date.now()
    const randomBytes = createHash('sha256')
      .update(`${timestamp}-${Math.random()}-${process.env.JWT_SECRET || 'fallback'}`)
      .digest('hex')
    
    return randomBytes.slice(0, 16)
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [address, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        expiredKeys.push(address)
      }
    }

    expiredKeys.forEach(key => this.challenges.delete(key))
    
    if (expiredKeys.length > 0) {
      logger.debug('Cleaned up expired verification challenges', { count: expiredKeys.length })
    }
  }

  /**
   * Get active challenge for an address
   */
  public getChallenge(address: string): VerificationChallenge | null {
    const challenge = this.challenges.get(address.toLowerCase())
    
    if (!challenge || Date.now() > challenge.expiresAt) {
      return null
    }
    
    return challenge
  }

  /**
   * Remove challenge for an address
   */
  public removeChallenge(address: string): boolean {
    return this.challenges.delete(address.toLowerCase())
  }

  /**
   * Get verification statistics
   */
  public getStats(): {
    activeChallenges: number
    totalChallenges: number
  } {
    return {
      activeChallenges: this.challenges.size,
      totalChallenges: this.challenges.size
    }
  }
}

export const verificationService = VerificationService.getInstance()
