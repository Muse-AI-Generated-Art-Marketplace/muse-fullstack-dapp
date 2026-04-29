import mongoose, { Schema, Document } from 'mongoose'
import { UserDocument } from './User'

export interface ArtworkDocument extends Document {
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: mongoose.Types.ObjectId | UserDocument
  owner?: mongoose.Types.ObjectId | UserDocument
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  isListed: boolean
  attributes?: ArtworkAttribute[]
  metadata?: ArtworkMetadata
  blockchainData?: BlockchainData
  createdAt: Date
  updatedAt: Date
}

export interface ArtworkAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'date' | 'string'
  trait_value?: string | number
}

export interface ArtworkMetadata {
  attributes?: ArtworkAttribute[]
  externalUrl?: string
  backgroundColor?: string
  animationUrl?: string
  youtubeUrl?: string
  image?: string
  name?: string
  description?: string
}

export interface BlockchainData {
  tokenId?: string
  contractAddress?: string
  transactionHash?: string
  blockNumber?: number
  owner?: string
  mintedAt?: Date
  network: 'testnet' | 'mainnet'
}

const ArtworkAttributeSchema = new Schema<ArtworkAttribute>({
  trait_type: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  display_type: { type: String, enum: ['number', 'date', 'string'] },
  trait_value: { type: Schema.Types.Mixed }
}, { _id: false })

const ArtworkMetadataSchema = new Schema<ArtworkMetadata>({
  attributes: [ArtworkAttributeSchema],
  externalUrl: String,
  backgroundColor: String,
  animationUrl: String,
  youtubeUrl: String,
  image: String,
  name: String,
  description: String
}, { _id: false })

const BlockchainDataSchema = new Schema<BlockchainData>({
  tokenId: String,
  contractAddress: String,
  transactionHash: String,
  blockNumber: Number,
  owner: String,
  mintedAt: Date,
  network: { type: String, enum: ['testnet', 'mainnet'], default: 'testnet' }
}, { _id: false })

const ArtworkSchema = new Schema<ArtworkDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['ETH', 'USDC', 'DAI', 'XLM'],
    default: 'ETH'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    required: true,
    enum: ['abstract', 'portrait', 'landscape', 'digital-art', 'ai-generated', 'photography', '3d-art', 'animation'],
    index: true
  },
  prompt: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  aiModel: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tokenId: {
    type: String,
    sparse: true,
    index: true
  },
  isListed: {
    type: Boolean,
    default: true,
    index: true
  },
  attributes: [ArtworkAttributeSchema],
  metadata: ArtworkMetadataSchema,
  blockchainData: BlockchainDataSchema
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Indexes for performance optimization
ArtworkSchema.index({ creator: 1, createdAt: -1 })
ArtworkSchema.index({ owner: 1, createdAt: -1 })
ArtworkSchema.index({ category: 1, isListed: 1, createdAt: -1 })
ArtworkSchema.index({ price: 1 })
ArtworkSchema.index({ title: 'text', description: 'text' })
ArtworkSchema.index({ createdAt: -1 })

// Virtual for checking if artwork is owned by creator
ArtworkSchema.virtual('isOwnedByCreator').get(function() {
  return this.owner ? this.owner.toString() === this.creator.toString() : true
})

// Pre-save middleware to ensure data integrity
ArtworkSchema.pre('save', function(next) {
  if (this.isNew && !this.owner) {
    this.owner = this.creator
  }
  next()
})

export const Artwork = mongoose.model<ArtworkDocument>('Artwork', ArtworkSchema)
