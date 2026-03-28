import { Wallet, Check, Sparkles } from 'lucide-react'
import { TransactionStatus, TransactionStatusType } from '@/components/TransactionStatus'
import type { AppError } from '@/utils/errorHandler'
import type { Metadata } from './MetadataForm'

export interface TransactionSignProps {
  metadata: Metadata
  walletConnected: boolean
  isProcessing: boolean
  transactionStatus: TransactionStatusType
  transactionHash: string | null
  error: AppError | null
  onConnect: () => void
  onSign: () => void
}

export function TransactionSign({
  metadata,
  walletConnected,
  isProcessing,
  transactionStatus,
  transactionHash,
  error,
  onConnect,
  onSign,
}: TransactionSignProps) {
  return (
    <div className="space-y-6">
      {/* Transaction Summary Card */}
      <div className="card p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Transaction Summary</h3>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-secondary-600">Artwork</span>
            <span className="font-medium">{metadata.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-600">Category</span>
            <span className="font-medium">{metadata.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-600">Price</span>
            <span className="font-medium">{metadata.price} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-600">Royalty</span>
            <span className="font-medium">{metadata.royalty}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-600">Minting Fee</span>
            <span className="font-medium">0.01 ETH</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{(parseFloat(metadata.price || '0') + 0.01).toFixed(3)} ETH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet / Sign Actions */}
      {!walletConnected ? (
        <button
          onClick={onConnect}
          disabled={isProcessing}
          className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <Check className="h-5 w-5" />
            <span>Wallet connected</span>
          </div>

          <TransactionStatus
            status={transactionStatus}
            hash={transactionHash}
            error={error?.userMessage}
          />

          {transactionStatus === 'idle' && (
            <button
              onClick={onSign}
              disabled={isProcessing}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Sign &amp; Mint NFT</span>
            </button>
          )}

          {isProcessing && transactionStatus === 'idle' && (
            <button
              disabled
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2 opacity-50"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Processing...</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
