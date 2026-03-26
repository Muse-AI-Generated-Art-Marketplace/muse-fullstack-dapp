import { useParams } from 'react-router-dom'
import { useArtworkMetadata } from '@/hooks/useMetadata'
import { MetaTags } from '@/components/MetaTags'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export function ArtworkPage() {
  const { id } = useParams<{ id: string }>()
  const { data: metadata, isLoading, error } = useArtworkMetadata(id || '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading artwork...</p>
        </div>
      </div>
    )
  }

  if (error || !metadata?.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Artwork Not Found</h1>
          <p className="text-secondary-600">Sorry, we couldn't find the artwork you're looking for.</p>
        </div>
      </div>
    )
  }

  const artworkData = metadata.data

  return (
    <>
      <MetaTags
        title={artworkData.title}
        description={artworkData.description}
        image={artworkData.image}
        url={artworkData.url}
        type={artworkData.type}
        siteName={artworkData.siteName}
        twitterCard={artworkData.twitterCard}
        twitterSite={artworkData.twitterSite}
        additionalTags={artworkData.additionalTags}
      />
      
      <div className="min-h-screen bg-background">
        <div className="mobile-section">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: 'Explore', href: '/explore' },
              { label: artworkData.title || 'Artwork' },
            ]} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Artwork Image */}
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden">
                <img
                  src={artworkData.image}
                  alt={artworkData.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLDivElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200" style={{ display: 'none' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-secondary-600">Artwork Image</p>
                  </div>
                </div>
              </div>

              {/* Artwork Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="heading-mobile mb-2">{artworkData.title}</h1>
                  <p className="text-secondary-600 text-mobile-base">{artworkData.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-secondary-900 mb-2">Artwork Details</h3>
                    <dl className="space-y-2">
                      {Object.entries(artworkData.additionalTags).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <dt className="text-sm font-medium text-secondary-700 capitalize">
                            {key.replace('_', ' ')}:
                          </dt>
                          <dd className="text-sm text-secondary-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="bg-primary-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-primary-900 mb-2">Share this artwork</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: artworkData.title,
                              text: artworkData.description,
                              url: artworkData.url,
                            })
                          } else {
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(artworkData.url)
                            alert('Link copied to clipboard!')
                          }
                        }}
                        className="btn-primary text-mobile-sm px-4 py-2 touch-manipulation"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${artworkData.title} - ${artworkData.description}`)}&url=${encodeURIComponent(artworkData.url)}`, '_blank')}
                        className="btn-outline text-mobile-sm px-4 py-2 touch-manipulation"
                      >
                        Tweet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

