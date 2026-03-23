import { useState, useEffect, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { freighterApi } from '@stellar/freighter-api'
import { ErrorHandler, AppError } from '@/utils/errorHandler'

export interface StellarAccount {
  publicKey: string
  isConnected: boolean
  balance?: string
}

export interface StellarTransaction {
  hash: string
  status: 'pending' | 'success' | 'error'
  error?: AppError | null
}

export function useStellar() {
  const [account, setAccount] = useState<StellarAccount>({
    publicKey: '',
    isConnected: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')

  const server = new StellarSdk.SorobanRpc.Server(
    network === 'testnet' 
      ? 'https://soroban-testnet.stellar.org'
      : 'https://soroban.stellar.org'
  )

  const connectWallet = useCallback(async () => {
    setIsLoading(true)
    try {
      const { publicKey } = await freighterApi.getPublicKey()
      
      if (publicKey) {
        setAccount({
          publicKey,
          isConnected: true,
        })

        // Get account balance
        try {
          const accountObj = await server.getAccount(publicKey)
          const balance = accountObj.balances.find(
            (b: any) => b.asset_type === 'native'
          )?.balance || '0'
          
          setAccount((prev: StellarAccount) => ({
            ...prev,
            balance,
          }))
        } catch (balanceError) {
          const appError = ErrorHandler.handle(balanceError)
          console.error('Failed to fetch balance:', appError.userMessage)
          // Don't throw error for balance fetch failure, just log it
          // Could show a non-critical notification here
        }
      } else {
        throw new Error('No public key returned from wallet')
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to connect wallet:', appError.userMessage)
      
      // Reset connection state
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
    })
  }, [])

  const signTransaction = useCallback(async (
    xdr: string,
    networkPassphrase: string
  ): Promise<string> => {
    try {
      // Validate inputs
      if (!xdr || xdr.trim() === '') {
        throw new Error('Transaction XDR is required')
      }
      
      if (!networkPassphrase || networkPassphrase.trim() === '') {
        throw new Error('Network passphrase is required')
      }
      
      const result = await freighterApi.signTransaction(xdr, networkPassphrase)
      
      if (!result) {
        throw new Error('No signature returned from wallet')
      }
      
      return result
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to sign transaction:', appError.userMessage)
      throw appError
    }
  }, [])

  const sendTransaction = useCallback(async (
    transaction: StellarSdk.Transaction
  ): Promise<StellarTransaction> => {
    try {
      // Validate transaction
      if (!transaction) {
        throw new Error('Transaction is required')
      }
      
      const networkPassphrase = network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC

      // Sign the transaction
      const signedXdr = await signTransaction(
        transaction.toXDR(),
        networkPassphrase
      )

      // Submit the transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        networkPassphrase
      )

      const result = await server.sendTransaction(signedTransaction)

      if (result.status === 'PENDING') {
        // Wait for transaction confirmation with timeout
        try {
          await Promise.race([
            server.getTransaction(result.hash),
            new Promise((_, reject) => 
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
      const appError = ErrorHandler.handle(error)
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
    params: any[] = []
  ) => {
    const contract = new StellarSdk.Contract(contractId)
    return contract.call(method, ...params)
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
        (b: any) => b.asset_type === 'native'
      )?.balance || '0'
      
      setAccount((prev: StellarAccount) => ({
        ...prev,
        balance,
      }))
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to refresh balance:', appError.userMessage)
      // Could trigger a notification here for the user
    }
  }, [account.isConnected, account.publicKey, server])

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        const { publicKey } = await freighterApi.getPublicKey()
        if (publicKey) {
          setAccount({
            publicKey,
            isConnected: true,
          })
          refreshBalance()
        }
      } catch (error) {
        // Wallet not connected
      }
    }

    checkConnection()
  }, [refreshBalance])

  return {
    account,
    isLoading,
    network,
    server,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    createContractCall,
    refreshBalance,
    setNetwork,
  }
}
