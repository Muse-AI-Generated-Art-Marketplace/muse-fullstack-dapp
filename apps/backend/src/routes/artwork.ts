import { Router } from 'express'
import { getArtworks, getArtworkById, createArtwork, getFeaturedArtworks, getTrendingArtworks, getStats } from '@/controllers/artworkController'

const router = Router()

router.get('/featured', getFeaturedArtworks)
router.get('/trending', getTrendingArtworks)
router.get('/stats', getStats)
router.get('/', getArtworks)
router.get('/:id', getArtworkById)
router.post('/', createArtwork)

export default router
