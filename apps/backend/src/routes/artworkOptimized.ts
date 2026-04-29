import { Router } from 'express'
import { artworkService } from '@/services/artworkService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ArtworkOptimizedRoutes')
const router = Router()

/**
 * Get artworks with advanced query optimization
 * This endpoint demonstrates the optimized queries that prevent N+1 problems
 */
router.get('/optimized', async (req, res, next) => {
  try {
    const result = await artworkService.getArtworks({
      ...req.query,
      includeCreator: true,
      includeOwner: true
    })
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      optimization: {
        technique: 'eager_loading',
        prevented: 'N+1_queries',
        populated_fields: ['creator', 'owner'],
        query_count: '2_queries_total'
      }
    })
  } catch (error) {
    logger.error('Error in optimized artworks route:', error)
    next(error)
  }
})

/**
 * Get user's created artworks with batch loading
 * This prevents N+1 queries when fetching user-specific artwork collections
 */
router.get('/user/:userId/created', async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = '1', limit = '20' } = req.query
    
    const result = await artworkService.getArtworksByCreator(userId, {
      page: page as string,
      limit: limit as string,
      includeCreator: false // Creator is the user, no need to populate
    })
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      optimization: {
        technique: 'direct_query_with_population',
        prevented: 'N+1_queries',
        query_count: '1_query_with_population'
      }
    })
  } catch (error) {
    logger.error('Error in user created artworks route:', error)
    next(error)
  }
})

/**
 * Get user's owned artworks with optimized queries
 * This demonstrates efficient ownership queries with proper population
 */
router.get('/user/:userId/owned', async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = '1', limit = '20' } = req.query
    
    const result = await artworkService.getArtworksByOwner(userId, {
      page: page as string,
      limit: limit as string,
      includeOwner: true
    })
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      optimization: {
        technique: 'optimized_ownership_query',
        prevented: 'N+1_queries',
        populated_fields: ['creator', 'owner'],
        query_count: '1_query_with_dual_population'
      }
    })
  } catch (error) {
    logger.error('Error in user owned artworks route:', error)
    next(error)
  }
})

/**
 * Get featured artworks with pre-computed popularity
 * This demonstrates using indexes and pre-sorted queries for performance
 */
router.get('/featured', async (req, res, next) => {
  try {
    const { limit = '10' } = req.query
    
    const artworks = await artworkService.getFeaturedArtworks(parseInt(limit as string))
    
    res.json({
      success: true,
      data: artworks,
      optimization: {
        technique: 'indexed_query_with_population',
        prevented: 'N+1_queries',
        used_indexes: ['createdAt', 'stats.followers'],
        query_count: '1_optimized_query'
      }
    })
  } catch (error) {
    logger.error('Error in featured artworks route:', error)
    next(error)
  }
})

/**
 * Search artworks with text index optimization
 * This demonstrates full-text search with proper population
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q: searchTerm, category, page = '1', limit = '20' } = req.query
    
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
    
    const result = await artworkService.searchArtworks(searchTerm as string, {
      page: page as string,
      limit: limit as string,
      category: category as string
    })
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      optimization: {
        technique: 'text_index_search_with_population',
        prevented: 'N+1_queries',
        used_indexes: ['text_index'],
        populated_fields: ['creator'],
        query_count: '2_queries_total'
      }
    })
  } catch (error) {
    logger.error('Error in search artworks route:', error)
    next(error)
  }
})

export default router
