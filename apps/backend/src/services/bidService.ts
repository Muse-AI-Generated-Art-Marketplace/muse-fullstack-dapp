import { Bid, IBid } from '@/models/Bid'
import { Auction } from '@/models/Auction'
import { Artwork } from '@/models/Artwork'
import { createError, createNotFoundError } from '@/middleware/errorHandler'
import { emailService } from '@/services/emailService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('BidService')

export interface CreateBidInput {
  artwork: string
  bidder: string
  amount: string
  currency: string
  network: 'testnet' | 'mainnet'
  expiresAt?: Date
  isAutoBid?: boolean
  maxAutoBidAmount?: string
}

export interface UpdateBidStatusInput {
  status: IBid['status']
  transactionHash?: string
}

class BidService {
  async createBid(input: CreateBidInput): Promise<IBid> {
    try {
      // Validate artwork exists and is for sale/auction
      const artwork = await Artwork.findById(input.artwork)
      if (!artwork) {
        throw createNotFoundError('Artwork')
      }

      // Check if there's an active auction for this artwork
      const auction = await Auction.findOne({ 
        artwork: input.artwork, 
        status: { $in: ['active', 'upcoming'] }
      })

      if (auction) {
        return this.createAuctionBid(input, auction, artwork)
      }

      // For direct sales, create a regular bid
      const bid = new Bid({
        ...input,
        status: 'pending'
      })

      await bid.save()
      await this.sendBidNotifications(bid, artwork)

      return bid
    } catch (error) {
      logger.error('Error creating bid:', error)
      throw error
    }
  }

  private async createAuctionBid(input: CreateBidInput, auction: any, artwork: any): Promise<IBid> {
    // Validate auction rules
    if (auction.status !== 'active') {
      throw createError('Auction is not active for bidding', 400)
    }

    if (new Date() >= auction.endTime) {
      throw createError('Auction has ended', 400)
    }

    // Check if bid amount meets minimum requirements
    const bidAmount = parseFloat(input.amount)
    const currentBid = auction.currentBid ? parseFloat(auction.currentBid) : parseFloat(auction.startingPrice)
    const minIncrement = parseFloat(auction.bidIncrement)

    if (bidAmount < currentBid + minIncrement) {
      throw createError(`Bid must be at least ${currentBid + minIncrement} ${input.currency}`, 400)
    }

    // Create the bid
    const bid = new Bid({
      ...input,
      status: 'active',
      expiresAt: auction.endTime
    })

    await bid.save()

    // Update auction with new current bid
    const previousBidder = auction.currentBidder
    auction.currentBid = input.amount
    auction.currentBidder = input.bidder
    auction.bids.push(bid._id)
    await auction.save()

    // Send notifications
    await this.sendAuctionBidNotifications(bid, artwork, auction, previousBidder)

    return bid
  }

  async updateBidStatus(bidId: string, input: UpdateBidStatusInput): Promise<IBid> {
    try {
      const bid = await Bid.findById(bidId).populate('artwork')
      if (!bid) {
        throw createNotFoundError('Bid')
      }

      const previousStatus = bid.status
      bid.status = input.status
      if (input.transactionHash) {
        bid.transactionHash = input.transactionHash
      }

      await bid.save()

      // Send notifications based on status change
      if (input.status === 'accepted' && previousStatus === 'active') {
        await this.sendBidAcceptedNotifications(bid)
      } else if (input.status === 'rejected' && previousStatus === 'active') {
        await this.sendBidRejectedNotifications(bid)
      }

      return bid
    } catch (error) {
      logger.error('Error updating bid status:', error)
      throw error
    }
  }

  async getBidsForArtwork(artworkId: string, status?: IBid['status']): Promise<IBid[]> {
    const filter: any = { artwork: artworkId }
    if (status) {
      filter.status = status
    }

    return await Bid.find(filter)
      .populate('artwork')
      .sort({ createdAt: -1 })
  }

  async getBidsForBidder(bidderAddress: string): Promise<IBid[]> {
    return await Bid.find({ bidder: bidderAddress })
      .populate('artwork')
      .sort({ createdAt: -1 })
  }

  async expireBids(): Promise<void> {
    try {
      const expiredBids = await Bid.find({
        status: 'active',
        expiresAt: { $lt: new Date() }
      })

      for (const bid of expiredBids) {
        bid.status = 'expired'
        await bid.save()
      }

      logger.info(`Expired ${expiredBids.length} bids`)
    } catch (error) {
      logger.error('Error expiring bids:', error)
    }
  }

