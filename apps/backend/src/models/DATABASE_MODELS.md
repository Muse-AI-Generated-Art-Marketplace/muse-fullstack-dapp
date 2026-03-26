# Database Models Documentation

This document provides a comprehensive overview of all Mongoose models defined for the Muse AI Art Marketplace.

## Existing Models (Previously Defined)

### 1. Artwork Model
**File:** `src/models/Artwork.ts`
**Purpose:** Represents AI-generated artworks available in the marketplace.

**Key Fields:**
- `title`, `description`, `imageUrl` - Basic artwork information
- `price`, `currency` - Pricing information
- `creator`, `owner` - User relationships
- `category`, `prompt`, `aiModel` - AI generation details
- `tokenId`, `blockchainData` - Blockchain integration
- `metadata` - NFT metadata attributes
- `isListed` - Marketplace visibility

### 2. User Model
**File:** `src/models/User.ts`
**Purpose:** Represents user profiles and preferences.

**Key Fields:**
- `publicKey` - Stellar public key (primary identifier)
- `username`, `email`, `bio` - Profile information
- `avatar`, `banner` - Visual assets
- `stats` - User statistics (artworks, sales, followers)
- `preferences` - User settings (notifications, privacy, display)
- `isVerified` - Verification status

### 3. Transaction Model
**File:** `src/models/Transaction.ts`
**Purpose:** Records all blockchain transactions.

**Key Fields:**
- `hash` - Transaction hash
- `type` - Transaction type (mint, sale, transfer, bid, cancel)
- `artwork` - Reference to artwork
- `from`, `to` - Transaction parties
- `price`, `currency` - Financial details
- `network`, `status` - Blockchain information
- `blockNumber`, `gasUsed` - Technical details

## New Models (Added in This Fix)

### 4. Collection Model
**File:** `src/models/Collection.ts`
**Purpose:** Groups related artworks into collections.

**Key Fields:**
- `name`, `description` - Collection information
- `imageUrl`, `bannerImageUrl` - Visual assets
- `creator` - Collection owner
- `isPublic`, `isFeatured` - Visibility settings
- `category`, `tags` - Classification
- `artworks` - Array of artwork references
- `stats` - Collection statistics (totalArtworks, floorPrice, owners)

**Use Cases:**
- Curated collections by artists
- Theme-based collections
- Featured marketplace collections

### 5. Bid Model
**File:** `src/models/Bid.ts`
**Purpose:** Handles bidding functionality for artworks.

**Key Fields:**
- `artwork` - Reference to artwork being bid on
- `bidder` - User placing the bid
- `amount`, `currency` - Bid amount
- `expiresAt` - Bid expiration time
- `status` - Bid status (active, accepted, rejected, expired, withdrawn)
- `isAutoBid`, `maxAutoBidAmount` - Auto-bidding functionality
- `transactionHash` - Blockchain transaction reference

**Use Cases:**
- Auction bidding
- Offer system
- Auto-bidding with maximum limits

### 6. Notification Model
**File:** `src/models/Notification.ts`
**Purpose:** Manages user notifications.

**Key Fields:**
- `recipient`, `sender` - Notification parties
- `type` - Notification type (sale, purchase, bid, follow, like, comment, etc.)
- `title`, `message` - Notification content
- `data` - Associated data (artworkId, transactionId, etc.)
- `isRead`, `priority` - Status and importance
- `category` - Notification category (transaction, social, system)
- `actionUrl` - Deep link for user action

**Use Cases:**
- Transaction notifications
- Social interactions
- System alerts
- Price alerts

### 7. Comment Model
**File:** `src/models/Comment.ts`
**Purpose:** Enables commenting on artworks.

**Key Fields:**
- `artwork` - Reference to artwork
- `author` - Comment author
- `content` - Comment text
- `parentComment` - For threaded replies
- `replies` - Array of reply references
- `likes` - Users who liked the comment
- `isEdited`, `isDeleted` - Status flags
- `moderationStatus` - Content moderation
- `reportedBy` - Users who reported the comment

**Use Cases:**
- Artwork discussions
- Community engagement
- Content moderation
- Threaded conversations

### 8. Auction Model
**File:** `src/models/Auction.ts`
**Purpose:** Advanced auction functionality.

**Key Fields:**
- `artwork` - Unique reference to artwork
- `seller` - Auction creator
- `startingPrice`, `reservePrice` - Pricing
- `currentBid`, `currentBidder` - Current auction state
- `startTime`, `endTime` - Auction timing
- `status` - Auction status (upcoming, active, ended, cancelled, sold)
- `bidIncrement` - Minimum bid increment
- `autoExtendDuration` - Snipe protection
- `isBuyNowAvailable`, `buyNowPrice` - Buy-it-now option
- `bids` - Array of bid references
- `winner`, `finalPrice` - Auction results

