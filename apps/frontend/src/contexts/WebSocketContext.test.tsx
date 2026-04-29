import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WebSocketProvider, useWebSocket, useBidUpdates, useSaleUpdates, useMintingUpdates } from './WebSocketContext'

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connected: true
  }))
}))

describe('WebSocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.VITE_WS_URL = 'http://localhost:3001'
  })

  describe('WebSocketProvider', () => {
    it('should render children without errors', () => {
      render(
        <WebSocketProvider>
          <div>Test Child</div>
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('should provide WebSocket context to children', () => {
      const TestComponent = () => {
        const { isConnected } = useWebSocket()
        return <div>Connected: {isConnected.toString()}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Connected: false')).toBeInTheDocument()
    })
  })

  describe('useWebSocket Hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useWebSocket()
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useWebSocket must be used within a WebSocketProvider')
    })

    it('should provide WebSocket methods', () => {
      const TestComponent = () => {
        const {
          subscribeToArtwork,
          unsubscribeFromArtwork,
          subscribeToUserTransactions,
          sendNotification,
          clearNotifications
        } = useWebSocket()
        
        return (
          <div>
            <button onClick={() => subscribeToArtwork('test-artwork')}>Subscribe</button>
            <button onClick={() => unsubscribeFromArtwork('test-artwork')}>Unsubscribe</button>
            <button onClick={() => subscribeToUserTransactions('test-user')}>Subscribe User</button>
            <button onClick={() => sendNotification({ message: 'test' })}>Send Notification</button>
            <button onClick={clearNotifications}>Clear</button>
          </div>
        )
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Subscribe')).toBeInTheDocument()
      expect(screen.getByText('Unsubscribe')).toBeInTheDocument()
      expect(screen.getByText('Subscribe User')).toBeInTheDocument()
      expect(screen.getByText('Send Notification')).toBeInTheDocument()
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })
  })

  describe('Notification Hooks', () => {
    it('should provide bid updates hook', () => {
      const TestComponent = () => {
        const { bidUpdates } = useBidUpdates()
        return <div>Bid Updates: {bidUpdates.length}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Bid Updates: 0')).toBeInTheDocument()
    })

    it('should provide sale updates hook', () => {
      const TestComponent = () => {
        const { saleUpdates } = useSaleUpdates()
        return <div>Sale Updates: {saleUpdates.length}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Sale Updates: 0')).toBeInTheDocument()
    })

    it('should provide minting updates hook', () => {
      const TestComponent = () => {
        const { mintingUpdates } = useMintingUpdates()
        return <div>Minting Updates: {mintingUpdates.length}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )
      
      expect(screen.getByText('Minting Updates: 0')).toBeInTheDocument()
    })
  })

  describe('WebSocket Message Handling', () => {
    let mockSocket: any

    beforeEach(() => {
      mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
        connected: true
      }
      
      const { io } = require('socket.io-client')
      io.mockReturnValue(mockSocket)
    })

    it('should handle transaction updates', async () => {
      const TestComponent = () => {
        const { notifications } = useWebSocket()
        return <div>Notifications: {notifications.length}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )

      // Simulate receiving a transaction update
      const transactionUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'transaction_update'
      )?.[1]

      if (transactionUpdateHandler) {
        const mockMessage = {
          type: 'transaction_update',
          data: { status: 'completed' },
          timestamp: new Date().toISOString()
        }
        
        transactionUpdateHandler(mockMessage)
        
        await waitFor(() => {
          expect(screen.getByText('Notifications: 1')).toBeInTheDocument()
        })
      }
    })

    it('should limit notifications to 50 items', async () => {
      const TestComponent = () => {
        const { notifications } = useWebSocket()
        return <div>Notifications: {notifications.length}</div>
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )

      const transactionUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'transaction_update'
      )?.[1]

      if (transactionUpdateHandler) {
        // Add 60 notifications
        for (let i = 0; i < 60; i++) {
          const mockMessage = {
            type: 'transaction_update',
            data: { status: 'completed', id: i },
            timestamp: new Date().toISOString()
          }
          transactionUpdateHandler(mockMessage)
        }
        
        await waitFor(() => {
          expect(screen.getByText('Notifications: 50')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Connection Management', () => {
    let mockSocket: any

    beforeEach(() => {
      mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
        connected: true
      }
      
      const { io } = require('socket.io-client')
      io.mockReturnValue(mockSocket)
    })

    it('should handle connection events', () => {
      render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      )

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
    })

    it('should handle message events', () => {
      render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      )

      expect(mockSocket.on).toHaveBeenCalledWith('transaction_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('bid_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('sale_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('minting_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('notification', expect.any(Function))
    })
  })

  describe('Authentication', () => {
    let mockSocket: any

    beforeEach(() => {
      mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
        connected: true
      }
      
      const { io } = require('socket.io-client')
      io.mockReturnValue(mockSocket)
    })

    it('should handle authentication responses', () => {
      render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      )

      expect(mockSocket.on).toHaveBeenCalledWith('authenticated', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('authentication_error', expect.any(Function))
    })
  })

  describe('Subscription Management', () => {
    let mockSocket: any

    beforeEach(() => {
      mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
        connected: true
      }
      
      const { io } = require('socket.io-client')
      io.mockReturnValue(mockSocket)
    })

    it('should emit subscription events', () => {
      const TestComponent = () => {
        const { subscribeToArtwork, unsubscribeFromArtwork } = useWebSocket()
        
        const handleSubscribe = () => subscribeToArtwork('test-artwork')
        const handleUnsubscribe = () => unsubscribeFromArtwork('test-artwork')
        
        return (
          <div>
            <button onClick={handleSubscribe}>Subscribe</button>
            <button onClick={handleUnsubscribe}>Unsubscribe</button>
          </div>
        )
      }

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      )

      fireEvent.click(screen.getByText('Subscribe'))
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_artwork', 'test-artwork')

      fireEvent.click(screen.getByText('Unsubscribe'))
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_artwork', 'test-artwork')
    })
  })
})
