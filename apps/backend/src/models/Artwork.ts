import mongoose, { Document, Schema } from 'mongoose'

export interface IArtwork extends Document {
  title: string
  description: string
  imageUrl: string
  price: string
  currency: 'XLM' | 'USD' | 'EUR'
  creator: string
  owner: string
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  isListed: boolean
  metadata?: {
    attributes?: Array<{
      trait_type: string
      value: string | number
      display_type?: 'number' | 'date' | 'string'
    }>
    category?: string
    aiModel?: string
    prompt?: string
    externalUrl?: string
    backgroundColor?: string
  }
  image?: string
  // File upload related fields
  fileUpload?: {
    key: string
    bucket: string
    contentType: string
    size: number
    etag?: string
    originalName: string
    uploadDate: Date
  }
  // Multiple image formats support
  images?: {
    original?: string
    thumbnail?: string
    medium?: string
    large?: string
    webp?: string
    avif?: string
  }
  blockchainData?: {
    network?: string
    contractId?: string
    transactionHash?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ArtworkSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    price: { type: String, required: true },
    currency: { type: String, enum: ['XLM', 'USD', 'EUR'], default: 'XLM' },
    creator: { type: String, required: true, index: true },
    owner: { type: String, required: true, index: true },
    category: { type: String, required: true, lowercase: true, index: true },
    prompt: { type: String },
    aiModel: { type: String },
    tokenId: { type: String, sparse: true },
    isListed: { type: Boolean, default: false, index: true },
    metadata: {
      attributes: [{
        trait_type: String,
        value: Schema.Types.Mixed,
        display_type: { type: String, enum: ['number', 'date', 'string'] },
      }],
      category: { type: String },
      aiModel: { type: String },
      prompt: { type: String },
      externalUrl: { type: String },
      backgroundColor: { type: String },
    },
    image: { type: String },
    // File upload metadata
    fileUpload: {
      key: { type: String },
      bucket: { type: String },
      contentType: { type: String },
      size: { type: Number },
      etag: { type: String },
      originalName: { type: String },
      uploadDate: { type: Date, default: Date.now },
    },
    // Multiple image formats
    images: {
      original: { type: String },
      thumbnail: { type: String },
      medium: { type: String },
      large: { type: String },
      webp: { type: String },
      avif: { type: String },
    },
    blockchainData: {
      network: { type: String },
      contractId: { type: String },
      transactionHash: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual for artist name lookup
ArtworkSchema.virtual('artistInfo', {
  ref: 'User',
  localField: 'creator',
  foreignField: 'address',
  justOne: true
})

ArtworkSchema.index({ title: 'text', description: 'text', prompt: 'text', category: 'text' })
ArtworkSchema.index({ creator: 1, isListed: 1 })
ArtworkSchema.index({ category: 1, isListed: 1, createdAt: -1 })
ArtworkSchema.index({ creator: 1, createdAt: -1 })
ArtworkSchema.index({ price: 1 })
ArtworkSchema.index({ createdAt: -1 })
ArtworkSchema.index({ price: 1, createdAt: -1 })
ArtworkSchema.index({ category: 1, price: 1 })
ArtworkSchema.index({ creator: 1, category: 1, createdAt: -1 })

// Virtual relationships
ArtworkSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('auction', {
  ref: 'Auction',
  localField: '_id',
  foreignField: 'artwork',
  justOne: true
})

ArtworkSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

ArtworkSchema.virtual('favorites', {
  ref: 'Favorite',
  localField: '_id',
  foreignField: 'artwork',
  justOne: false
})

// Cascade delete related entities when artwork is deleted
ArtworkSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const artworkId = this._id
  
  await mongoose.model('Transaction').deleteMany({ artwork: artworkId })
  await mongoose.model('Bid').deleteMany({ artwork: artworkId })
  await mongoose.model('Auction').deleteOne({ artwork: artworkId })
  await mongoose.model('Comment').deleteMany({ artwork: artworkId })
  await mongoose.model('Like').deleteMany({ artwork: artworkId })
  await mongoose.model('Favorite').deleteMany({ artwork: artworkId })
  await mongoose.model('Collection').updateMany(
    { artworks: artworkId },
    { $pull: { artworks: artworkId } }
  )
})

export const Artwork = mongoose.model<IArtwork>('Artwork', ArtworkSchema)
export default Artwork
