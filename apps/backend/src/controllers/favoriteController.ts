import { Request, Response } from 'express'
import { Favorite } from '../models/Favorite'
import { Artwork } from '../models/Artwork'
import { User } from '../models/User'

export const favoriteController = {
  /**
   * Get all favorites for a user
   * GET /api/favorites/:userAddress
   */
  async getUserFavorites(req: Request, res: Response) {
    try {
      const { userAddress } = req.params
      const { page = 1, limit = 12 } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const skip = (pageNum - 1) * limitNum

      const favorites = await Favorite.find({ user: userAddress })
        .populate('artwork')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)

      const total = await Favorite.countDocuments({ user: userAddress })

      const artworks = favorites.map((fav) => fav.artwork).filter(Boolean)

      res.json({
        success: true,
        data: artworks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum * limitNum < total,
          hasPrevPage: pageNum > 1,
        },
      })
    } catch (error) {
      console.error('Error fetching favorites:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Add artwork to favorites
   * POST /api/favorites
   */
  async addFavorite(req: Request, res: Response) {
    try {
      const { artworkId, userAddress } = req.body

      if (!artworkId || !userAddress) {
        return res.status(400).json({
          success: false,
          message: 'Artwork ID and user address are required',
        })
      }

      // Check if artwork exists
      const artwork = await Artwork.findById(artworkId)
      if (!artwork) {
        return res.status(404).json({
          success: false,
          message: 'Artwork not found',
        })
      }

      // Check if already favorited
      const existingFavorite = await Favorite.findOne({
        artwork: artworkId,
        user: userAddress,
      })

      if (existingFavorite) {
        return res.status(400).json({
          success: false,
          message: 'Artwork already in favorites',
        })
      }

      const favorite = await Favorite.create({
        artwork: artworkId,
        user: userAddress,
      })

      // Update user's favorites count
      await User.findOneAndUpdate(
        { address: userAddress },
        { $inc: { 'stats.favorites': 1 } },
        { upsert: true, new: true }
      )

      await favorite.populate('artwork')

      res.status(201).json({
        success: true,
        data: favorite.artwork,
        message: 'Added to favorites',
      })
    } catch (error) {
      console.error('Error adding favorite:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add to favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Remove artwork from favorites
   * DELETE /api/favorites/:artworkId
   */
  async removeFavorite(req: Request, res: Response) {
    try {
      const { artworkId } = req.params
      const { userAddress } = req.query

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          message: 'User address is required',
        })
      }

      const favorite = await Favorite.findOneAndDelete({
        artwork: artworkId,
        user: userAddress,
      })

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorite not found',
        })
      }

      // Update user's favorites count
      await User.findOneAndUpdate(
        { address: userAddress },
        { $inc: { 'stats.favorites': -1 } },
        { upsert: true, new: true }
      )

      res.json({
        success: true,
        message: 'Removed from favorites',
      })
    } catch (error) {
      console.error('Error removing favorite:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to remove from favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Check if artwork is in favorites
   * GET /api/favorites/check/:artworkId
   */
  async checkFavorite(req: Request, res: Response) {
    try {
      const { artworkId } = req.params
      const { userAddress } = req.query

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          message: 'User address is required',
        })
      }

      const favorite = await Favorite.findOne({
        artwork: artworkId,
        user: userAddress,
      })

      res.json({
        success: true,
        data: {
          isFavorite: !!favorite,
        },
      })
    } catch (error) {
      console.error('Error checking favorite:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to check favorite status',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Get favorites count for a user
   * GET /api/favorites/count/:userAddress
   */
  async getFavoritesCount(req: Request, res: Response) {
    try {
      const { userAddress } = req.params

      const count = await Favorite.countDocuments({ user: userAddress })

      res.json({
        success: true,
        data: {
          count,
        },
      })
    } catch (error) {
      console.error('Error fetching favorites count:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch favorites count',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
}
