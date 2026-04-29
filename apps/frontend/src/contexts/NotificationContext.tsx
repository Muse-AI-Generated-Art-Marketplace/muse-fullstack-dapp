import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'bid' | 'purchase' | 'sale' | 'mint' | 'follow' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: {
    transactionHash?: string
    artworkId?: string
    userId?: string
    amount?: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  showToast: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('muse_notifications')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('muse_notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove toast notifications after 5 seconds for certain types
    if (['success', 'error', 'warning', 'info'].includes(notification.type)) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }

    // Show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      })
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem('muse_notifications')
  }

  const showToast = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    addNotification(notification)
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      showToast
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
