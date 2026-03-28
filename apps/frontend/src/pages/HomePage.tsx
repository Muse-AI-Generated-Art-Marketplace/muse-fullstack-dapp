
import { ActivityFeed } from '@/components/ActivityFeed'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useNotificationActions } from '@/hooks/useNotificationActions'
import { Bell, Compass, PlusSquare, TrendingUp } from 'lucide-react'

export function HomePage() {
  const {
    showSuccess,
    showError,
    showBidNotification,
    showPurchaseNotification,
    showMintNotification,
    showFollowNotification,
  } = useNotificationActions()

  const handleTestNotifications = () => {
    showSuccess('Success!', 'This is a success notification test.')
    setTimeout(() => showError('Error!', 'This is an error notification test.'), 1000)
    setTimeout(() => showBidNotification('Digital Sunset', '0.5 ETH', 'Alice'), 2000)
    setTimeout(() => showPurchaseNotification('Abstract Dreams', '0.3 ETH', 'Bob'), 3000)
    setTimeout(() => showMintNotification('New Artwork'), 4000)
    setTimeout(() => showFollowNotification('Charlie'), 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Discover Digital Art</h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Explore, collect, and trade extraordinary digital artworks from creators around the world
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" leftIcon={<Compass size={20} />} className="bg-white text-primary-600 hover:bg-gray-100">
                Explore Artwork
              </Button>
              <Button variant="outline" size="lg" leftIcon={<PlusSquare size={20} />} className="border-white text-white hover:bg-white hover:text-primary-600">
                Start Creating
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Notifications</h2>
            <p className="text-gray-600 mb-6">Click the button below to test different types of notifications</p>
            <Button variant="primary" size="lg" leftIcon={<Bell size={20} />} onClick={handleTestNotifications}>
              Test All Notifications
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ActivityFeed maxItems={15} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Marketplace Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Volume</span><span className="font-semibold">1,234 ETH</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Active Artists</span><span className="font-semibold">892</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Artworks</span><span className="font-semibold">5,421</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-gray-600">24h Volume</span><span className="font-semibold text-green-600">+12.5%</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Trending Collections</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Abstract Dreams', change: '+24.5%', volume: '156 ETH' },
                    { name: 'Crypto Punks', change: '+18.2%', volume: '89 ETH' },
                    { name: 'Digital Landscapes', change: '+15.7%', volume: '67 ETH' },
                  ].map((collection, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{collection.name}</p>
                        <p className="text-xs text-gray-500">{collection.volume}</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{collection.change}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" fullWidth className="justify-start"><PlusSquare size={16} className="mr-2" />Mint New Artwork</Button>
                  <Button variant="outline" fullWidth className="justify-start"><TrendingUp size={16} className="mr-2" />View Portfolio</Button>
                  <Button variant="outline" fullWidth className="justify-start"><Compass size={16} className="mr-2" />Discover Artists</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
