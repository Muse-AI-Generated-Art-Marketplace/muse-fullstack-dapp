import mongoose, { Schema, Document } from 'mongoose'

export interface ICollection extends Document {
  name: string
  description: string
  imageUrl?: string
  bannerImageUrl?: string
  creator: string
  isPublic: boolean
  isFeatured: boolean
  category: string
  tags?: string[]
  artworks: mongoose.Types.ObjectId[]
  metadata?: {
    externalUrl?: string
    backgroundColor?: string
    attributes?: Array<{
      trait_type: string
      value: string | number
      display_type?: 'number' | 'date' | 'string'
    }>
  }
  stats: {
    totalArtworks: number
    totalVolume: string
    floorPrice: string
    owners: number
    totalSales: number
  }
  createdAt: Date
  updatedAt: Date
}

const CollectionSchema = new Schema<ICollection>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  imageUrl: {
    type: String,
    trim: true
  },
  bannerImageUrl: {
    type: String,
    trim: true
  },
  creator: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['abstract', 'portrait', 'landscape', 'fantasy', 'sci-fi', 'anime', 'photography', 'other'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  artworks: [{
    type: Schema.Types.ObjectId,
    ref: 'Artwork'
  }],
  metadata: {
    externalUrl: String,
    backgroundColor: String,
    attributes: [{
      trait_type: String,
      value: Schema.Types.Mixed,
      display_type: {
        type: String,
        enum: ['number', 'date', 'string']
      }
    }]
  },
  stats: {
    totalArtworks: {
      type: Number,
      default: 0,
      index: true
    },
    totalVolume: {
      type: String,
      default: '0'
    },
    floorPrice: {
      type: String,
      default: '0',
      index: true
    },
    owners: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Indexes for performance optimization
CollectionSchema.index({ name: 'text', description: 'text' })
CollectionSchema.index({ creator: 1, createdAt: -1 })
CollectionSchema.index({ category: 1, isPublic: 1, createdAt: -1 })
CollectionSchema.index({ isFeatured: 1, createdAt: -1 })
CollectionSchema.index({ 'stats.floorPrice': 1 })
CollectionSchema.index({ 'stats.totalArtworks': -1 })
CollectionSchema.index({ tags: 1 })
CollectionSchema.index({ createdAt: -1 })

// Virtual relationships for reverse lookups
CollectionSchema.virtual('creatorInfo', {
  ref: 'User',
  localField: 'creator',
  foreignField: 'address',
  justOne: true
})

CollectionSchema.virtual('artworkDetails', {
  ref: 'Artwork',
  localField: 'artworks',
  foreignField: '_id',
  justOne: false
})

// Enable virtuals in JSON/Object output
CollectionSchema.set('toJSON', { virtuals: true })
CollectionSchema.set('toObject', { virtuals: true })

export const Collection = mongoose.model<ICollection>('Collection', CollectionSchema)
