import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, XCircle, Loader } from 'lucide-react'
import { useWebSocket, useTransactionUpdates } from '@/contexts/WebSocketContext'

interface TransactionStatusIndicatorProps {
  transactionId?: string
  artworkId?: string
  userAddress?: string
  showOnlyRelevant?: boolean
}

interface TransactionStatus {
  id: string
  hash: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  type: 'mint' | 'sale' | 'transfer' | 'bid' | 'cancel'
  timestamp: string
  price?: string
  currency?: string
  failureReason?: string
}

export function TransactionStatusIndicator({
  transactionId,
  artworkId,
  userAddress,
  showOnlyRelevant = true
}: TransactionStatusIndicatorProps) {
  const { transactionUpdates } = useTransactionUpdates()
  const [relevantTransactions, setRelevantTransactions] = useState<TransactionStatus[]>([])

  useEffect(() => {
    // Filter transactions based on props
    const filtered = transactionUpdates
      .map(update => update.data as TransactionStatus)
      .filter(transaction => {
        if (!transaction) return false
        
        // If specific transaction ID is provided, only show that one
        if (transactionId && transaction.id !== transactionId) {
          return false
        }
        
        // If artwork ID is provided, only show transactions for that artwork
        if (artworkId && transaction.artworkId !== artworkId) {
          return false
        }
        
        // If user address is provided, only show transactions for that user
        if (userAddress && transaction.from !== userAddress && transaction.to !== userAddress) {
          return false
        }
        
        return true
      })
      .slice(0, 5) // Show only the 5 most recent
    
    setRelevantTransactions(filtered)
  }, [transactionUpdates, transactionId, artworkId, userAddress])

  if (relevantTransactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {relevantTransactions.map((transaction) => (
        <TransactionStatusCard
          key={`${transaction.id}-${transaction.timestamp}`}
          transaction={transaction}
        />
      ))}
    </div>
  )
}

interface TransactionStatusCardProps {
  transaction: TransactionStatus
}

function TransactionStatusCard({ transaction }: TransactionStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'processing':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      case 'completed':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'failed':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'cancelled':
        return 'border-gray-200 bg-gray-50 text-gray-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  const getTypeLabel = () => {
    switch (transaction.type) {
      case 'mint':
        return 'Minting'
      case 'sale':
        return 'Sale'
      case 'transfer':
        return 'Transfer'
      case 'bid':
        return 'Bid'
      case 'cancel':
        return 'Cancellation'
      default:
        return 'Transaction'
    }
  }

  return (
    <div
      className={`
        border rounded-lg p-3 cursor-pointer transition-all duration-200
        hover:shadow-md ${getStatusColor()}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <span className="text-sm font-medium capitalize">
              {getTypeLabel()}
            </span>
            <span className="text-xs ml-2 opacity-75">
              {transaction.hash?.slice(0, 8)}...
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium capitalize">
            {transaction.status}
          </span>
          {transaction.price && (
            <span className="text-xs">
              {transaction.price} {transaction.currency}
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="text-xs space-y-1">
            <div>
              <strong>Transaction Hash:</strong> {transaction.hash}
            </div>
            <div>
              <strong>Status:</strong> {transaction.status}
            </div>
            <div>
              <strong>Type:</strong> {transaction.type}
            </div>
            {transaction.price && (
              <div>
                <strong>Amount:</strong> {transaction.price} {transaction.currency}
              </div>
            )}
            {transaction.failureReason && (
              <div className="text-red-600">
                <strong>Failure Reason:</strong> {transaction.failureReason}
              </div>
            )}
            <div>
              <strong>Updated:</strong> {new Date(transaction.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for specific transaction monitoring
export function useTransactionStatus(transactionId?: string) {
  const { transactionUpdates } = useTransactionUpdates()
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null)

  useEffect(() => {
    if (!transactionId) return

    const transaction = transactionUpdates
      .map(update => update.data as TransactionStatus)
      .find(t => t?.id === transactionId)

    if (transaction) {
      setTransactionStatus(transaction)
    }
  }, [transactionUpdates, transactionId])

  return transactionStatus
}

// Component for artwork-specific transaction updates
export function ArtworkTransactionUpdates({ artworkId }: { artworkId: string }) {
  return (
    <TransactionStatusIndicator
      artworkId={artworkId}
      showOnlyRelevant={true}
    />
  )
}

// Component for user-specific transaction updates
export function UserTransactionUpdates({ userAddress }: { userAddress: string }) {
  return (
    <TransactionStatusIndicator
      userAddress={userAddress}
      showOnlyRelevant={true}
    />
  )
}
