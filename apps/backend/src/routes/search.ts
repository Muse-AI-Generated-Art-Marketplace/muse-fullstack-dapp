import { Router } from 'express'
import { searchArtworks, searchUsers } from '@/controllers/searchController'
import { validateSearchQuery } from '@/middleware/validateSearch'
import { optionalAuthenticate } from '@/middleware/authMiddleware'

const router = Router()

router.get('/artworks', validateSearchQuery('artworks'), optionalAuthenticate, searchArtworks)
router.get('/users', validateSearchQuery('users'), optionalAuthenticate, searchUsers)

export default router
