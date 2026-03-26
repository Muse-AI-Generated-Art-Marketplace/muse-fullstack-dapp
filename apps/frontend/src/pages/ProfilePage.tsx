import { useState } from 'react'
import { Settings, Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Grid } from '@/components/layout/Grid'
import { ArtworkCard } from '@/components/artwork/ArtworkCard'
import { ArtworkCardSkeleton } from '@/components/ArtworkCardSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useUserProfile, useUserArtworks } from '@/services/artworkService'
import { useStellar } from '@/hooks/useStellar'

type ActiveTab = 'created' | 'favorites'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('created')

  const { account } = useStellar()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: artworks, isLoading: artworksLoading } = useUserArtworks(
    account.publicKey || profile?.address || ''
  )

  // Display address: connected wallet key takes priority over API profile address
  const displayAddress = account.publicKey || profile?.address || '—'
  const displayName = profile?.username || 'Artist'
  const stats = profile?.stats ?? { created: 0, collected: 0, favorites: 0 }

  // Abbreviate long Stellar public key for display
  const shortAddress =
    displayAddress.length > 12
      ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
      : displayAddress

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Profile' },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <Card padding="lg" className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                <p className="text-secondary-600 mb-4 text-sm font-mono">{shortAddress}</p>
              </>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Created</span>
                <span className="font-medium">
                  {profileLoading ? '—' : stats.created}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Collected</span>
                <span className="font-medium">
                  {profileLoading ? '—' : stats.collected}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Favorites</span>
                <span className="font-medium">
                  {profileLoading ? '—' : stats.favorites}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button variant="outline" size="md" fullWidth>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Main content ── */}
        <div className="lg:col-span-3">
          <div className="space-y-8">
            {/* Tab bar */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                className={`flex items-center space-x-2 font-medium pb-1 border-b-2 transition-colors ${
                  activeTab === 'created'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-secondary-600 border-transparent'
                }`}
                onClick={() => setActiveTab('created')}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Created</span>
              </button>
              <button
                className={`flex items-center space-x-2 font-medium pb-1 border-b-2 transition-colors ${
                  activeTab === 'favorites'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-secondary-600 border-transparent'
                }`}
                onClick={() => setActiveTab('favorites')}
              >
                <Heart className="h-4 w-4" />
                <span>Favorites</span>
              </button>
            </div>

            {/* Artwork grid */}
            {activeTab === 'created' && (
              <>
                {artworksLoading ? (
                  <Grid columns={3} gap="md" responsive={false}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ArtworkCardSkeleton key={i} />
                    ))}
                  </Grid>
                ) : artworks && artworks.length > 0 ? (
                  <Grid columns={3} gap="md" responsive={false}>
                    {artworks.map((artwork) => (
                      <ArtworkCard
                        key={artwork.id}
                        artwork={artwork}
                        variant="default"
                        showPrice
                        showCreator={false}
                      />
                    ))}
                  </Grid>
                ) : (
                  <EmptyState type="no-artworks" />
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <EmptyState type="no-favorites" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
