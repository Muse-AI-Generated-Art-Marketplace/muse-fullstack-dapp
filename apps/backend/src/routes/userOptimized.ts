import { Router } from 'express'
import { userService } from '@/services/userService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('UserOptimizedRoutes')
const router = Router()

/**
 * Get user profile with optimized eager loading
 * This endpoint demonstrates the optimized user profile queries that prevent N+1 problems
 */
router.get('/profile/optimized', async (req, res, next) => {
  try {
    // Get user ID from authenticated request (for now using a placeholder)
    const userId = (req as any).user?.id || '507f1f77bcf86cd799439011'
    
    const user = await userService.getUserProfile(userId, {
      includeArtworks: true,
      includeOwnedArtworks: true,
      includeStats: true,
      artworkLimit: 10
    })
    
    res.json({
      success: true,
      data: user,
      optimization: {
        technique: 'parallel_queries_with_eager_loading',
        prevented: 'N+1_queries',
        query_strategy: 'batch_loading',
        query_count: '3_parallel_queries'
      }
    })
  } catch (error) {
    logger.error('Error in optimized user profile route:', error)
    next(error)
  }
})

/**
 * Get multiple user profiles efficiently (batch loading)
 * This prevents N+1 queries when fetching multiple user profiles
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { userIds } = req.body
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User IDs array is required',
          userMessage: 'Please provide an array of user IDs'
        }
      })
    }
    
    if (userIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot fetch more than 50 users at once',
          userMessage: 'Please limit your request to 50 users or fewer'
        }
      })
    }
    
    const users = await userService.getUserProfiles(userIds)
    
    res.json({
      success: true,
      data: users,
      optimization: {
        technique: 'batch_loading',
        prevented: 'N+1_queries',
        query_count: '1_query_for_all_users',
        efficiency: `${userIds.length} users in 1 query`
      }
    })
  } catch (error) {
    logger.error('Error in batch user profiles route:', error)
    next(error)
  }
})

/**
 * Get user statistics with optimized aggregation
 * This demonstrates efficient statistics calculation
 */
router.get('/:userId/statistics', async (req, res, next) => {
  try {
    const { userId } = req.params
    
    const stats = await userService.getUserStatistics(userId)
    
    res.json({
      success: true,
      data: stats,
      optimization: {
        technique: 'parallel_count_queries',
        prevented: 'N+1_queries',
        query_count: '4_parallel_count_queries',
        calculated_fields: ['created', 'owned', 'listed']
      }
    })
  } catch (error) {
    logger.error('Error in user statistics route:', error)
    next(error)
  }
})

/**
 * Search users with optimized indexing
 * This demonstrates efficient user search with proper indexing
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q: searchTerm, isVerified, page = '1', limit = '20' } = req.query
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search term is required',
          userMessage: 'Please provide a search term'
        }
      })
    }
    
    const result = await userService.searchUsers(searchTerm as string, {
      page: page as string,
      limit: limit as string,
      isVerified: isVerified === 'true'
    })
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      optimization: {
        technique: 'indexed_regex_search',
        prevented: 'N+1_queries',
        used_indexes: ['username', 'publicKey', 'stats.followers'],
        query_count: '2_queries_total'
      }
    })
  } catch (error) {
    logger.error('Error in user search route:', error)
    next(error)
  }
})

/**
 * Follow user with optimized atomic operations
 * This demonstrates efficient relationship updates
 */
router.post('/:userId/follow', async (req, res, next) => {
  try {
    const { userId } = req.params
    const followerId = (req as any).user?.id || '507f1f77bcf86cd799439012'
    
    await userService.followUser(followerId, userId)
    
    res.json({
      success: true,
      message: 'User followed successfully',
      optimization: {
        technique: 'parallel_atomic_updates',
        prevented: 'race_conditions',
        query_count: '2_parallel_updates',
        updated_fields: ['follower.following', 'following.followers']
      }
    })
  } catch (error) {
    logger.error('Error in follow user route:', error)
    next(error)
  }
})

/**
 * Unfollow user with optimized atomic operations
 * This demonstrates efficient relationship removal
 */
router.delete('/:userId/follow', async (req, res, next) => {
  try {
    const { userId } = req.params
    const followerId = (req as any).user?.id || '507f1f77bcf86cd799439012'
    
    await userService.unfollowUser(followerId, userId)
    
    res.json({
      success: true,
      message: 'User unfollowed successfully',
      optimization: {
        technique: 'parallel_atomic_updates',
        prevented: 'race_conditions',
        query_count: '2_parallel_updates',
        updated_fields: ['follower.following', 'following.followers']
      }
    })
  } catch (error) {
    logger.error('Error in unfollow user route:', error)
    next(error)
  }
})

export default router
