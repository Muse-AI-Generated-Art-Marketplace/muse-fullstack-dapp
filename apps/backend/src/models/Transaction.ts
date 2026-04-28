import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  hash: string
  type: 'mint' | 'sale' | 'transfer' | 'bid' | 'cancel'
  artwork: mongoose.Types.ObjectId
  from: string
  to?: string
  price: string
  currency: string
  network: 'testnet' | 'mainnet'
  status: 'pending' | 'confirming' | 'processing' | 'completed' | 'failed' | 'cancelled'
  idempotencyKey?: string
  externalId?: string
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  fee?: string
  failureReason?: string
  processingStartedAt?: Date
  metadata?: Record<string, any>
  statusHistory: Array<{
    status: 'pending' | 'confirming' | 'processing' | 'completed' | 'failed' | 'cancelled'
    timestamp: Date
    reason?: string
    metadata?: Record<string, any>
  }>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

const TransactionSchema = new Schema<ITransaction>({
  hash: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['mint', 'sale', 'transfer', 'bid', 'cancel'],
    index: true
  },
  artwork: {
    type: Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  to: {
    type: String,
    trim: true,
    index: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['XLM', 'USD', 'EUR'],
    default: 'XLM'
  },
  network: {
    type: String,
    required: true,
    enum: ['testnet', 'mainnet'],
    default: 'testnet',
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirming', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  idempotencyKey: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  externalId: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  gasUsed: String,
  gasPrice: String,
  fee: String,
  failureReason: String,
  processingStartedAt: Date,
  metadata: Schema.Types.Mixed,
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirming', 'processing', 'completed', 'failed', 'cancelled'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    reason: String,
    metadata: Schema.Types.Mixed
  }],
  completedAt: Date
}, {
  timestamps: true
})

// Indexes for performance optimization
TransactionSchema.index({ hash: 1 }, { unique: true })
TransactionSchema.index({ artwork: 1, createdAt: -1 })
TransactionSchema.index({ from: 1, createdAt: -1 })
TransactionSchema.index({ to: 1, createdAt: -1 })
TransactionSchema.index({ type: 1, status: 1, createdAt: -1 })
TransactionSchema.index({ network: 1, status: 1, createdAt: -1 })
TransactionSchema.index({ status: 1, createdAt: -1 })
TransactionSchema.index({ blockNumber: 1 })
TransactionSchema.index({ price: 1 })
TransactionSchema.index({ idempotencyKey: 1 }, { sparse: true })
TransactionSchema.index({ externalId: 1 }, { sparse: true })
TransactionSchema.index({
  hash: 'text',
  from: 'text',
  to: 'text',
  externalId: 'text',
  failureReason: 'text',
})

TransactionSchema.pre('validate', function(next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      timestamp: this.createdAt || new Date(),
      metadata: this.metadata
    }]
  }

  next()
})

// Virtual relationships for reverse lookups
TransactionSchema.virtual('artworkInfo', {
  ref: 'Artwork',
  localField: 'artwork',
  foreignField: '_id',
  justOne: true
})

TransactionSchema.virtual('fromUserInfo', {
  ref: 'User',
  localField: 'from',
  foreignField: 'address',
  justOne: true
})

TransactionSchema.virtual('toUserInfo', {
  ref: 'User',
  localField: 'to',
  foreignField: 'address',
  justOne: true
})

// Enable virtuals in JSON/Object output
TransactionSchema.set('toJSON', { virtuals: true })
TransactionSchema.set('toObject', { virtuals: true })

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema)
