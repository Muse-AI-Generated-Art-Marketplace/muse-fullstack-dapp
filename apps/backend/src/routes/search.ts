import { Router } from 'express'
import { searchArtworks, searchUsers } from '@/controllers/searchController'
import { validateSearchQuery } from '@/middleware/validateSearch'
import { optionalAuthenticate } from '@/middleware/authMiddleware'

const router = Router()

/**
 * @openapi
 * /api/search/artworks:
 *   get:
 *     summary: Search artworks
 *     description: Search and filter artworks by various criteria
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query text
 *       - in: query
 *         name: style
 *         schema:
 *           type: string
 *           enum: [digital-art, abstract, realistic, impressionist, surrealist]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price-asc, price-desc, newest, popular]
 *           default: relevance
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Artwork'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 */
router.get('/artworks', validateSearchQuery('artworks'), optionalAuthenticate, searchArtworks)

/**
 * @openapi
 * /api/search/users:
 *   get:
 *     summary: Search users
 *     description: Search for artists and collectors
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query text
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 */
router.get('/users', validateSearchQuery('users'), optionalAuthenticate, searchUsers)

export default router
