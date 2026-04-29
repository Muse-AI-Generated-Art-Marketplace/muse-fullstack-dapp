import React, { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Clock, DollarSign, Palette } from 'lucide-react'
import { useWebSocket, WebSocketMessage } from '@/contexts/WebSocketContext'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItemProps {
  message: WebSocketMessage
  onDismiss: (id: string) => void
}

function NotificationItem({ message, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const getIcon = () => {
    switch (message.type) {
      case 'transaction_update':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'bid_update':
        return <DollarSign className="w-5 h-5 text-green-500" />
      case 'sale_update':
        return <CheckCircle className="w-5 h-5 text-purple-500" />
      case 'minting_update':
        return <Palette className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    const status = message.data?.status
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      case 'processing':
        return 'border-blue-200 bg-blue-50'
      case 'pending':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getTitle = () => {
    switch (message.type) {
      case 'transaction_update':
        return 'Transaction Update'
      case 'bid_update':
        return 'New Bid'
      case 'sale_update':
        return 'Sale Update'
      case 'minting_update':
        return 'Minting Update'
      default:
        return 'Notification'
    }
  }

  const getDescription = () => {
    const { data } = message
    
    switch (message.type) {
      case 'transaction_update':
        return `Transaction ${data.hash?.slice(0, 8)}... is now ${data.status}`
      case 'bid_update':
        return `New bid of ${data.price} ${data.currency} on artwork`
      case 'sale_update':
        return `Artwork sold for ${data.price} ${data.currency}`
      case 'minting_update':
        return `Artwork minting status: ${data.status}`
      default:
        return data.message || 'New update available'
    }
  }

  return (
    <div
      className={`
        border rounded-lg p-4 mb-2 transition-all duration-300 transform
        ${getStatusColor()}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {getTitle()}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {getDescription()}
            </p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </span>
              {message.data?.status && (
                <span className="ml-2 px-2 py-1 rounded-full bg-white text-gray-600">
                  {message.data.status}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDismiss(`${message.type}-${message.timestamp}`)}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function RealTimeNotifications() {
  const { notifications, clearNotifications, isConnected } = useWebSocket()
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Update unread count when new notifications arrive
    const newNotifications = notifications.filter(
      n => !dismissedNotifications.has(`${n.type}-${n.timestamp}`)
    )
    setUnreadCount(newNotifications.length)
  }, [notifications, dismissedNotifications])

  const handleDismiss = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]))
  }

  const handleClearAll = () => {
    clearNotifications()
    setDismissedNotifications(new Set())
  }

  const activeNotifications = notifications.filter(
    n => !dismissedNotifications.has(`${n.type}-${n.timestamp}`)
  )

  if (activeNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Notification Bell */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-2 text-right">
        <span className={`text-xs px-2 py-1 rounded-full ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              Real-Time Updates
            </h3>
            <div className="flex space-x-2">
              {activeNotifications.length > 1 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {activeNotifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">
                No new notifications
              </p>
            ) : (
              activeNotifications.map((notification) => (
                <NotificationItem
                  key={`${notification.type}-${notification.timestamp}`}
                  message={notification}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
