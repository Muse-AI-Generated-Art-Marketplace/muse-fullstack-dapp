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
    attributes?: Record<string, unknown>
    category?: string
    aiModel?: string
    prompt?: string
  }
  image?: string
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
      attributes: { type: Schema.Types.Mixed },
      category: { type: String },
      aiModel: { type: String },
      prompt: { type: String },
    },
    image: { type: String },
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

ArtworkSchema.index({ title: 'text', description: 'text', prompt: 'text' })
ArtworkSchema.index({ creator: 1, isListed: 1 })
ArtworkSchema.index({ category: 1, isListed: 1 })

export const Artwork = mongoose.model<IArtwork>('Artwork', ArtworkSchema)
export default Artwork
