import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { NotificationCenter } from './NotificationCenter'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen)
  }

  const closeNotificationCenter = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleNotificationCenter}
        className="relative h-8 w-8 p-0"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={closeNotificationCenter}
      />
    </>
  )
}
