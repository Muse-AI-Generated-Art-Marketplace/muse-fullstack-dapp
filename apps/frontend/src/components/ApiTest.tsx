import { useFeaturedArtworks, useTrendingArtworks, usePlatformStats } from '@/services/artworkService'

export function ApiTest() {
  const { data: featured, isLoading: featuredLoading, error: featuredError } = useFeaturedArtworks()
  const { data: trending, isLoading: trendingLoading, error: trendingError } = useTrendingArtworks()
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">API Test Results</h2>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold">Featured Artworks:</h3>
          <p>Loading: {featuredLoading ? 'Yes' : 'No'}</p>
          <p>Error: {featuredError ? featuredError.message : 'None'}</p>
          <p>Data: {featured ? `${featured.length} items` : 'No data'}</p>
          {featured && <pre className="text-xs mt-2">{JSON.stringify(featured[0], null, 2)}</pre>}
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold">Trending Artworks:</h3>
          <p>Loading: {trendingLoading ? 'Yes' : 'No'}</p>
          <p>Error: {trendingError ? trendingError.message : 'None'}</p>
          <p>Data: {trending ? `${trending.length} items` : 'No data'}</p>
          {trending && <pre className="text-xs mt-2">{JSON.stringify(trending[0], null, 2)}</pre>}
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold">Platform Stats:</h3>
          <p>Loading: {statsLoading ? 'Yes' : 'No'}</p>
          <p>Error: {statsError ? statsError.message : 'None'}</p>
          <p>Data: {stats ? 'Available' : 'No data'}</p>
          {stats && <pre className="text-xs mt-2">{JSON.stringify(stats, null, 2)}</pre>}
        </div>
      </div>
    </div>
  )
}
