# WebSocket Integration for Real-Time Notifications

This document describes the WebSocket integration implemented to provide real-time updates for bids, sales, and minting status in the Muse AI Art Marketplace.

## Overview

The WebSocket integration enables users to receive instant notifications when:
- New bids are placed on artworks
- Sales are completed
- Minting processes start, progress, or complete
- Transaction statuses change

## Architecture

### Backend Components

#### 1. WebSocket Service (`apps/backend/src/services/websocketService.ts`)
- Manages WebSocket connections using Socket.IO
- Handles user authentication and room subscriptions
- Broadcasts real-time updates to relevant users
- Supports different message types: transaction_update, bid_update, sale_update, minting_update

#### 2. Transaction Service Integration
- Integrated with `transactionService.ts` to broadcast updates when:
  - New transactions are created
  - Transaction statuses change
  - Processing completes or fails

#### 3. Server Integration
- WebSocket server initialized in `index.ts`
- Graceful shutdown handling
- CORS configuration for cross-origin requests

### Frontend Components

#### 1. WebSocket Context (`apps/frontend/src/contexts/WebSocketContext.tsx`)
- React context provider for WebSocket functionality
- Custom hooks for different update types:
  - `useWebSocket()` - Core WebSocket functionality
  - `useBidUpdates()` - Bid-specific updates
  - `useSaleUpdates()` - Sale-specific updates
  - `useMintingUpdates()` - Minting-specific updates
  - `useTransactionUpdates()` - All transaction updates

#### 2. Notification Components
- `RealTimeNotifications.tsx` - Global notification system
- `TransactionStatusIndicator.tsx` - Transaction status displays
- `WebSocketDemo.tsx` - Demo component for testing

#### 3. Page Integration
- `MintPage.tsx` - Real-time minting status updates
- `ExplorePage.tsx` - Live activity feed for bids and sales

## Installation and Setup

### Backend Dependencies

Add to `apps/backend/package.json`:
```json
{
  "dependencies": {
    "socket.io": "^4.7.2"
  }
}
```

### Frontend Dependencies

Add to `apps/frontend/package.json`:
```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2"
  }
}
```

### Environment Variables

Frontend (`.env`):
```
VITE_WS_URL=http://localhost:3001
```

## Usage

### Backend - Broadcasting Updates

```typescript
import { websocketService } from '@/services/websocketService'

// Broadcast transaction update
websocketService.broadcastTransactionUpdate(transaction)

// Broadcast bid update
websocketService.broadcastBidUpdate({
  artworkId: 'artwork-123',
  bidder: 'user-address',
  price: '100',
  currency: 'XLM'
})

// Broadcast sale update
websocketService.broadcastSaleUpdate({
  artworkId: 'artwork-123',
  buyer: 'buyer-address',
  seller: 'seller-address',
  price: '150',
  currency: 'XLM'
})

// Broadcast minting update
websocketService.broadcastMintingUpdate({
  artworkId: 'artwork-123',
  creator: 'creator-address',
  status: 'processing',
  transactionHash: '0x123...'
})
```

### Frontend - Using WebSocket Hooks

```typescript
import { 
  useWebSocket, 
  useBidUpdates, 
  useSaleUpdates, 
  useMintingUpdates 
} from '@/contexts/WebSocketContext'

function MyComponent() {
  const { isConnected, subscribeToArtwork } = useWebSocket()
  const { bidUpdates } = useBidUpdates()
  const { saleUpdates } = useSaleUpdates()
  const { mintingUpdates } = useMintingUpdates()

  useEffect(() => {
    if (isConnected) {
      subscribeToArtwork('artwork-123')
    }
  }, [isConnected, subscribeToArtwork])

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Bid Updates: {bidUpdates.length}</div>
      <div>Sale Updates: {saleUpdates.length}</div>
      <div>Minting Updates: {mintingUpdates.length}</div>
    </div>
  )
}
```

## Message Types

