import { useCallback } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'

export function useNotificationActions() {
  const { showToast } = useNotifications()

  const showSuccess = useCallback((title: string, message: string, action?: { label: string; onClick: () => void }) => {
    showToast({
      type: 'success',
      title,
      message,
      action
    })
  }, [showToast])

  const showError = useCallback((title: string, message: string, action?: { label: string; onClick: () => void }) => {
    showToast({
      type: 'error',
      title,
      message,
      action
    })
  }, [showToast])

  const showWarning = useCallback((title: string, message: string, action?: { label: string; onClick: () => void }) => {
    showToast({
      type: 'warning',
      title,
      message,
      action
    })
  }, [showToast])

  const showInfo = useCallback((title: string, message: string, action?: { label: string; onClick: () => void }) => {
    showToast({
      type: 'info',
      title,
      message,
      action
    })
  }, [showToast])

  const showBidNotification = useCallback((artworkTitle: string, bidAmount: string, bidderName: string) => {
    showToast({
      type: 'bid',
      title: 'New Bid Received',
      message: `${bidderName} bid ${bidAmount} ETH on "${artworkTitle}"`,
      metadata: {
        amount: bidAmount
      }
    })
  }, [showToast])

  const showPurchaseNotification = useCallback((artworkTitle: string, price: string, buyerName: string) => {
    showToast({
      type: 'purchase',
      title: 'Artwork Purchased',
      message: `${buyerName} purchased "${artworkTitle}" for ${price} ETH`,
      metadata: {
        amount: price
      }
    })
  }, [showToast])

  const showSaleNotification = useCallback((artworkTitle: string, price: string, buyerName: string) => {
    showToast({
      type: 'sale',
      title: 'Artwork Sold',
      message: `Your artwork "${artworkTitle}" was sold for ${price} ETH`,
      metadata: {
        amount: price
      }
    })
  }, [showToast])

  const showMintNotification = useCallback((artworkTitle: string) => {
    showToast({
      type: 'mint',
      title: 'Artwork Minted',
      message: `"${artworkTitle}" has been successfully minted`
    })
  }, [showToast])

  const showFollowNotification = useCallback((followerName: string) => {
    showToast({
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`
    })
  }, [showToast])

  const showSystemNotification = useCallback((title: string, message: string) => {
    showToast({
      type: 'system',
      title,
      message
    })
  }, [showToast])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBidNotification,
    showPurchaseNotification,
    showSaleNotification,
    showMintNotification,
    showFollowNotification,
    showSystemNotification
  }
}
