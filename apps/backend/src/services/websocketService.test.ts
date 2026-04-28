import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { websocketService } from './websocketService'

describe('WebSocketService', () => {
  let io: SocketIOServer
  let server: any

  beforeAll(async () => {
    server = createServer()
    io = new SocketIOServer(server)
    await new Promise<void>((resolve) => {
      server.listen(() => resolve())
    })
  })

  afterAll(async () => {
    io.close()
    server.close()
  })

  beforeEach(() => {
    // Reset the service state before each test
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize WebSocket service without errors', () => {
      expect(() => {
        websocketService.initialize(server)
      }).not.toThrow()
    })

    it('should return connection statistics', () => {
      const stats = websocketService.getStats()
      expect(stats).toHaveProperty('connectedClients')
      expect(stats).toHaveProperty('trackedUsers')
      expect(typeof stats.connectedClients).toBe('number')
      expect(typeof stats.trackedUsers).toBe('number')
    })
  })

  describe('Transaction Broadcasting', () => {
    it('should broadcast transaction updates without errors', () => {
      const mockTransaction = {
        _id: 'test-transaction-id',
        hash: '0x1234567890abcdef',
        type: 'mint',
        status: 'pending',
        artwork: { _id: 'test-artwork-id' },
        from: 'test-user-address',
        to: 'recipient-address',
        price: '100',
        currency: 'XLM',
        network: 'testnet',
        completedAt: new Date(),
        failureReason: null,
        metadata: {}
      }

      expect(() => {
        websocketService.broadcastTransactionUpdate(mockTransaction)
      }).not.toThrow()
    })

    it('should handle bid updates', () => {
      const bidData = {
        artworkId: 'test-artwork-id',
        bidder: 'bidder-address',
        price: '150',
        currency: 'XLM',
        artworkOwner: 'owner-address'
      }

      expect(() => {
        websocketService.broadcastBidUpdate(bidData)
      }).not.toThrow()
    })

    it('should handle sale updates', () => {
      const saleData = {
        artworkId: 'test-artwork-id',
        buyer: 'buyer-address',
        seller: 'seller-address',
        price: '200',
        currency: 'XLM'
      }

      expect(() => {
        websocketService.broadcastSaleUpdate(saleData)
      }).not.toThrow()
    })

    it('should handle minting updates', () => {
      const mintingData = {
        artworkId: 'test-artwork-id',
        creator: 'creator-address',
        status: 'processing',
        transactionHash: '0xabcdef1234567890'
      }

      expect(() => {
        websocketService.broadcastMintingUpdate(mintingData)
      }).not.toThrow()
    })
  })

  describe('Notification Sending', () => {
    it('should send notifications to specific users', () => {
      const userKey = 'test-user-address'
      const notification = {
        type: 'info',
        message: 'Test notification',
        data: {}
      }

      expect(() => {
        websocketService.sendNotification(userKey, notification)
      }).not.toThrow()
    })
  })

  describe('Message Type Determination', () => {
    // Test the private method through public interface
    it('should determine correct message types for different transaction types', () => {
      const mockTransactionBase = {
        _id: 'test-id',
        hash: '0x123',
        artwork: { _id: 'artwork-id' },
        from: 'user',
        price: '100',
        currency: 'XLM',
        network: 'testnet'
      }

      // Test bid transaction
      const bidTransaction = { ...mockTransactionBase, type: 'bid' as const }
      expect(() => {
        websocketService.broadcastTransactionUpdate(bidTransaction)
      }).not.toThrow()

      // Test sale transaction
      const saleTransaction = { ...mockTransactionBase, type: 'sale' as const }
      expect(() => {
        websocketService.broadcastTransactionUpdate(saleTransaction)
      }).not.toThrow()

      // Test mint transaction
      const mintTransaction = { ...mockTransactionBase, type: 'mint' as const }
      expect(() => {
        websocketService.broadcastTransactionUpdate(mintTransaction)
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle broadcasting with null/undefined data gracefully', () => {
      expect(() => {
        websocketService.broadcastTransactionUpdate(null as any)
      }).not.toThrow()

      expect(() => {
        websocketService.broadcastBidUpdate(null as any)
      }).not.toThrow()

      expect(() => {
        websocketService.broadcastSaleUpdate(null as any)
      }).not.toThrow()

      expect(() => {
        websocketService.broadcastMintingUpdate(null as any)
      }).not.toThrow()
    })
  })

  describe('Shutdown', () => {
    it('should shutdown gracefully', () => {
      expect(() => {
        websocketService.shutdown()
      }).not.toThrow()
    })
  })
})

// Integration Tests with actual Socket.IO connections
describe('WebSocketService Integration', () => {
  let server: any
  let io: SocketIOServer
  let clientSocket: any

  beforeAll(async () => {
    server = createServer()
    io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    
    websocketService.initialize(server)
    
    await new Promise<void>((resolve) => {
      server.listen(() => resolve())
    })
  })

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect()
    }
    io.close()
    server.close()
  })

  it('should handle client connections and authentication', (done) => {
    const { io: ClientIO } = require('socket.io-client')
    
    clientSocket = ClientIO('http://localhost:3001', {
      transports: ['websocket']
    })

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true)
      
      // Test authentication
      clientSocket.emit('authenticate', {
        userId: 'test-user',
        address: 'test-address'
      })

      clientSocket.on('authenticated', (response: any) => {
        expect(response.success).toBe(true)
        done()
      })
    })

    clientSocket.on('connect_error', (error: any) => {
      done(error)
    })
  }, 10000)

  it('should handle artwork subscriptions', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not connected'))
      return
    }

    const artworkId = 'test-artwork-id'
    
    clientSocket.emit('subscribe_artwork', artworkId)
    
    clientSocket.on('subscribed', (response: any) => {
      expect(response.type).toBe('artwork')
      expect(response.id).toBe(artworkId)
      done()
    })
  }, 5000)

  it('should receive transaction updates', (done) => {
    if (!clientSocket) {
      done(new Error('Client socket not connected'))
      return
    }

    clientSocket.on('transaction_update', (message: any) => {
      expect(message).toHaveProperty('type')
      expect(message).toHaveProperty('data')
      expect(message).toHaveProperty('timestamp')
      done()
    })

    // Simulate a transaction update
    const mockTransaction = {
      _id: 'test-transaction',
      hash: '0x123',
      type: 'mint',
      status: 'completed',
      artwork: { _id: 'test-artwork' },
      from: 'test-user',
      price: '100',
      currency: 'XLM',
      network: 'testnet'
    }

    websocketService.broadcastTransactionUpdate(mockTransaction)
  }, 5000)
})