**Virtual Fields:**
- `timeRemaining` - Time left in auction
- `bidCount` - Number of bids

**Use Cases:**
- Timed auctions
- Reserve price auctions
- Buy-it-now options
- Anti-sniping protection

### 9. Follow Model
**File:** `src/models/Follow.ts`
**Purpose:** Manages user following relationships.

**Key Fields:**
- `follower` - User who follows
- `following` - User being followed
- `status` - Relationship status (active, blocked, pending)

**Constraints:**
- Compound unique index on (follower, following)
- Prevents duplicate follows

**Use Cases:**
- Social networking
- Artist following
- Feed generation

### 10. Like Model
**File:** `src/models/Like.ts`
**Purpose:** Tracks artwork likes/favorites.

**Key Fields:**
- `artwork` - Reference to artwork
- `user` - User who liked

**Constraints:**
- Compound unique index on (artwork, user)
- Prevents duplicate likes

**Use Cases:**
- Favorite artworks
- Like counting
- Recommendation algorithms

## Model Relationships

### Primary Relationships:
- `User` → `Artwork` (creator, owner)
- `User` → `Collection` (creator)
- `Artwork` → `Collection` (many-to-many)
- `Artwork` → `Bid` (one-to-many)
- `Artwork` → `Auction` (one-to-one)
- `Artwork` → `Comment` (one-to-many)
- `Artwork` → `Like` (one-to-many)
- `User` → `Bid` (bidder)
- `User` → `Comment` (author)
- `User` → `Follow` (follower/following)
- `User` → `Like` (user)
- `User` → `Notification` (recipient/sender)
- `Comment` → `Comment` (self-referencing for replies)

### Cross-References:
- `Transaction` references `Artwork`
- `Bid` references `Artwork`
- `Auction` references `Bid`
- `Notification` can reference `Artwork`, `Transaction`, `Bid`

## Performance Optimizations

All models include comprehensive indexing strategies:

1. **Compound Indexes** for common query patterns
2. **Text Indexes** for search functionality
3. **Sparse Indexes** for optional fields
4. **TTL Indexes** for auto-expiring data
5. **Unique Indexes** for data integrity

## Security Features

1. **Input Validation** through Schema types and constraints
2. **Data Sanitization** with trim and lowercase transformations
3. **Access Control** through status fields and permissions
4. **Content Moderation** in Comment model
5. **Rate Limiting** support through metadata tracking

## Integration Points

### Blockchain Integration:
- Stellar public keys as primary user identifiers
- Transaction hashes for blockchain operations
- Network support (testnet/mainnet)
- Token ID tracking for NFTs

### AI Integration:
- AI model tracking in artworks
- Prompt storage for reproducibility
- Generation metadata

### Marketplace Features:
- Multi-currency support (XLM, USD, EUR)
- Auction and bidding systems
- Collection management
- Social features (follows, likes, comments)

## Usage Examples

### Creating an Artwork with Collection:
```typescript
const artwork = new Artwork({
  title: "AI Generated Landscape",
  description: "Beautiful landscape generated by AI",
  imageUrl: "https://example.com/image.jpg",
  price: "100",
  currency: "XLM",
  creator: "GABCD...",
  category: "landscape",
  aiModel: "stable-diffusion",
  prompt: "A beautiful mountain landscape at sunset"
})

const collection = new Collection({
  name: "AI Landscapes",
  description: "Collection of AI-generated landscapes",
  creator: "GABCD...",
  category: "landscape",
  artworks: [artwork._id]
})
```

### Setting up an Auction:
```typescript
const auction = new Auction({
  artwork: artwork._id,
  seller: "GABCD...",
  startingPrice: "50",
  reservePrice: "100",
  startTime: new Date(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  bidIncrement: "5",
  isBuyNowAvailable: true,
  buyNowPrice: "200"
})
```

### Creating Notifications:
```typescript
const notification = new Notification({
  recipient: "GXYZ...",
  type: "sale",
  title: "Artwork Sold!",
  message: "Your artwork 'AI Landscape' has been sold for 100 XLM",
  data: {
    artworkId: artwork._id,
    amount: "100",
    currency: "XLM"
  },
  priority: "high",
  category: "transaction"
})
```

## Migration Considerations

When deploying these models to production:

1. **Database Indexes** will be created automatically
2. **Data Validation** will enforce schema constraints
3. **Backward Compatibility** is maintained for existing models
4. **Performance Impact** should be monitored with new indexes
5. **Rollback Strategy** should include model versioning

## Future Enhancements

Potential additional models:
- `Report` - Content reporting system
- `Analytics` - Usage analytics
- `Subscription` - Premium features
- `Royalty` - Creator royalty tracking
- `Event` - Marketplace events and promotions
