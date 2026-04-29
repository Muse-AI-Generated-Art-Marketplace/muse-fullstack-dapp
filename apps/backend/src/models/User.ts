import mongoose, { Schema, Document } from 'mongoose'

export interface UserDocument extends Document {
  publicKey: string
  username?: string
  email?: string
  bio?: string
  website?: string
  twitter?: string
  discord?: string
  avatar?: string
  banner?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  stats: UserStats
  preferences: UserPreferences
}

export interface UserStats {
  artworksCreated: number
  artworksOwned: number
  totalSales: string
  totalPurchases: string
  followers: number
  following: number
}

export interface UserPreferences {
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
  display: DisplayPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sales: boolean
  purchases: boolean
  follows: boolean
  priceAlerts: boolean
}

export interface PrivacyPreferences {
  showPublicProfile: boolean
  showHoldings: boolean
  showActivity: boolean
  allowMessages: boolean
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  currency: string
  timezone: string
}

const UserStatsSchema = new Schema<UserStats>({
  artworksCreated: { type: Number, default: 0, min: 0 },
  artworksOwned: { type: Number, default: 0, min: 0 },
  totalSales: { type: String, default: '0' },
  totalPurchases: { type: String, default: '0' },
  followers: { type: Number, default: 0, min: 0 },
  following: { type: Number, default: 0, min: 0 }
}, { _id: false })

const NotificationPreferencesSchema = new Schema<NotificationPreferences>({
  email: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  sales: { type: Boolean, default: true },
  purchases: { type: Boolean, default: true },
  follows: { type: Boolean, default: true },
  priceAlerts: { type: Boolean, default: true }
}, { _id: false })

const PrivacyPreferencesSchema = new Schema<PrivacyPreferences>({
  showPublicProfile: { type: Boolean, default: true },
  showHoldings: { type: Boolean, default: true },
  showActivity: { type: Boolean, default: true },
  allowMessages: { type: Boolean, default: true }
}, { _id: false })

const DisplayPreferencesSchema = new Schema<DisplayPreferences>({
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'dark' },
  language: { type: String, default: 'en' },
  currency: { type: String, default: 'ETH' },
  timezone: { type: String, default: 'UTC' }
}, { _id: false })

const UserPreferencesSchema = new Schema<UserPreferences>({
  notifications: NotificationPreferencesSchema,
  privacy: PrivacyPreferencesSchema,
  display: DisplayPreferencesSchema
}, { _id: false })

const UserSchema = new Schema<UserDocument>({
  publicKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic validation for Stellar public key format
        return /^[G][A-Z0-9]{55}$/.test(v)
      },
      message: 'Invalid Stellar public key format'
    }
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_]+$/.test(v)
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Invalid email format'
    }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Website must be a valid URL'
    }
  },
  twitter: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true
        return /^[a-zA-Z0-9_]{1,15}$/.test(v)
      },
      message: 'Invalid Twitter username'
    }
  },
  discord: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    trim: true
  },
  banner: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  stats: {
    type: UserStatsSchema,
    default: () => ({})
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  }
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
UserSchema.index({ username: 1 })
UserSchema.index({ isVerified: 1, createdAt: -1 })
UserSchema.index({ 'stats.artworksCreated': -1 })
UserSchema.index({ 'stats.followers': -1 })

// Virtual for getting user's public artworks
UserSchema.virtual('publicArtworks', {
  ref: 'Artwork',
  localField: '_id',
  foreignField: 'creator',
  match: { isListed: true }
})

// Virtual for getting user's owned artworks
UserSchema.virtual('ownedArtworks', {
  ref: 'Artwork',
  localField: '_id',
  foreignField: 'owner'
})

// Pre-save middleware to ensure data integrity
UserSchema.pre('save', function(next) {
  if (this.isModified('username') && this.username) {
    this.username = this.username.toLowerCase()
  }
  next()
})

export const User = mongoose.model<UserDocument>('User', UserSchema)
