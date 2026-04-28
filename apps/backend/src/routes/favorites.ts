import express from 'express'
import { favoriteController } from '../controllers/favoriteController'

const router = express.Router()

/**
 * @route   GET /api/favorites/:userAddress
 * @desc    Get all favorites for a user
 * @access  Public
 */
router.get('/:userAddress', favoriteController.getUserFavorites)

/**
 * @route   POST /api/favorites
 * @desc    Add artwork to favorites
 * @access  Public
 */
router.post('/', favoriteController.addFavorite)

/**
 * @route   DELETE /api/favorites/:artworkId
 * @desc    Remove artwork from favorites
 * @access  Public
 */
router.delete('/:artworkId', favoriteController.removeFavorite)

/**
 * @route   GET /api/favorites/check/:artworkId
 * @desc    Check if artwork is in favorites
 * @access  Public
 */
router.get('/check/:artworkId', favoriteController.checkFavorite)

/**
 * @route   GET /api/favorites/count/:userAddress
 * @desc    Get favorites count for a user
 * @access  Public
 */
router.get('/count/:userAddress', favoriteController.getFavoritesCount)

export default router
