// Request/Response Types for Backend API

// Express Request Extensions
export interface AuthenticatedRequest {
  user?: {
    publicKey: string
    network?: 'testnet' | 'mainnet'
  }
  [key: string]: any
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp?: string
}

export interface ApiError {
  code: string
  message: string
  userMessage: string
  details?: Record<string, any>
  validationErrors?: ValidationError[]
  statusCode?: number
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Artwork Types (Backend)
export interface Artwork {
  id: string
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: string
  createdAt: string
  updatedAt: string
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  owner?: string
  isListed: boolean
  metadata?: ArtworkMetadata
  blockchainData?: BlockchainData
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

export interface ArtworkAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'date' | 'string'
  trait_value?: string | number
}

export interface BlockchainData {
  tokenId?: string
  contractAddress?: string
  transactionHash?: string
  blockNumber?: number
  owner?: string
  mintedAt?: string
  network: 'testnet' | 'mainnet'
}

// Database Types
export interface ArtworkDocument extends Omit<Artwork, 'id'> {
  _id: string
  __v: number
}

export interface UserDocument {
  _id: string
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
  createdAt: string
  updatedAt: string
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

// Request Types
export interface CreateArtworkRequest {
  title: string
  description: string
  imageUrl: string
  price: string
  currency?: string
  category: string
  prompt?: string
  aiModel?: string
  attributes?: ArtworkAttribute[]
}

export interface UpdateArtworkRequest extends Partial<CreateArtworkRequest> {
  isListed?: boolean
  owner?: string
  tokenId?: string
}

export interface ArtworkQueryParams {
  page?: string
  limit?: string
  category?: string
  sort?: string
  creator?: string
  minPrice?: string
  maxPrice?: string
  isListed?: string
  search?: string
}

export interface UserProfileUpdateRequest {
  username?: string
  email?: string
  bio?: string
  website?: string
  twitter?: string
  discord?: string
  avatar?: string
  banner?: string
}

// Stellar/Blockchain Types
export interface StellarAccount {
  publicKey: string
  balance?: string
  network: 'testnet' | 'mainnet'
  isConnected: boolean
}

export interface StellarTransaction {
  hash: string
  status: 'pending' | 'success' | 'error'
  fee?: string
  memo?: string
  operations?: StellarOperation[]
}

export interface StellarOperation {
  type: string
  sourceAccount?: string
  destination?: string
  amount?: string
  asset?: string
}

export interface TransactionResult {
  hash: string
  status: 'success' | 'error'
  ledger?: number
  fee?: string
  memo?: string
  operations?: number
  timestamp?: string
  error?: string
}

// AI Service Types
export interface AIGenerationRequest {
  prompt: string
  model?: string
  style?: string
  aspectRatio?: string
  quality?: 'standard' | 'hd'
  steps?: number
  seed?: number
}

export interface AIGenerationResponse {
  success: boolean
  imageUrl?: string
  prompt?: string
  model?: string
  seed?: number
  generationTime?: number
  cost?: number
  error?: string
}

export interface AIModel {
  id: string
  name: string
  description: string
  version: string
  capabilities: string[]
  costPerGeneration: number
  maxResolution: string
  supportedStyles: string[]
}

// Cache Types
export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[]
  revalidateOnDemand?: boolean
  staleWhileRevalidate?: boolean
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  hits: number
}

// Middleware Types
export interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
  keyGenerator?: (req: any) => string
}

export interface CacheConfig {
  duration: number
  tags: string[]
  keyGenerator?: (req: any) => string
  condition?: (req: any) => boolean
}

// Error Types
export interface ErrorContext {
  requestId?: string
  userId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: string
}

export interface ErrorLog {
  message: string
  stack?: string
  code: string
  statusCode?: number
  context: ErrorContext
  originalError?: any
}

// Service Types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: ServiceError
  metadata?: ServiceMetadata
}

export interface ServiceError {
  code: string
  message: string
  details?: Record<string, any>
  retryable?: boolean
}

export interface ServiceMetadata {
  executionTime: number
  cacheHit?: boolean
  version?: string
  requestId?: string
}

// Validation Types
export interface ValidationRule {
  field: string
  required?: boolean
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[] | number[]
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  data?: any
}

// File Upload Types
export interface FileUpload {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer?: ArrayBuffer
}

export interface ImageProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  resize?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  blur?: number
  sharpen?: boolean
}

// Analytics Types
export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp: string
  ip?: string
  userAgent?: string
}

export interface AnalyticsMetrics {
  totalUsers: number
  activeUsers: number
  totalArtworks: number
  totalTransactions: number
  totalVolume: string
  averageTransactionValue: string
  topCategories: CategoryMetrics[]
  userGrowth: GrowthMetrics[]
}

export interface CategoryMetrics {
  category: string
  count: number
  volume: string
  growth: number
}

export interface GrowthMetrics {
  period: string
  users: number
  artworks: number
  transactions: number
  volume: string
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string
  REDIS_URL: string
  STELLAR_NETWORK: 'testnet' | 'mainnet'
  AI_SERVICE_API_KEY: string
  IPFS_GATEWAY_URL: string
  CORS_ORIGINS: string[]
  RATE_LIMIT_WINDOW: number
  RATE_LIMIT_MAX: number
  CACHE_TTL: number
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug'
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  services: ServiceHealth[]
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  lastCheck: string
}
