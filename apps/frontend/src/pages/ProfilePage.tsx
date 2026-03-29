import { useState, type ReactNode } from 'react'
import { Settings, Heart, ShoppingBag, Library, Clock3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Grid } from '@/components/layout/Grid'
import { ArtworkCard } from '@/components/artwork/ArtworkCard'
import { ArtworkCardSkeleton } from '@/components/ArtworkCardSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useUserProfile, useUserArtworks, useUserCollection, useUserTransactions } from '@/services/artworkService'
import { useStellar } from '@/hooks/useStellar'
import { useFavorites } from '@/hooks/useFavorites'
import { useErrorContext } from '@/contexts/ErrorContext'
import { ErrorHandler } from '@/utils/errorHandler'
import { Artwork } from '@/types'

type ActiveTab = 'created' | 'collection' | 'favorites' | 'activity'

const activityLabel: Record<string, string> = {
  minted: 'Minted',
  purchased: 'Purchased',
  sold: 'Sold',
  favorite: 'Favorited',
}

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('created')
  const { showError } = useErrorContext()

  const { account } = useStellar()
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile()
  const userAddress = account.publicKey || profile?.address || ''

  const { data: artworks, isLoading: artworksLoading, error: artworksError, refetch: refetchArtworks } = useUserArtworks(userAddress)
  const { data: collection, isLoading: collectionLoading, error: collectionError, refetch: refetchCollection } = useUserCollection(userAddress)
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useUserTransactions(userAddress)
  const { favorites, isLoading: favoritesLoading, toggleFavorite, error: favoritesError, refreshFavorites } = useFavorites()

  const pageError = profileError || artworksError || collectionError || transactionsError || favoritesError

  const displayAddress = userAddress || '—'
  const displayName = profile?.username || 'Artist'

  const stats = {
    created: profile?.stats.created ?? artworks?.length ?? 0,
    collected: profile?.stats.collected ?? collection?.length ?? 0,
    favorites: profile?.stats.favorites ?? favorites.length,
    totalSales: profile?.stats.totalSales ?? '0 XLM',
    totalPurchases: profile?.stats.totalPurchases ?? '0 XLM',
  }

  const handleFavorite = async (artwork: Artwork) => {
    try {
      if (!account.isConnected || !account.publicKey) {
        showError('Please connect your wallet to manage favorites.')
        return
      }

      const isCurrentlyFavorite = favorites.some(fav => fav.id === artwork.id)
      await toggleFavorite(artwork.id, isCurrentlyFavorite)
    } catch (error) {
      showError(error)
    }
  }

  const handleRetryAll = async () => {
    await Promise.all([
      refetchProfile(),
      refetchArtworks(),
      refetchCollection(),
      refetchTransactions(),
      refreshFavorites(),
    ])
  }

  const shortAddress =
    displayAddress.length > 12
      ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
      : displayAddress

  const tabs: Array<{ id: ActiveTab; label: string; icon: ReactNode }> = [
    { id: 'created', label: 'Created', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'collection', label: 'Collection', icon: <Library className="h-4 w-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity', icon: <Clock3 className="h-4 w-4" /> },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Profile' },
      ]} />
      {pageError && (
        <ErrorDisplay
          error={ErrorHandler.handle(pageError)}
          onRetry={handleRetryAll}
          showRetry
          showDismiss={false}
          className="mb-4"
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card padding="lg" className="text-center px-4">
            <div className=" w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden  ">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl">🎨</span>
              )}
            </div>

            {profileLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-5 bg-secondary-200 rounded w-32 mx-auto" />
                <div className="h-4 bg-secondary-100 rounded w-24 mx-auto" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-secondary-900">{displayName}</h2>
                <p className="text-secondary-600 mb-2 text-sm font-mono">{shortAddress}</p>
                <p className="text-xs text-secondary-500 mb-4">{profile?.bio}</p>
              </>
            )}

            <div className="space-y-2 text-sm  ">
              <div className="flex justify-between">
                <span className="text-secondary-600">Created</span>
                <span className="font-medium">{profileLoading ? '—' : stats.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Collected</span>
                <span className="font-medium">{profileLoading ? '—' : stats.collected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Favorites</span>
                <span className="font-medium">{profileLoading ? '—' : stats.favorites}</span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-primary-50 border border-primary-100 text-left">
              <p className="text-xs text-primary-700 flex items-center gap-1 mb-1"><Sparkles className="h-3 w-3" /> Portfolio Volume</p>
              <p className="text-sm text-secondary-900">Sales: {stats.totalSales}</p>
              <p className="text-sm text-secondary-900">Purchases: {stats.totalPurchases}</p>
            </div>

            <div className="mt-6 space-y-2">
              <Button variant="outline" size="md" fullWidth>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-6 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center space-x-2 font-medium pb-1 border-b-2 transition-colors ${activeTab === tab.id
                      ? 'text-primary-600 border-primary-600'
                      : 'text-secondary-600 border-transparent'
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'created' && (
              artworksLoading ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {Array.from({ length: 6 }).map((_, i) => <ArtworkCardSkeleton key={i} />)}
                </Grid>
              ) : artworks && artworks.length > 0 ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {artworks.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} variant="default" showPrice showCreator={false} onFavorite={handleFavorite} />
                  ))}
                </Grid>
              ) : <EmptyState type="no-artworks" />
            )}

            {activeTab === 'collection' && (
              collectionLoading ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {Array.from({ length: 6 }).map((_, i) => <ArtworkCardSkeleton key={i} />)}
                </Grid>
              ) : collection && collection.length > 0 ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {collection.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} variant="default" showPrice showCreator onFavorite={handleFavorite} />
                  ))}
                </Grid>
              ) : <EmptyState type="no-artworks" />
            )}

            {activeTab === 'favorites' && (
              favoritesLoading ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {Array.from({ length: 6 }).map((_, i) => <ArtworkCardSkeleton key={i} />)}
                </Grid>
              ) : favorites && favorites.length > 0 ? (
                <Grid columns={3} gap="md" responsive={false}>
                  {favorites.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} variant="default" showPrice showCreator={false} onFavorite={handleFavorite} />
                  ))}
                </Grid>
              ) : <EmptyState type="no-favorites" />
            )}

            {activeTab === 'activity' && (
              <Card padding="lg">
                {transactionsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 bg-secondary-100 rounded" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((entry) => (
                      <div key={entry.id} className="p-3 border border-secondary-100 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-secondary-900">{activityLabel[entry.type] || entry.type}: {entry.artworkTitle}</p>
                          <p className="text-xs text-secondary-500">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-sm font-semibold text-primary-700">{entry.amount || '—'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-600 text-sm">No transaction history yet.</p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
