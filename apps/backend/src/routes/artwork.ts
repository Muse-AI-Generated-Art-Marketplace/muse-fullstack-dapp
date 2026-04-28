import { Router } from 'express'
import {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '@/controllers/artworkController'
import { authenticate, optionalAuthenticate } from '@/middleware/authMiddleware'

const router = Router()

/**
 * @openapi
 * /api/artworks:
 *   get:
 *     summary: List all artworks
 *     description: Retrieve a paginated list of artworks with optional filters
 *     tags: [Artworks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: style
 *         schema:
 *           type: string
 *           enum: [digital-art, abstract, realistic, impressionist, surrealist]
 *         description: Filter by art style
 *       - in: query
 *         name: creator
 *         schema:
 *           type: string
 *         description: Filter by creator wallet address
 *     responses:
 *       200:
 *         description: List of artworks returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artworks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Artwork'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', optionalAuthenticate, getArtworks)

/**
 * @openapi
 * /api/artworks/{id}:
 *   get:
 *     summary: Get artwork by ID
 *     description: Retrieve detailed information about a specific artwork
 *     tags: [Artworks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artwork ID
 *     responses:
 *       200:
 *         description: Artwork details returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Artwork'
 *       404:
 *         description: Artwork not found
 */
router.get('/:id', optionalAuthenticate, getArtwork)

/**
 * @openapi
 * /api/artworks:
 *   post:
 *     summary: Create new artwork
 *     description: Upload and create a new artwork listing
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Cosmic Dreams
 *               description:
 *                 type: string
 *                 example: A surrealist exploration of cosmic consciousness
 *               price:
 *                 type: number
 *                 example: 100.50
 *               style:
 *                 type: string
 *                 enum: [digital-art, abstract, realistic, impressionist, surrealist]
 *                 example: digital-art
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Artwork image file
 *     responses:
 *       201:
 *         description: Artwork created successfully
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid artwork data
 */
router.post('/', authenticate, createArtwork)

/**
 * @openapi
 * /api/artworks/{id}:
 *   put:
 *     summary: Update artwork
 *     description: Update an existing artwork's details
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artwork ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [draft, active, sold, archived]
 *     responses:
 *       200:
 *         description: Artwork updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to update this artwork
 *       404:
 *         description: Artwork not found
 */
router.put('/:id', authenticate, updateArtwork)

/**
 * @openapi
 * /api/artworks/{id}:
 *   delete:
 *     summary: Delete artwork
 *     description: Remove an artwork listing
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artwork ID
 *     responses:
 *       204:
 *         description: Artwork deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this artwork
 *       404:
 *         description: Artwork not found
 */
router.delete('/:id', authenticate, deleteArtwork)

export default router
