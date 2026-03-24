import { useState } from 'react'
import { Wallet, LogOut, Settings } from 'lucide-react'
import { useStellar } from '@/hooks/useStellar'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useErrorContext } from '@/contexts/ErrorContext'
import { AppError } from '@/utils/errorHandler'

export function WalletConnect() {
  const { account, isLoading, connectWallet, disconnectWallet, network, setNetwork } = useStellar()
  const { showError } = useErrorContext()
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const handleConnect = async () => {
    setError(null)
    try {
      await connectWallet()
    } catch (error) {
      const appError = error as AppError
      setError(appError)
      showError(appError)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num < 0.01) {
      return '< 0.01 XLM'
    }
    return `${num.toFixed(2)} XLM`
  }

  return (
    <div className="flex flex-col space-y-2">
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleConnect}
          onDismiss={() => setError(null)}
          showRetry={error.isRecoverable}
        />
      )}
      
      {account.isConnected ? (
        <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            onClick={() => setShowNetworkSwitch(!showNetworkSwitch)}
            className="btn-outline px-3 py-1 text-sm flex items-center space-x-1"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{network === 'testnet' ? 'Testnet' : 'Mainnet'}</span>
            <Settings className="h-3 w-3" />
          </button>
          
          {showNetworkSwitch && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-secondary-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => {
                  setNetwork('testnet')
                  setShowNetworkSwitch(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary-50 ${
                  network === 'testnet' ? 'bg-secondary-100' : ''
                }`}
              >
                Testnet
              </button>
              <button
                onClick={() => {
                  setNetwork('mainnet')
                  setShowNetworkSwitch(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary-50 ${
                  network === 'mainnet' ? 'bg-secondary-100' : ''
                }`}
              >
                Mainnet
              </button>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-secondary-600">
            {account.balance ? formatBalance(account.balance) : 'Loading...'}
          </div>
          <div className="text-xs text-secondary-500">
            {formatAddress(account.publicKey)}
          </div>
        </div>
        
        <button
          onClick={handleDisconnect}
          className="btn-outline p-2"
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="btn-primary flex items-center space-x-2 px-4 py-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Freighter</span>
          </>
        )}
      </button>
    )}
  </div>
  )
}