### Transaction Update
```typescript
{
  type: 'transaction_update',
  data: {
    id: string,
    hash: string,
    type: 'mint' | 'sale' | 'transfer' | 'bid' | 'cancel',
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    artwork: string,
    from: string,
    to?: string,
    price: string,
    currency: string,
    network: 'testnet' | 'mainnet',
    completedAt?: string,
    failureReason?: string
  },
  timestamp: string,
  artworkId?: string,
  userId?: string
}
```

### Bid Update
```typescript
{
  type: 'bid_update',
  data: {
    artworkId: string,
    bidder: string,
    price: string,
    currency: string,
    artworkOwner?: string
  },
  timestamp: string
}
```

### Sale Update
```typescript
{
  type: 'sale_update',
  data: {
    artworkId: string,
    buyer: string,
    seller: string,
    price: string,
    currency: string
  },
  timestamp: string
}
```

### Minting Update
```typescript
{
  type: 'minting_update',
  data: {
    artworkId: string,
    creator: string,
    status: string,
    transactionHash?: string
  },
  timestamp: string
}
```

## WebSocket Events

### Client to Server

- `authenticate` - Authenticate user with `{ userId?: string, address?: string }`
- `subscribe_artwork` - Subscribe to artwork updates with `{ artworkId: string }`
- `unsubscribe_artwork` - Unsubscribe from artwork updates
- `subscribe_user_transactions` - Subscribe to user's transactions

### Server to Client

- `authenticated` - Authentication success response
- `authentication_error` - Authentication failed
- `subscribed` - Subscription confirmation
- `unsubscribed` - Unsubscription confirmation
- `transaction_update` - Transaction status update
- `bid_update` - New bid or bid update
- `sale_update` - Sale completion
- `minting_update` - Minting status update
- `notification` - General notification

## Testing

### Backend Tests
```bash
cd apps/backend
npm test -- websocketService.test.ts
```

### Frontend Tests
```bash
cd apps/frontend
npm test -- WebSocketContext.test.tsx
```

### Manual Testing
1. Start both backend and frontend servers
2. Navigate to the WebSocketDemo component
3. Test authentication and subscriptions
4. Create transactions to see real-time updates

## Performance Considerations

### Connection Management
- Automatic reconnection with exponential backoff
- Connection pooling for multiple tabs/windows
- Graceful degradation when WebSocket is unavailable

### Message Optimization
- Message batching for high-frequency updates
- Selective subscriptions to reduce unnecessary traffic
- Message size limits and validation

### Scalability
- Redis adapter for multi-server deployments (future enhancement)
- Load balancing considerations
- Connection limits and rate limiting

## Security

### Authentication
- JWT token validation (can be integrated with existing auth system)
- User identification via wallet address
- Room-based access control

### CORS
- Configured for specific origins
- Credential support for authenticated requests

### Validation
- Input validation for all WebSocket messages
- Room subscription validation
- Rate limiting per connection

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if backend server is running
   - Verify CORS configuration
   - Check WebSocket URL in environment variables

2. **No Updates Received**
   - Verify authentication
   - Check room subscriptions
   - Ensure backend is broadcasting updates

3. **Memory Leaks**
   - Unsubscribe from rooms when component unmounts
   - Clear notifications periodically
   - Close WebSocket connections properly

### Debug Mode

Enable debug logging by setting:
```typescript
// In WebSocketContext.tsx
const socket = io(url, { debug: true })
```

## Future Enhancements

1. **Redis Integration** - For multi-server WebSocket scaling
2. **Message Persistence** - Store missed messages for offline users
3. **Advanced Filtering** - Client-side message filtering
4. **Analytics** - Track WebSocket usage and performance
5. **Push Notifications** - Fallback to push notifications when WebSocket is unavailable

## Dependencies

- **Backend**: `socket.io@^4.7.2`
- **Frontend**: `socket.io-client@^4.7.2`
- **React**: Context API and Hooks
- **TypeScript**: Full type safety for all WebSocket messages
