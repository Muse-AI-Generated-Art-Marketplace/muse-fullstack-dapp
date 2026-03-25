import { Router } from 'express'
import {
  createArtwork,
  getArtworkById,
  getArtworks,
  getFeaturedArtworks,
  getStats,
  getTrendingArtworks,
} from '@/controllers/artworkController'
import { artworkDetailCache, artworkListCache } from '@/middleware/cacheMiddleware'

const router = Router()

router.get('/', artworkListCache, getArtworks)
router.get('/featured', artworkListCache, getFeaturedArtworks)
router.get('/trending', artworkListCache, getTrendingArtworks)
router.get('/stats', artworkListCache, getStats)
router.get('/:id', artworkDetailCache, getArtworkById)
router.post('/', createArtwork)


export default router
