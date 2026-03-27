import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  address: string
  username: string
  email?: string
  bio?: string
  profileImage?: string
  avatar?: string
  banner?: string
  tier: 'free' | 'pro' | 'premium'
  isVerified: boolean
  stats?: {
    artworks?: number
    sales?: number
    followers?: number
    following?: number
  }
  preferences?: {
    notifications?: boolean
    privacy?: string
    display?: string
    theme?: string
    currency?: string
    language?: string
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    address: { type: String, required: true, unique: true, index: true, trim: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, trim: true, lowercase: true },
    bio: { type: String, trim: true },
    profileImage: { type: String },
    avatar: { type: String },
    banner: { type: String },
    tier: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    isVerified: { type: Boolean, default: false },
    stats: {
      artworks: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      privacy: { type: String, default: 'public' },
      display: { type: String, default: 'grid' },
      theme: { type: String, default: 'dark' },
      currency: { type: String, default: 'XLM' },
      language: { type: String, default: 'en' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

export const User = mongoose.model<IUser>('User', UserSchema)
export default User
