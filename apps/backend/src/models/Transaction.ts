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
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  fee?: string
  metadata?: Record<string, any>
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
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  gasUsed: String,
  gasPrice: String,
  fee: String,
  metadata: Schema.Types.Mixed,
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

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema)
