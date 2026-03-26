import mongoose, { Schema, Document } from 'mongoose'

export interface IAuction extends Document {
  artwork: mongoose.Types.ObjectId
  seller: string
  startingPrice: string
  reservePrice?: string
  currentBid?: string
  currentBidder?: string
  endTime: Date
  startTime: Date
  status: 'upcoming' | 'active' | 'ended' | 'cancelled' | 'sold'
  bidIncrement: string
  minBidIncrement?: string
  autoExtendDuration?: number // in minutes
  extendedCount: number
  isBuyNowAvailable: boolean
  buyNowPrice?: string
  bids: mongoose.Types.ObjectId[]
  winner?: string
  finalPrice?: string
  transactionHash?: string
  network: 'testnet' | 'mainnet'
  metadata?: {
    description?: string
    terms?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const AuctionSchema = new Schema<IAuction>({
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
    unique: true,
    index: true
  },
  seller: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  startingPrice: {
    type: String,
    required: true,
    trim: true
  },
  reservePrice: {
    type: String,
    trim: true
  },
  currentBid: {
    type: String,
    trim: true,
    index: true
  },
  currentBidder: {
    type: String,
    trim: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'active', 'ended', 'cancelled', 'sold'],
    default: 'upcoming',
    index: true
  },
  bidIncrement: {
    type: String,
    required: true,
    trim: true
  },
  minBidIncrement: {
    type: String,
    trim: true
  },
  autoExtendDuration: {
    type: Number,
    default: 15, // 15 minutes default
    min: 1,
    max: 60
  },
  extendedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isBuyNowAvailable: {
    type: Boolean,
    default: false
  },
  buyNowPrice: {
    type: String,
    trim: true
  },
  bids: [{
    type: Schema.Types.ObjectId,
    ref: 'Bid'
  }],
  winner: {
    type: String,
    trim: true,
    index: true
  },
  finalPrice: {
    type: String,
    trim: true
  },
  transactionHash: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  network: {
    type: String,
    required: true,
    enum: ['testnet', 'mainnet'],
    default: 'testnet',
    index: true
  },
  metadata: {
    description: String,
    terms: String
  }
}, {
  timestamps: true
})

// Indexes for performance optimization
AuctionSchema.index({ status: 1, endTime: 1 })
AuctionSchema.index({ seller: 1, status: 1, createdAt: -1 })
AuctionSchema.index({ currentBidder: 1, status: 1 })
AuctionSchema.index({ network: 1, status: 1 })
AuctionSchema.index({ startTime: 1, endTime: 1 })
AuctionSchema.index({ createdAt: -1 })
AuctionSchema.index({ currentBid: -1 })

// Virtual for time remaining
AuctionSchema.virtual('timeRemaining').get(function(this: IAuction) {
  const now = new Date()
  if (this.status !== 'active' || now >= this.endTime) {
    return 0
  }
  return this.endTime.getTime() - now.getTime()
})

// Virtual for total bid count
AuctionSchema.virtual('bidCount').get(function(this: IAuction) {
  return this.bids.length
})

// Ensure virtuals are included in JSON
AuctionSchema.set('toJSON', { virtuals: true })
AuctionSchema.set('toObject', { virtuals: true })

// Pre-save middleware to update auction status based on time
AuctionSchema.pre('save', function(this: IAuction, next: any) {
  const now = new Date()
  
  if (this.status === 'upcoming' && now >= this.startTime && now < this.endTime) {
    this.status = 'active'
  } else if (this.status === 'active' && now >= this.endTime) {
    this.status = this.currentBidder ? 'sold' : 'ended'
  }
  
  next()
})

export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema)
