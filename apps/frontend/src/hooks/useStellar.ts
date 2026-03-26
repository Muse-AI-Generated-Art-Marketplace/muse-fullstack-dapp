import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type React from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { StellarAccount, StellarTransaction } from '@/types'

export interface FreighterWalletState {
  isConnected: boolean
  isInstalled: boolean
  isAllowed: boolean
  publicKey: string
}

export interface UseStellarReturn {
  account: StellarAccount
  isLoading: boolean
  network: 'testnet' | 'mainnet'
  server: StellarSdk.SorobanRpc.Server
  freighterState: FreighterWalletState
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>
  sendTransaction: (transaction: StellarSdk.Transaction) => Promise<StellarTransaction>
  createContractCall: (contractId: string, method: string, params?: unknown[]) => StellarSdk.xdr.ScVal[]
  refreshBalance: () => Promise<void>
  setNetwork: (network: 'testnet' | 'mainnet') => void
  checkFreighterInstalled: () => Promise<boolean>
  openFreighterDownload: () => void
}

// Context for global wallet state
interface StellarContextType {
  account: StellarAccount
  network: 'testnet' | 'mainnet'
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  setNetwork: (network: 'testnet' | 'mainnet') => void
}

const StellarContext = createContext<StellarContextType | null>(null)

export const useStellarContext = () => {
  const context = useContext(StellarContext)
  if (!context) {
    throw new Error('useStellarContext must be used within a StellarProvider')
  }
  return context
}

// Freighter API interface
interface FreighterAPI {
  isConnected: () => Promise<boolean>
  getPublicKey: () => Promise<{ publicKey?: string; error?: string }>
  signTransaction: (xdr: string, opts: { networkPassphrase: string }) => Promise<string | null>
}

declare global {
  interface Window {
    freighter?: FreighterAPI
  }
}

// Check if Freighter extension is installed
const checkFreighterInstalled = async (): Promise<boolean> => {
  try {
    if (!window.freighter) {
      return false
    }
    const isConnected = await window.freighter.isConnected()
    return isConnected
  } catch {
    return false
  }
}

// Check if Freighter is allowed (user has approved the application)
const checkFreighterAllowed = async (): Promise<boolean> => {
  try {
    if (!window.freighter) {
      return false
    }
    const result = await window.freighter.getPublicKey()
    return !!result.publicKey
  } catch {
    return false
  }
}

// Get public key from Freighter
const getFreighterPublicKey = async (): Promise<string | null> => {
  try {
    if (!window.freighter) {
      return null
    }
    const result = await window.freighter.getPublicKey()
    return result.publicKey || null
  } catch {
    return null
  }
}

