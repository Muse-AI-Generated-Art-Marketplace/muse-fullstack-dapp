import { useState, useEffect, useCallback } from 'react'
import { Artwork } from '@/types'
import { favoriteService } from '@/services/favoriteService'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { useStellar } from './useStellar'

interface UseFavoritesReturn {
  favorites: Artwork[]
  isLoading: boolean
  isChecking: boolean
  error: AppError | null
  totalCount: number
  addFavorite: (artworkId: string) => Promise<void>
  removeFavorite: (artworkId: string) => Promise<void>
  toggleFavorite: (artworkId: string, isCurrentlyFavorite: boolean) => Promise<boolean>
  isFavorite: (artworkId: string) => Promise<boolean>
  refreshFavorites: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const { account } = useStellar()

  // Load favorites when user connects
  useEffect(() => {
    if (!account.isConnected || !account.publicKey) {
      setFavorites([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    loadFavorites(account.publicKey)
  }, [account.isConnected, account.publicKey])

  const loadFavorites = async (userAddress: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await favoriteService.getUserFavorites(userAddress, 1, 50)
      setFavorites(response.data)
      setTotalCount(response.pagination.total)
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      console.error('Failed to load favorites:', appError.userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshFavorites = useCallback(async () => {
    if (!account.isConnected || !account.publicKey) return
    
    try {
      const response = await favoriteService.getUserFavorites(account.publicKey, 1, 50)
      setFavorites(response.data)
      setTotalCount(response.pagination.total)
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      console.error('Failed to refresh favorites:', appError.userMessage)
    }
  }, [account.isConnected, account.publicKey])

  const addFavorite = useCallback(async (artworkId: string) => {
    if (!account.isConnected || !account.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      const artwork = await favoriteService.addFavorite(artworkId, account.publicKey)
      setFavorites((prev) => [artwork, ...prev])
      setTotalCount((prev) => prev + 1)
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      throw appError
    }
  }, [account.isConnected, account.publicKey])

  const removeFavorite = useCallback(async (artworkId: string) => {
    if (!account.isConnected || !account.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      await favoriteService.removeFavorite(artworkId, account.publicKey)
      setFavorites((prev) => prev.filter((fav) => fav.id !== artworkId))
      setTotalCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      throw appError
    }
  }, [account.isConnected, account.publicKey])

  const toggleFavorite = useCallback(async (
    artworkId: string,
    isCurrentlyFavorite: boolean
  ): Promise<boolean> => {
    if (!account.isConnected || !account.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await favoriteService.toggleFavorite(
        artworkId,
        account.publicKey,
        isCurrentlyFavorite
      )
      
      if (result.isFavorite && result.artwork) {
        setFavorites((prev) => [result.artwork!, ...prev])
        setTotalCount((prev) => prev + 1)
      } else {
        setFavorites((prev) => prev.filter((fav) => fav.id !== artworkId))
        setTotalCount((prev) => Math.max(0, prev - 1))
      }
      
      return result.isFavorite
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      throw appError
    }
  }, [account.isConnected, account.publicKey])

  const isFavorite = useCallback(async (artworkId: string): Promise<boolean> => {
    if (!account.isConnected || !account.publicKey) {
      return false
    }

    try {
      setIsChecking(true)
      return await favoriteService.checkFavorite(artworkId, account.publicKey)
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(appError)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [account.isConnected, account.publicKey])

  return {
    favorites,
    isLoading,
    isChecking,
    error,
    totalCount,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  }
}

export default useFavorites
