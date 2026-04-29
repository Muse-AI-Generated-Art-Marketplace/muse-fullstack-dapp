import { Router } from 'express'
import { authenticate } from '@/middleware/authMiddleware'
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
router.get('/artwork/:artworkId', getArtworkBids)

// Protected routes
router.use(authenticate)

router.post('/', createBid)
router.get('/my-bids', getUserBids)

// Admin routes (for maintenance tasks)
router.post('/expire', expireBids)
router.post('/check-auctions', checkAuctionEndings)
router.put('/:id/status', updateBidStatus)

export default router
