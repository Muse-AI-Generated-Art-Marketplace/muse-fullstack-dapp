import { Router } from 'express'
import { searchArtworks, searchUsers } from '@/controllers/searchController'
import { validate } from '@/middleware/validate'
import { searchArtworksSchema } from '@/schemas'
import { optionalAuthenticate } from '@/middleware/authMiddleware'

const router = Router()

router.get('/artworks', validate(searchArtworksSchema), optionalAuthenticate, searchArtworks)
router.get('/users', validate(searchArtworksSchema), optionalAuthenticate, searchUsers)

export default router
