import express from 'express'
import { favoriteController } from '../controllers/favoriteController'

const router = express.Router()

/**
 * @openapi
 * /api/favorites/{userAddress}:
 *   get:
 *     summary: Get user's favorites
 *     description: Retrieve all artworks favorited by a user
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: User's Stellar wallet address
 *     responses:
 *       200:
 *         description: User's favorites returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Artwork'
 *                 total:
 *                   type: integer
 *       404:
 *         description: User not found
 */
router.get('/:userAddress', favoriteController.getUserFavorites)

/**
 * @openapi
 * /api/favorites:
 *   post:
 *     summary: Add artwork to favorites
 *     description: Add an artwork to the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               artworkId:
 *                 type: string
 *                 description: ID of the artwork to add to favorites
 *     responses:
 *       201:
 *         description: Added to favorites successfully
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Artwork not found
 */
router.post('/', favoriteController.addFavorite)

/**
 * @openapi
 * /api/favorites/{artworkId}:
 *   delete:
 *     summary: Remove from favorites
 *     description: Remove an artwork from the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Artwork ID to remove from favorites
 *     responses:
 *       204:
 *         description: Removed from favorites successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Favorite not found
 */
router.delete('/:artworkId', favoriteController.removeFavorite)

/**
 * @openapi
 * /api/favorites/check/{artworkId}:
 *   get:
 *     summary: Check if favorited
 *     description: Check if an artwork is in the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *                 addedAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/check/:artworkId', favoriteController.checkFavorite)

/**
 * @openapi
 * /api/favorites/count/{userAddress}:
 *   get:
 *     summary: Get favorites count
 *     description: Get the total number of favorites for a user
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: User's Stellar wallet address
 *     responses:
 *       200:
 *         description: Favorites count returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get('/count/:userAddress', favoriteController.getFavoritesCount)

export default router
