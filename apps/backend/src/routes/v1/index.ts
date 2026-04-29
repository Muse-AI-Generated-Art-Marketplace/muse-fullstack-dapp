import { Router } from 'express'
import { addVersionHeader } from '@/middleware/deprecation'

import authRoutes from '@/routes/auth'
import artworkRoutes from '@/routes/artwork'
import userRoutes from '@/routes/user'
import searchRoutes from '@/routes/search'
import aiRoutes from '@/routes/ai'
import metadataRoutes from '@/routes/metadata'
import imageOptimizerRoutes from '@/routes/imageOptimizer'
import favoriteRoutes from '@/routes/favorites'
import apiKeyRoutes from '@/routes/apiKeys'
import jobRoutes from '@/routes/jobs'
import notificationRoutes from '@/routes/notifications'
import transactionRoutes from '@/routes/transactions'
import analyticsRoutes from '@/routes/analytics'
import fileUploadRoutes from '@/routes/fileUpload'

const router = Router()

router.use(addVersionHeader)

router.use('/auth', authRoutes)
router.use('/artworks', artworkRoutes)
router.use('/users', userRoutes)
router.use('/search', searchRoutes)
router.use('/ai', aiRoutes)
router.use('/metadata', metadataRoutes)
router.use('/images', imageOptimizerRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/keys', apiKeyRoutes)
router.use('/jobs', jobRoutes)
router.use('/notifications', notificationRoutes)
router.use('/transactions', transactionRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/upload', fileUploadRoutes)

router.get('/versions', (_req, res) => {
  res.json({
    versions: [
      {
        version: 'v1',
        status: 'current',
        sunset: null,
        endpoints: {
          auth: '/api/v1/auth',
          artworks: '/api/v1/artworks',
          users: '/api/v1/users',
          search: '/api/v1/search',
          ai: '/api/v1/ai',
          metadata: '/api/v1/metadata',
          images: '/api/v1/images',
          favorites: '/api/v1/favorites',
          keys: '/api/v1/keys',
          jobs: '/api/v1/jobs',
          notifications: '/api/v1/notifications',
          transactions: '/api/v1/transactions',
          analytics: '/api/v1/analytics',
          upload: '/api/v1/upload'
        }
      }
    ],
    timestamp: new Date().toISOString()
  })
})

export default router
