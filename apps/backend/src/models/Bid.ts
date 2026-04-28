import mongoose, { Schema, Document } from 'mongoose'

export interface IBid extends Document {
  artwork: mongoose.Types.ObjectId
  bidder: string
  amount: string
  currency: string
  expiresAt?: Date
  status: 'active' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'
  isAutoBid: boolean
  maxAutoBidAmount?: string
  transactionHash?: string
  network: 'testnet' | 'mainnet'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const BidSchema = new Schema<IBid>({
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
    index: true
  },
  bidder: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  amount: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['XLM', 'USD', 'EUR'],
    default: 'XLM'
  },
  expiresAt: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'accepted', 'rejected', 'expired', 'withdrawn'],
    default: 'active',
    index: true
  },
  isAutoBid: {
    type: Boolean,
    default: false
  },
  maxAutoBidAmount: {
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
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
})

// Indexes for performance optimization
BidSchema.index({ artwork: 1, status: 1, amount: -1 })
BidSchema.index({ bidder: 1, status: 1, createdAt: -1 })
BidSchema.index({ status: 1, expiresAt: 1 })
BidSchema.index({ amount: -1 })
BidSchema.index({ network: 1, status: 1 })
BidSchema.index({ createdAt: -1 })
BidSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // Auto-expire bids

// Pre-save middleware to handle bid expiration
BidSchema.pre('save', function(this: IBid, next: any) {
  if (this.isModified('status') && this.status === 'expired') {
    this.expiresAt = new Date()
  }
  next()
})

// Virtual relationships for reverse lookups
BidSchema.virtual('artworkInfo', {
  ref: 'Artwork',
  localField: 'artwork',
  foreignField: '_id',
  justOne: true
})

BidSchema.virtual('bidderInfo', {
  ref: 'User',
  localField: 'bidder',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
BidSchema.set('toJSON', { virtuals: true })
BidSchema.set('toObject', { virtuals: true })

export const Bid = mongoose.model<IBid>('Bid', BidSchema)
