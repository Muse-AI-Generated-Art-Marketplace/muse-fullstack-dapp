import { Request, Response, NextFunction } from 'express'
import { bidService } from '@/services/bidService'
import { AuthRequest } from '@/middleware/authMiddleware'
import { createError } from '@/middleware/errorHandler'
import { createLogger } from '@/utils/logger'

const logger = createLogger('BidController')

export const createBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userAddress = req.user?.address
    if (!userAddress) {
      return next(createError('Authentication required to place bids', 401))
    }

    const bidData = {
      ...(req as any).body,
      bidder: userAddress
    }

    const bid = await bidService.createBid(bidData)

    logger.info('Bid created successfully', { bidId: (bid as any)._id, bidder: userAddress })

    res.status(201).json({
      success: true,
      data: bid
    })
  } catch (error) {
    logger.error('Error creating bid:', error)
    next(error)
  }
}

export const updateBidStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, transactionHash } = req.body

    const bid = await bidService.updateBidStatus(id, { status, transactionHash })

    logger.info('Bid status updated', { bidId: id, status })

    res.json({
      success: true,
      data: bid
    })
  } catch (error) {
    logger.error('Error updating bid status:', error)
    next(error)
  }
}

export const getArtworkBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { artworkId } = req.params
    const { status } = req.query

    const bids = await bidService.getBidsForArtwork(
      artworkId, 
      status as any
    )

    res.json({
      success: true,
      data: bids
    })
  } catch (error) {
    logger.error('Error fetching artwork bids:', error)
    next(error)
  }
}

export const getUserBids = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userAddress = req.user?.address
    if (!userAddress) {
      return next(createError('Authentication required to fetch bids', 401))
    }

    const bids = await bidService.getBidsForBidder(userAddress)

    logger.info('Fetched user bids', { userAddress, count: bids.length })

    res.json({
      success: true,
      data: bids
    })
  } catch (error) {
    logger.error('Error fetching user bids:', error)
    next(error)
  }
}

export const expireBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bidService.expireBids()

    logger.info('Bid expiration process completed')

    res.json({
      success: true,
      message: 'Bid expiration process completed'
    })
  } catch (error) {
    logger.error('Error expiring bids:', error)
    next(error)
  }
}

export const checkAuctionEndings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await bidService.checkAuctionEndings()

    logger.info('Auction ending check completed')

    res.json({
      success: true,
      message: 'Auction ending check completed'
    })
  } catch (error) {
    logger.error('Error checking auction endings:', error)
    next(error)
  }
}