export function useStellar(): UseStellarReturn {
  const [account, setAccount] = useState<StellarAccount>({
    publicKey: '',
    isConnected: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')
  const [freighterState, setFreighterState] = useState<FreighterWalletState>({
    isConnected: false,
    isInstalled: false,
    isAllowed: false,
    publicKey: '',
  })

  const server = new StellarSdk.SorobanRpc.Server(
    network === 'testnet' 
      ? 'https://soroban-testnet.stellar.org'
      : 'https://soroban.stellar.org'
  )

  // Check Freighter installation status
  const checkFreighterInstalledFn = useCallback(async (): Promise<boolean> => {
    try {
      const isInstalled = await checkFreighterInstalled()
      setFreighterState((prev: FreighterWalletState) => ({ ...prev, isInstalled }))
      return isInstalled
    } catch {
      setFreighterState((prev: FreighterWalletState) => ({ ...prev, isInstalled: false }))
      return false
    }
  }, [])

  // Open Freighter download page
  const openFreighterDownload = useCallback(() => {
    window.open('https://www.freighter.app/', '_blank', 'noopener,noreferrer')
  }, [])

  // Connect to Freighter wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true)
    try {
      // First check if Freighter is installed
      const isInstalled = await checkFreighterInstalled()
      if (!isInstalled) {
        throw ErrorHandler.handle({
          code: 'WALLET_NOT_INSTALLED',
          message: 'Freighter wallet is not installed',
          userMessage: 'Freighter wallet is not installed. Please install the Freighter extension from your browser extension store.',
          isRecoverable: true,
        })
      }

      // Check if Freighter is allowed
      const isAllowed = await checkFreighterAllowed()
      if (!isAllowed) {
        throw ErrorHandler.handle({
          code: 'WALLET_NOT_ALLOWED',
          message: 'Freighter wallet has not authorized this application',
          userMessage: 'Please allow access to Freighter wallet when prompted, or manually add this application in Freighter settings.',
          isRecoverable: true,
        })
      }

      // Get public key from Freighter
      const publicKey = await getFreighterPublicKey()
      
      if (publicKey) {
        setAccount({
          publicKey,
          isConnected: true,
        })
        setFreighterState({
          isConnected: true,
          isInstalled: true,
          isAllowed: true,
          publicKey,
        })

        // Get account balance
        try {
          const accountObj = await server.getAccount(publicKey)
          const balance = accountObj.balances.find(
            (b: { asset_type: string }) => b.asset_type === 'native'
          )?.balance || '0'
          
          setAccount((prev: StellarAccount) => ({
            ...prev,
            balance,
          }))
        } catch (balanceError) {
          const appError = ErrorHandler.handle(balanceError)
          console.error('Failed to fetch balance:', appError.userMessage)
        }
      } else {
        throw ErrorHandler.handle({
          code: 'WALLET_CONNECTION_FAILED',
          message: 'Failed to get public key from wallet',
          userMessage: 'Failed to connect to Freighter wallet. Please try again and make sure to approve the connection request in Freighter.',
          isRecoverable: true,
        })
      }
    } catch (error) {
      const appError = error instanceof AppError ? error : ErrorHandler.handle(error)
      console.error('Failed to connect wallet:', appError.userMessage)
      
      setAccount({
        publicKey: '',
        isConnected: false,
      })
      
      throw appError
    } finally {
      setIsLoading(false)
    }
  }, [server])

  const disconnectWallet = useCallback(() => {
    setAccount({
      publicKey: '',
      isConnected: false,
      balance: undefined,
    })
    setFreighterState((prev: FreighterWalletState) => ({
      ...prev,
      isConnected: false,
      publicKey: '',
    }))
  }, [])

  const signTransaction = useCallback(async (
    xdr: string,
    networkPassphrase: string
  ): Promise<string> => {
    try {
      if (!xdr || xdr.trim() === '') {
        throw new Error('Transaction XDR is required')
      }
      
      if (!networkPassphrase || networkPassphrase.trim() === '') {
        throw new Error('Network passphrase is required')
      }

      if (!account.isConnected) {
        throw ErrorHandler.handle({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Wallet is not connected',
          userMessage: 'Please connect your Freighter wallet before signing transactions.',
          isRecoverable: true,
        })
      }

      if (!window.freighter) {
        throw ErrorHandler.handle({
          code: 'WALLET_NOT_INSTALLED',
          message: 'Freighter wallet is not installed',
          userMessage: 'Freighter wallet is not installed. Please install the Freighter extension.',
          isRecoverable: true,
        })
      }
      
      const result = await window.freighter.signTransaction(xdr, {
        networkPassphrase,
      })
      
      if (!result) {
        throw ErrorHandler.handle({
          code: 'SIGNATURE_FAILED',
          message: 'No signature returned from wallet',
          userMessage: 'Transaction signing was rejected or failed. Please try again.',
          isRecoverable: true,
        })
      }
      
      return result
    } catch (error) {
      const appError = error instanceof AppError ? error : ErrorHandler.handle(error)
      console.error('Failed to sign transaction:', appError.userMessage)
      throw appError
    }
  }, [account.isConnected])

  const sendTransaction = useCallback(async (
    transaction: StellarSdk.Transaction
  ): Promise<StellarTransaction> => {
    try {
      if (!transaction) {
        throw new Error('Transaction is required')
      }
      
      const networkPassphrase = network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC

      const signedXdr = await signTransaction(
        transaction.toXDR(),
        networkPassphrase
      )

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        networkPassphrase
      )

      const result = await server.sendTransaction(signedTransaction)

      if (result.status === 'PENDING') {
        try {
          await Promise.race([
            server.getTransaction(result.hash),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000)
            )
          ])
          
          return {
            hash: result.hash,
            status: 'success',
          }
        } catch (confirmError) {
          const appError = ErrorHandler.handle(confirmError)
          return {
            hash: result.hash,
            status: 'error',
            error: appError
          }
        }
      } else {
        const errorMessage = `Transaction failed: ${result.status}`
        return {
          hash: result.hash,
          status: 'error',
          error: ErrorHandler.handle(new Error(errorMessage))
        }
      }
    } catch (error) {
      const appError = error instanceof AppError ? error : ErrorHandler.handle(error)
      console.error('Failed to send transaction:', appError.userMessage)
      return {
        hash: '',
        status: 'error',
        error: appError
      }
    }
  }, [network, server, signTransaction])

  const createContractCall = useCallback((
    contractId: string,
    method: string,
    params: unknown[] = []
  ): StellarSdk.xdr.ScVal[] => {
    const contract = new StellarSdk.Contract(contractId)
    const scVals = params.map((param: unknown) => {
      if (typeof param === 'string') {
        return StellarSdk.xdr.ScVal.scvString(param)
      } else if (typeof param === 'number') {
        return StellarSdk.xdr.ScVal.scvI32(param)
      }
      return param as StellarSdk.xdr.ScVal
    })
    return scVals
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!account.isConnected || !account.publicKey) {
      const error = ErrorHandler.handle(new Error('Wallet not connected'))
      console.warn('Cannot refresh balance:', error.userMessage)
      return
    }

    try {
      const accountObj = await server.getAccount(account.publicKey)
      const balance = accountObj.balances.find(
        (b: { asset_type: string }) => b.asset_type === 'native'
      )?.balance || '0'
      
      setAccount((prev: StellarAccount) => ({
        ...prev,
        balance,
      }))
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to refresh balance:', appError.userMessage)
    }
  }, [account.isConnected, account.publicKey, server])

  // Initialize on mount - check for existing Freighter connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const isInstalled = await checkFreighterInstalled()
        
        if (isInstalled) {
          const publicKey = await getFreighterPublicKey()
          if (publicKey) {
            setAccount({
              publicKey,
              isConnected: true,
            })
            setFreighterState({
              isConnected: true,
              isInstalled: true,
              isAllowed: true,
              publicKey,
            })
            refreshBalance()
          }
        } else {
          setFreighterState((prev: FreighterWalletState) => ({
            ...prev,
            isInstalled: false,
          }))
        }
      } catch {
        console.log('Freighter wallet not available')
      }
    }

    initializeConnection()
  }, [refreshBalance])

  return {
    account,
    isLoading,
    network,
    server,
    freighterState,
    connectWallet,
    disconnectWallet,
    signTransaction,
    sendTransaction,
    createContractCall,
    refreshBalance,
    setNetwork,
    checkFreighterInstalled: checkFreighterInstalledFn,
    openFreighterDownload,
  }
}

// Provider component for global wallet state
export function StellarProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const stellar = useStellar()
  
  const contextValue: StellarContextType = {
    account: stellar.account,
    network: stellar.network,
    connectWallet: stellar.connectWallet,
    disconnectWallet: stellar.disconnectWallet,
    setNetwork: stellar.setNetwork,
  }

  return (
    <StellarContext.Provider value={contextValue}>
      {children}
    </StellarContext.Provider>
  )
}
