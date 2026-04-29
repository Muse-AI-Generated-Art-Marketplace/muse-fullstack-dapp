import { Router } from 'express'
import { authenticate } from '@/middleware/authMiddleware'
import { validate } from '@/middleware/validate'
import {
  createBidSchema,
  updateBidStatusSchema,
  getArtworkBidsSchema,
  getUserBidsSchema,
  expireBidsSchema,
  checkAuctionEndingsSchema
} from '@/schemas'
import {
  createBid,
  updateBidStatus,
  getArtworkBids,
  getUserBids,
  expireBids,
  checkAuctionEndings
} from '@/controllers/bidController'

const router = Router()

// Public routes
router.get('/artwork/:artworkId', validate(getArtworkBidsSchema), getArtworkBids)

// Protected routes
router.use(authenticate)

router.post('/', validate(createBidSchema), createBid)
router.get('/my-bids', validate(getUserBidsSchema), getUserBids)

// Admin routes (for maintenance tasks)
router.post('/expire', validate(expireBidsSchema), expireBids)
router.post('/check-auctions', validate(checkAuctionEndingsSchema), checkAuctionEndings)
router.put('/:id/status', validate(updateBidStatusSchema), updateBidStatus)

export default router
