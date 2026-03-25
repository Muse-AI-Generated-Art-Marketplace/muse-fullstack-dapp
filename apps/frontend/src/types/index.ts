// Core Artwork Types
export interface Artwork {
  id: string
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: string
  createdAt: string
  category: string
  prompt?: string
  aiModel?: string
  tokenId?: string
  owner?: string
  isListed?: boolean
  metadata?: ArtworkMetadata
}

export interface ArtworkMetadata {
  attributes?: ArtworkAttribute[]
  externalUrl?: string
  backgroundColor?: string
  animationUrl?: string
  youtubeUrl?: string
}

export interface ArtworkAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'date' | 'string'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  userMessage: string
  details?: Record<string, any>
  validationErrors?: string[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: Pagination
}

export interface ArtworksResponse extends PaginatedResponse<Artwork> {}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

// Artwork Filter and Sort Types
export interface ArtworksFilters {
  category?: string
  priceRange?: string
  sortBy?: 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc' | 'title-asc' | 'title-desc'
  creator?: string
  minPrice?: number
  maxPrice?: number
  isListed?: boolean
}

export interface ArtworkSearchParams {
  query?: string
  filters?: ArtworksFilters
  page?: number
  limit?: number
}

// Stellar/Blockchain Types
export interface StellarAccount {
  publicKey: string
  isConnected: boolean
  balance?: string
  network?: 'testnet' | 'mainnet'
}

export interface StellarTransaction {
  hash: string
  status: 'pending' | 'success' | 'error'
  error?: AppError | null
  timestamp?: string
  fee?: string
  memo?: string
}

export interface StellarBalance {
  asset_type: 'native' | 'credit_alphanum4' | 'credit_alphanum12'
  asset_code?: string
  asset_issuer?: string
  balance: string
  limit?: string
  buying_liabilities?: string
  selling_liabilities?: string
  last_modified_ledger?: number
}

export interface WalletInfo {
  publicKey: string
  isConnected: boolean
  network: 'testnet' | 'mainnet'
  balance?: string
  name?: string
}

// Component Prop Types
export interface ArtworkCardProps {
  artwork: Artwork
  variant?: 'default' | 'compact' | 'detailed'
  onPurchase?: (artwork: Artwork) => void
  onView?: (artwork: Artwork) => void
  onShare?: (artwork: Artwork) => void
  onFavorite?: (artwork: Artwork) => void
  showPrice?: boolean
  showCreator?: boolean
  showActions?: boolean
  className?: string
  isLoading?: boolean
}

export interface ArtworkGridProps {
  artworks: Artwork[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onPurchase?: (artwork: Artwork) => void
  onView?: (artwork: Artwork) => void
  onClearFilters?: () => void
  hasFilters?: boolean
  cardVariant?: ArtworkCardProps['variant']
  showPrice?: boolean
  showCreator?: boolean
  loadingCount?: number
}

export interface WalletConnectProps {
  onConnect?: () => void
  onDisconnect?: () => void
  showBalance?: boolean
  showNetwork?: boolean
  variant?: 'default' | 'compact' | 'minimal'
}

// Form Types
export interface CreateArtworkForm {
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  category: string
  prompt?: string
  aiModel?: string
  attributes?: ArtworkAttribute[]
}

export interface UpdateArtworkForm extends Partial<CreateArtworkForm> {
  id: string
  isListed?: boolean
}

export interface UserProfileForm {
  username: string
  email?: string
  bio?: string
  website?: string
  twitter?: string
  discord?: string
}

// Error Handling Types
export interface AppError {
  code: string
  message: string
  userMessage: string
  isRecoverable: boolean
  statusCode?: number
  details?: Record<string, any>
  originalError?: Error | unknown
  timestamp?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
  errorInfo?: any
}

export interface ErrorToastProps {
  error: AppError
  onDismiss?: () => void
  onRetry?: () => void
  autoClose?: boolean
  duration?: number
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: AppError | null
  lastUpdated?: string
}

// Navigation Types
export interface NavigationItem {
  id: string
  label: string
  path: string
  icon?: string
  badge?: string | number
  isActive?: boolean
  disabled?: boolean
}

export interface BreadcrumbItem {
  label: string
  path?: string
  isActive?: boolean
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  category?: string
  priceRange?: [number, number]
  dateRange?: [string, string]
  creator?: string
  tags?: string[]
}

export interface FilterOption {
  value: string
  label: string
  count?: number
  isActive?: boolean
}

export interface SortOption {
  value: string
  label: string
  direction: 'asc' | 'desc'
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  isRead?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

// Market Types
export interface MarketStats {
  totalVolume: string
  totalSales: number
  averagePrice: string
  floorPrice: string
  topCollections: CollectionStats[]
}

export interface CollectionStats {
  id: string
  name: string
  volume: string
  sales: number
  floorPrice: string
  averagePrice: string
}

// User/Profile Types
export interface UserProfile {
  publicKey: string
  username?: string
  bio?: string
  email?: string
  website?: string
  twitter?: string
  discord?: string
  avatar?: string
  banner?: string
  createdAt: string
  isVerified?: boolean
  stats: UserStats
}

export interface UserStats {
  artworksCreated: number
  artworksOwned: number
  totalSales: string
  totalPurchases: string
  followers: number
  following: number
}

// Event Types
export interface ArtworkEvent {
  id: string
  type: 'created' | 'listed' | 'sold' | 'transfer' | 'bid' | 'offer'
  artworkId: string
  from: string
  to?: string
  price?: string
  timestamp: string
  transactionHash?: string
  metadata?: Record<string, any>
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Theme Types
export interface Theme {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    error: string
    warning: string
    success: string
    info: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
  }
  breakpoints: {
    mobile: string
    tablet: string
    desktop: string
    wide: string
  }
}
