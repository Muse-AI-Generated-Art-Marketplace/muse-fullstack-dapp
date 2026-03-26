// Freighter Wallet API Type Declarations

interface FreighterIsConnectedResponse {
  isConnected: boolean
}

interface FreighterGetPublicKeyResponse {
  publicKey?: string
  error?: string
}

interface FreighterSignTransactionOptions {
  networkPassphrase: string
  address?: string
}

interface FreighterAPI {
  /**
   * Check if Freighter is connected
   */
  isConnected: () => Promise<boolean>
  
  /**
   * Get the public key of the connected wallet
   */
  getPublicKey: () => Promise<FreighterGetPublicKeyResponse>
  
  /**
   * Sign a transaction with the connected wallet
   * @param xdr - The base64-encoded XDR representation of the transaction
   * @param opts - Options including network passphrase
   * @returns The signed transaction XDR or null if signing was rejected
   */
  signTransaction: (
    xdr: string, 
    opts: FreighterSignTransactionOptions
  ) => Promise<string | null>
  
  /**
   * Sign and submit a transaction
   * @deprecated Use signTransaction instead and submit separately
   */
  signAndSubmitTransaction?: (
    xdr: string,
    opts: FreighterSignTransactionOptions
  ) => Promise<{ signedTx: string; error?: string }>
  
  /**
   * Get the network the wallet is connected to
   */
  getNetwork?: () => Promise<{ network: string; error?: string }>
  
  /**
   * Get the network details
   */
  getNetworkDetails?: () => Promise<{
    network: string
    networkPassphrase: string
    error?: string
  }>
  
  /**
   * Request permissions to access the wallet
   */
  setAllowed?: () => Promise<{ isAllowed: boolean; error?: string }>
  
  /**
   * Check if the app is allowed to access the wallet
   */
  isAllowed?: () => Promise<{ isAllowed: boolean; error?: string }>
}

interface Window {
  freighter?: FreighterAPI
}

// Custom events for Freighter wallet
interface FreighterEventsMap {
  'freighterAccountChanged': CustomEvent<{ publicKey: string }>
  'freighterDisconnected': CustomEvent<void>
  'freighterNetworkChanged': CustomEvent<{ network: string }>
}

declare global {
  interface Window {
    addEventListener<K extends keyof FreighterEventsMap>(
      type: K,
      listener: (this: Window, ev: FreighterEventsMap[K]) => void
    ): void
    removeEventListener<K extends keyof FreighterEventsMap>(
      type: K,
      listener: (this: Window, ev: FreighterEventsMap[K]) => void
    ): void
  }
}

export {}
