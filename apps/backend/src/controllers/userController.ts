import { Request, Response, NextFunction } from 'express'
import { createError, createNotFoundError } from '@/middleware/errorHandler'
import { invalidateUserCache } from '@/middleware/cacheMiddleware'
import { createLogger } from '@/utils/logger'
import { userService } from '@/services/userService'

const logger = createLogger('UserController')

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from authenticated request (for now using a placeholder)
    // In a real implementation, this would come from authentication middleware
    const userId = (req as any).user?.id || '507f1f77bcf86cd799439011'
    
    // Use optimized user service with eager loading to prevent N+1 queries
    const user = await userService.getUserProfile(userId, {
      includeArtworks: true,
      includeOwnedArtworks: true,
      includeStats: true,
      artworkLimit: 10
    })

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error('Error in getUserProfile:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      const err = createNotFoundError('User profile not found')
      return next(err)
    }
    
    const err = createError('Failed to fetch user profile', 500, 'USER_PROFILE_ERROR')
    next(err)
  }
}

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, bio, website, twitter, discord, avatar, banner } = req.body
    
    // Get user ID from authenticated request (for now using a placeholder)
    // In a real implementation, this would come from authentication middleware
    const userId = (req as any).user?.id || '507f1f77bcf86cd799439011'
    
    // Use optimized user service with proper database operations
    const updatedUser = await userService.updateUserProfile(userId, {
      username,
      bio,
      website,
      twitter,
      discord,
      avatar,
      banner
    })

    res.json({
      success: true,
      data: updatedUser,
    })

    // Invalidate user cache after profile update
    invalidateUserCache(userId).catch(error => 
      logger.error('Failed to invalidate cache after profile update:', error)
    )
  } catch (error) {
    logger.error('Error in updateUserProfile:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      const err = createNotFoundError('User profile not found')
      return next(err)
    }
    
    const err = createError('Failed to update user profile', 500, 'USER_UPDATE_ERROR')
    next(err)
  }
}
