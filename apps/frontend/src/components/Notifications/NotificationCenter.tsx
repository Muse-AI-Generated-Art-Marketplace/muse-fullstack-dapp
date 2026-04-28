import React, { useState } from 'react'
import { Bell, X, Check, CheckCircle, AlertCircle, AlertTriangle, Info, TrendingUp, ShoppingCart, DollarSign, UserPlus, Settings, Trash2, Filter } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type']>('all')

  if (!isOpen) return null

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    return notification.type === filter
  })

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'bid':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-green-500" />
      case 'sale':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'mint':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
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

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
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

  const formatTimestamp = (date: Date): string => {
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.action) {
      notification.action.onClick()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({unreadCount} unread)
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1 text-xs rounded-full transition-colors',
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-3 py-1 text-xs rounded-full transition-colors',
                  filter === 'unread'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                Unread
              </button>
              {['bid', 'purchase', 'sale', 'mint', 'follow', 'system'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-colors capitalize',
                    filter === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Mark all as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={notifications.length === 0}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Clear all
            </Button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <Bell className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-center">
                  {filter === 'unread' 
                    ? 'No unread notifications' 
                    : 'No notifications'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4',
                      getBorderColor(notification.type),
                      getBgColor(notification.type),
                      !notification.read && 'bg-opacity-50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                              {!notification.read && (
                                <span className="ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full" />
                              )}
                            </h4>
                            <p className="mt-1 text-sm text-gray-700">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  notification.action!.onClick()
                                }}
                                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                              >
                                {notification.action.label}
                              </button>
                            )}
                            <div className="mt-1 text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
