import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { createLogger } from '@/utils/logger'

const logger = createLogger('WebSocketService')

export interface WebSocketMessage {
  type: 'transaction_update' | 'bid_update' | 'sale_update' | 'minting_update'
  data: any
  timestamp: Date
  userId?: string
  artworkId?: string
}

class WebSocketService {
  private io: SocketIOServer | null = null
  private connectedClients: Map<string, Set<string>> = new Map() // userId -> socketIds

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)

      // Handle user authentication
      socket.on('authenticate', (userData) => {
        const { userId, address } = userData
        
        if (userId || address) {
          const userKey = userId || address
          
          // Track user connection
          if (!this.connectedClients.has(userKey)) {
            this.connectedClients.set(userKey, new Set())
          }
          this.connectedClients.get(userKey)!.add(socket.id)
          
          // Join user-specific room
          socket.join(`user:${userKey}`)
          
          logger.info(`User ${userKey} authenticated with socket ${socket.id}`)
          socket.emit('authenticated', { success: true, userKey })
        } else {
          socket.emit('authentication_error', { message: 'Invalid user data' })
        }
      })

      // Handle artwork subscription
      socket.on('subscribe_artwork', (artworkId) => {
        if (artworkId) {
          socket.join(`artwork:${artworkId}`)
          logger.info(`Socket ${socket.id} subscribed to artwork ${artworkId}`)
          socket.emit('subscribed', { type: 'artwork', id: artworkId })
        }
      })

      // Handle artwork unsubscription
      socket.on('unsubscribe_artwork', (artworkId) => {
        if (artworkId) {
          socket.leave(`artwork:${artworkId}`)
          logger.info(`Socket ${socket.id} unsubscribed from artwork ${artworkId}`)
          socket.emit('unsubscribed', { type: 'artwork', id: artworkId })
        }
      })

      // Handle user transactions subscription
      socket.on('subscribe_user_transactions', (userKey) => {
        if (userKey) {
          socket.join(`user_transactions:${userKey}`)
          logger.info(`Socket ${socket.id} subscribed to user transactions for ${userKey}`)
          socket.emit('subscribed', { type: 'user_transactions', id: userKey })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`)
        
        // Remove socket from user tracking
        for (const [userKey, socketIds] of this.connectedClients.entries()) {
          if (socketIds.has(socket.id)) {
            socketIds.delete(socket.id)
            if (socketIds.size === 0) {
              this.connectedClients.delete(userKey)
            }
            break
          }
        }
      })

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error)
      })
    })

    logger.info('WebSocket service initialized')
  }

  // Broadcast transaction updates to relevant users
  broadcastTransactionUpdate(transaction: any): void {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: this.getTransactionUpdateType(transaction.type),
      data: {
        id: transaction._id,
        hash: transaction.hash,
        type: transaction.type,
        status: transaction.status,
        artwork: transaction.artwork,
        from: transaction.from,
        to: transaction.to,
        price: transaction.price,
        currency: transaction.currency,
        network: transaction.network,
        completedAt: transaction.completedAt,
        failureReason: transaction.failureReason,
        metadata: transaction.metadata
      },
      timestamp: new Date(),
      artworkId: transaction.artwork?.toString(),
      userId: transaction.from
    }

    // Send to users involved in the transaction
    const recipients = new Set<string>()
    
    // Add sender
    if (transaction.from) {
      recipients.add(transaction.from)
    }
    
    // Add receiver
    if (transaction.to) {
      recipients.add(transaction.to)
    }

    // Send to each recipient
    recipients.forEach(userKey => {
      this.io!.to(`user:${userKey}`).emit('transaction_update', message)
    })

    // Send to artwork subscribers
    if (transaction.artwork) {
      this.io.to(`artwork:${transaction.artwork}`).emit('transaction_update', message)
    }

    logger.info(`Broadcasted transaction update for ${transaction._id} to ${recipients.size} users`)
  }

  // Send bid updates
  broadcastBidUpdate(bidData: any): void {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: 'bid_update',
      data: bidData,
      timestamp: new Date(),
      artworkId: bidData.artworkId,
      userId: bidData.bidder
    }

    // Send to artwork subscribers
    this.io.to(`artwork:${bidData.artworkId}`).emit('bid_update', message)
    
    // Send to specific users if needed
    if (bidData.artworkOwner) {
      this.io.to(`user:${bidData.artworkOwner}`).emit('bid_update', message)
    }

    logger.info(`Broadcasted bid update for artwork ${bidData.artworkId}`)
  }

  // Send sale updates
  broadcastSaleUpdate(saleData: any): void {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: 'sale_update',
      data: saleData,
      timestamp: new Date(),
      artworkId: saleData.artworkId,
      userId: saleData.buyer
    }

    // Send to artwork subscribers
    this.io.to(`artwork:${saleData.artworkId}`).emit('sale_update', message)
    
    // Send to seller and buyer
    if (saleData.seller) {
      this.io.to(`user:${saleData.seller}`).emit('sale_update', message)
    }
    if (saleData.buyer) {
      this.io.to(`user:${saleData.buyer}`).emit('sale_update', message)
    }

    logger.info(`Broadcasted sale update for artwork ${saleData.artworkId}`)
  }

  // Send minting updates
  broadcastMintingUpdate(mintingData: any): void {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: 'minting_update',
      data: mintingData,
      timestamp: new Date(),
      artworkId: mintingData.artworkId,
      userId: mintingData.creator
    }

    // Send to artwork subscribers
    this.io.to(`artwork:${mintingData.artworkId}`).emit('minting_update', message)
    
    // Send to creator
    if (mintingData.creator) {
      this.io.to(`user:${mintingData.creator}`).emit('minting_update', message)
    }

    logger.info(`Broadcasted minting update for artwork ${mintingData.artworkId}`)
  }

  // Send general notifications
  sendNotification(userKey: string, notification: any): void {
    if (!this.io) return

    const message = {
      type: 'notification',
      data: notification,
      timestamp: new Date()
    }

    this.io.to(`user:${userKey}`).emit('notification', message)
    logger.info(`Sent notification to user ${userKey}`)
  }

  // Get connection statistics
  getStats(): { connectedClients: number; trackedUsers: number } {
    const totalSockets = this.connectedClients.size
    const totalUsers = this.connectedClients.size
    
    return {
      connectedClients: totalSockets,
      trackedUsers: totalUsers
    }
  }

  // Helper method to determine transaction update type
  private getTransactionUpdateType(transactionType: string): WebSocketMessage['type'] {
    switch (transactionType) {
      case 'bid':
        return 'bid_update'
      case 'sale':
        return 'sale_update'
      case 'mint':
        return 'minting_update'
      default:
        return 'transaction_update'
    }
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.io) {
      this.io.close(() => {
        logger.info('WebSocket service shut down')
      })
    }
  }
}

export const websocketService = new WebSocketService()
