import mongoose, { Schema, Document } from 'mongoose'

// ---------------------------------------------------------------------------
// Supported webhook event types
// ---------------------------------------------------------------------------

export const WEBHOOK_EVENTS = [
  'artwork.created',
  'artwork.updated',
  'artwork.sold',
  'artwork.listed',
  'artwork.delisted',
  'bid.placed',
  'bid.accepted',
  'bid.outbid',
  'auction.started',
  'auction.ended',
  'user.registered',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

// ---------------------------------------------------------------------------
// Delivery attempt sub-document
// ---------------------------------------------------------------------------

export interface IDeliveryAttempt {
  attemptedAt: Date
  responseStatus?: number
  responseBody?: string
  error?: string
  success: boolean
}

const DeliveryAttemptSchema = new Schema<IDeliveryAttempt>(
  {
    attemptedAt:    { type: Date,    required: true },
    responseStatus: { type: Number },
    responseBody:   { type: String, maxlength: 1000 },
    error:          { type: String, maxlength: 500 },
    success:        { type: Boolean, required: true },
  },
  { _id: false },
)

// ---------------------------------------------------------------------------
// Delivery log — one entry per webhook trigger
// ---------------------------------------------------------------------------

export interface IDeliveryLog {
  event:     WebhookEvent
  payload:   Record<string, unknown>
  attempts:  IDeliveryAttempt[]
  createdAt: Date
}

const DeliveryLogSchema = new Schema<IDeliveryLog>(
  {
    event:     { type: String, required: true },
    payload:   { type: Schema.Types.Mixed, required: true },
    attempts:  { type: [DeliveryAttemptSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

// ---------------------------------------------------------------------------
// Webhook registration document
// ---------------------------------------------------------------------------

export interface IWebhook extends Document {
  userId: string
  url: string
  label?: string
  events: WebhookEvent[]
  secretHash: string
  isActive: boolean
  deliveryLog: IDeliveryLog[]
  createdAt: Date
  updatedAt: Date
}

const WebhookSchema = new Schema<IWebhook>(
  {
    userId:    { type: String, required: true, index: true },
    url:       { type: String, required: true, trim: true },
    label:     { type: String, trim: true, maxlength: 100 },
    events:    { type: [String], required: true, enum: WEBHOOK_EVENTS },
    secretHash:{ type: String, required: true },
    isActive:  { type: Boolean, default: true },
    deliveryLog: {
      type:    [DeliveryLogSchema],
      default: [],
      // Keep only the most recent 50 deliveries to cap document size
    },
  },
  { timestamps: true },
)

export default mongoose.model<IWebhook>('Webhook', WebhookSchema)