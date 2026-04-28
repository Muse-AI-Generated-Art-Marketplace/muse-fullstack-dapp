import mongoose, { Schema, Document } from 'mongoose'

export interface IApiKey extends Document {
  name: string
  key: string
  hashedKey: string
  userId: mongoose.Types.ObjectId
  permissions: string[]
  rateLimit: {
    requests: number
    window: number // in milliseconds
  }
  isActive: boolean
  lastUsed?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

const ApiKeySchema = new Schema<IApiKey>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hashedKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin'],
    required: true
  }],
  rateLimit: {
    requests: {
      type: Number,
      required: true,
      default: 1000,
      min: 1,
      max: 100000
    },
    window: {
      type: Number,
      required: true,
      default: 3600000, // 1 hour in milliseconds
      min: 60000 // 1 minute minimum
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  lastUsed: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Index for efficient queries
ApiKeySchema.index({ userId: 1, isActive: 1 })
ApiKeySchema.index({ hashedKey: 1 })
ApiKeySchema.index({ key: 1 })
ApiKeySchema.index({ expiresAt: 1 })

// Pre-save middleware to ensure key is hashed before saving
ApiKeySchema.pre('save', function(this: IApiKey, next: (err?: Error) => void) {
  if (this.isModified('key') && this.key) {
    // The actual hashing will be done in the service layer
    next()
  } else {
    next()
  }
})

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema)
