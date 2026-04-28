import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketMessage {
  type: 'transaction_update' | 'bid_update' | 'sale_update' | 'minting_update' | 'notification'
  data: any
  timestamp: string
  userId?: string
  artworkId?: string
}

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  subscribeToArtwork: (artworkId: string) => void
  unsubscribeFromArtwork: (artworkId: string) => void
  subscribeToUserTransactions: (userKey: string) => void
  sendNotification: (notification: any) => void
  notifications: WebSocketMessage[]
  clearNotifications: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000
    })

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Handle real-time updates
    newSocket.on('transaction_update', (message: WebSocketMessage) => {
      console.log('Transaction update received:', message)
      setNotifications(prev => [message, ...prev].slice(0, 50)) // Keep only last 50 notifications
    })

    newSocket.on('bid_update', (message: WebSocketMessage) => {
      console.log('Bid update received:', message)
      setNotifications(prev => [message, ...prev].slice(0, 50))
    })

    newSocket.on('sale_update', (message: WebSocketMessage) => {
      console.log('Sale update received:', message)
      setNotifications(prev => [message, ...prev].slice(0, 50))
    })

    newSocket.on('minting_update', (message: WebSocketMessage) => {
      console.log('Minting update received:', message)
      setNotifications(prev => [message, ...prev].slice(0, 50))
    })

    newSocket.on('notification', (message: WebSocketMessage) => {
      console.log('Notification received:', message)
      setNotifications(prev => [message, ...prev].slice(0, 50))
    })

    // Handle authentication responses
    newSocket.on('authenticated', (response) => {
      console.log('WebSocket authenticated:', response)
    })

    newSocket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error)
    })

    // Handle subscription responses
    newSocket.on('subscribed', (response) => {
      console.log('Subscribed to:', response)
    })

    newSocket.on('unsubscribed', (response) => {
      console.log('Unsubscribed from:', response)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const subscribeToArtwork = (artworkId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_artwork', artworkId)
    }
  }

  const unsubscribeFromArtwork = (artworkId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_artwork', artworkId)
    }
  }

  const subscribeToUserTransactions = (userKey: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_user_transactions', userKey)
    }
  }

  const sendNotification = (notification: any) => {
    if (socket && isConnected) {
      socket.emit('send_notification', notification)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribeToArtwork,
    unsubscribeFromArtwork,
    subscribeToUserTransactions,
    sendNotification,
    notifications,
    clearNotifications
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

// Hook for authentication
export function useWebSocketAuth() {
  const { socket, isConnected } = useWebSocket()

  const authenticate = (userData: { userId?: string; address?: string }) => {
    if (socket && isConnected) {
      socket.emit('authenticate', userData)
    }
  }

  return { authenticate }
}

// Hook for transaction updates
export function useTransactionUpdates() {
  const { notifications } = useWebSocket()
  
  const transactionUpdates = notifications.filter(
    notification => notification.type === 'transaction_update'
  )

  return { transactionUpdates }
}

// Hook for bid updates
export function useBidUpdates() {
  const { notifications } = useWebSocket()
  
  const bidUpdates = notifications.filter(
    notification => notification.type === 'bid_update'
  )

  return { bidUpdates }
}

// Hook for sale updates
export function useSaleUpdates() {
  const { notifications } = useWebSocket()
  
  const saleUpdates = notifications.filter(
    notification => notification.type === 'sale_update'
  )

  return { saleUpdates }
}

// Hook for minting updates
export function useMintingUpdates() {
  const { notifications } = useWebSocket()
  
  const mintingUpdates = notifications.filter(
    notification => notification.type === 'minting_update'
  )

  return { mintingUpdates }
}
