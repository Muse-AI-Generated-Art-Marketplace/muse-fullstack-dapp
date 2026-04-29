import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, TrendingUp, ShoppingCart, DollarSign, UserPlus, Settings } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { cn } from '@/utils/cn'

interface ToastNotificationProps {
  notification: Notification
  onRemove: (id: string) => void
}

function ToastNotification({ notification, onRemove }: ToastNotificationProps) {
  useEffect(() => {
    // Auto-remove after 5 seconds for toast types
    if (['success', 'error', 'warning', 'info'].includes(notification.type)) {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.type, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'bid':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'purchase':
        return <ShoppingCart className="h-5 w-5 text-green-500" />
      case 'sale':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'mint':
        return <CheckCircle className="h-5 w-5 text-purple-500" />
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500'
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
        return 'border-l-blue-500'
      case 'bid':
        return 'border-l-blue-500'
      case 'purchase':
        return 'border-l-green-500'
      case 'sale':
        return 'border-l-green-500'
      case 'mint':
        return 'border-l-purple-500'
      case 'follow':
        return 'border-l-blue-500'
      case 'system':
        return 'border-l-gray-500'
      default:
        return 'border-l-blue-500'
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      case 'warning':
        return 'bg-yellow-50'
      case 'info':
        return 'bg-blue-50'
      case 'bid':
        return 'bg-blue-50'
      case 'purchase':
        return 'bg-green-50'
      case 'sale':
        return 'bg-green-50'
      case 'mint':
        return 'bg-purple-50'
      case 'follow':
        return 'bg-blue-50'
      case 'system':
        return 'bg-gray-50'
      default:
        return 'bg-blue-50'
    }
  }

  return (
    <div
      className={cn(
        'max-w-sm w-full border-l-4 rounded-lg shadow-lg p-4 mb-2 transform transition-all duration-300 ease-in-out animate-in slide-in-from-right',
        getBorderColor(),
        getBgColor()
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-700">
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {notification.action.label}
            </button>
          )}
          <div className="mt-1 text-xs text-gray-500">
            {formatTimestamp(notification.timestamp)}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onRemove(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSecs = Math.floor(diffInMs / 1000)
  const diffInMins = Math.floor(diffInSecs / 60)
  const diffInHours = Math.floor(diffInMins / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSecs < 60) return 'Just now'
  if (diffInMins < 60) return `${diffInMins}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  return `${diffInDays}d ago`
}

export function ToastNotifications() {
  const { notifications, removeNotification } = useNotifications()

  // Only show toast-type notifications
  const toastNotifications = notifications.filter(n => 
    ['success', 'error', 'warning', 'info'].includes(n.type)
  )

  if (toastNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toastNotifications.map(notification => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  )
}