  async getUserBids(userAddress: string): Promise<IBid[]> {
    try {
      const bids = await Bid.find({ bidder: userAddress })
        .populate('artwork')
        .sort({ createdAt: -1 })

      logger.info('Fetched user bids', { userAddress, count: bids.length })

      return bids
    } catch (error) {
      logger.error('Error fetching user bids:', error)
      throw error
    }
  }

  private async sendBidNotifications(bid: IBid, artwork: any): Promise<void> {
    try {
      // Send notification to artwork owner (seller)
      await emailService.sendEmailNotification(
        artwork.creator,
        'bid',
        {
          artworkId: artwork._id?.toString(),
          artworkTitle: artwork.title || 'Untitled Artwork',
          bidAmount: bid.amount,
          currency: bid.currency,
          bidderAddress: bid.bidder
        }
      )
    } catch (error) {
      logger.error('Error sending bid notifications:', error)
    }
  }

  private async sendAuctionBidNotifications(bid: IBid, artwork: any, auction: any, previousBidder?: string): Promise<void> {
    try {
      // Send notification to artwork owner (seller)
      await emailService.sendEmailNotification(
        auction.seller,
        'bid',
        {
          artworkId: artwork._id?.toString(),
          artworkTitle: artwork.title || 'Untitled Artwork',
          bidAmount: bid.amount,
          currency: bid.currency,
          bidderAddress: bid.bidder
        }
      )

      // Send outbid notification to previous bidder if exists
      if (previousBidder && previousBidder !== bid.bidder) {
        await emailService.sendEmailNotification(
          previousBidder,
          'bid_outbid',
          {
            artworkId: artwork._id?.toString(),
            artworkTitle: artwork.title || 'Untitled Artwork',
            newBidAmount: bid.amount,
            currency: bid.currency,
            yourBidAmount: auction.currentBid ? bid.amount : auction.startingPrice
          }
        )
      }
    } catch (error) {
      logger.error('Error sending auction bid notifications:', error)
    }
  }

  private async sendBidAcceptedNotifications(bid: IBid): Promise<void> {
    try {
      const artwork = bid.artwork as any
      await emailService.sendEmailNotification(
        bid.bidder,
        'bid_accepted',
        {
          artworkId: artwork?._id?.toString(),
          artworkTitle: artwork?.title || 'Untitled Artwork',
          bidAmount: bid.amount,
          currency: bid.currency
        }
      )
    } catch (error) {
      logger.error('Error sending bid accepted notifications:', error)
    }
  }

  private async sendBidRejectedNotifications(bid: IBid): Promise<void> {
    try {
      const artwork = bid.artwork as any
      // Could add a bid rejected email template if needed
      logger.info('Bid created successfully', { bidId: (bid as any)._id, bidder: bid.bidder, artwork: artwork?.title })
    } catch (error) {
      logger.error('Error sending bid rejected notifications:', error)
    }
  }

  async checkAuctionEndings(): Promise<void> {
    try {
      const endingSoon = await Auction.find({
        status: 'active',
        endTime: { 
          $lte: new Date(Date.now() + 60 * 60 * 1000), // Within 1 hour
          $gt: new Date()
        }
      }).populate('artwork currentBidder')

      for (const auction of endingSoon) {
        const artwork = auction.artwork as any
        const timeRemaining = this.formatTimeRemaining(auction.endTime)

        // Notify current bidder
        if (auction.currentBidder) {
          await emailService.sendEmailNotification(
            auction.currentBidder as string,
            'auction_ending',
            {
              artworkId: artwork?._id?.toString(),
              artworkTitle: artwork?.title || 'Untitled Artwork',
              currentBid: auction.currentBid,
              currency: 'XLM', // Default currency
              timeRemaining
            }
          )
        }

        // Notify seller
        await emailService.sendEmailNotification(
          auction.seller,
          'auction_ending',
          {
            artworkId: artwork?._id?.toString(),
            artworkTitle: artwork?.title || 'Untitled Artwork',
            currentBid: auction.currentBid,
            currency: 'XLM', // Default currency
            timeRemaining
          }
        )
      }

      logger.info(`Checked ${endingSoon.length} auctions ending soon`)
    } catch (error) {
      logger.error('Error checking auction endings:', error)
    }
  }

  private formatTimeRemaining(endTime: Date): string {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
}

export const bidService = new BidService()
