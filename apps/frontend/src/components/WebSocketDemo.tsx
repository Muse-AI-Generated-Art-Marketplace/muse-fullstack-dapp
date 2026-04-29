import React, { useState } from 'react'
import { 
  useWebSocket, 
  useWebSocketAuth, 
  useBidUpdates, 
  useSaleUpdates, 
  useMintingUpdates,
  useTransactionUpdates 
} from '@/contexts/WebSocketContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function WebSocketDemo() {
  const { 
    isConnected, 
    notifications, 
    clearNotifications,
    subscribeToArtwork,
    unsubscribeFromArtwork,
    subscribeToUserTransactions
  } = useWebSocket()
  
  const { authenticate } = useWebSocketAuth()
  const { bidUpdates } = useBidUpdates()
  const { saleUpdates } = useSaleUpdates()
  const { mintingUpdates } = useMintingUpdates()
  const { transactionUpdates } = useTransactionUpdates()
  
  const [artworkId, setArtworkId] = useState('demo-artwork-123')
  const [userAddress, setUserAddress] = useState('demo-user-address')

  const handleAuthenticate = () => {
    authenticate({ 
      userId: 'demo-user', 
      address: userAddress 
    })
  }

  const handleSubscribeArtwork = () => {
    subscribeToArtwork(artworkId)
  }

  const handleUnsubscribeArtwork = () => {
    unsubscribeFromArtwork(artworkId)
  }

  const handleSubscribeUserTransactions = () => {
    subscribeToUserTransactions(userAddress)
  }

  const simulateNotification = () => {
    // This would normally come from the backend
    console.log('Simulating notification - check backend for WebSocket events')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Connection Demo
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">User Address</label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter user address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Artwork ID</label>
              <input
                type="text"
                value={artworkId}
                onChange={(e) => setArtworkId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter artwork ID"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAuthenticate} disabled={!isConnected}>
              Authenticate
            </Button>
            <Button onClick={handleSubscribeArtwork} disabled={!isConnected}>
              Subscribe to Artwork
            </Button>
            <Button onClick={handleUnsubscribeArtwork} disabled={!isConnected}>
              Unsubscribe from Artwork
            </Button>
            <Button onClick={handleSubscribeUserTransactions} disabled={!isConnected}>
              Subscribe to User Transactions
            </Button>
            <Button onClick={simulateNotification} variant="outline">
              Simulate Notification
            </Button>
            <Button onClick={clearNotifications} variant="secondary">
              Clear Notifications ({notifications.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bid Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{bidUpdates.length}</div>
            <p className="text-sm text-gray-600">Real-time bid updates</p>
            {bidUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium">{update.data.price} {update.data.currency}</div>
                <div className="text-gray-600">{new Date(update.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sale Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{saleUpdates.length}</div>
            <p className="text-sm text-gray-600">Real-time sale updates</p>
            {saleUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="mt-2 p-2 bg-green-50 rounded text-xs">
                <div className="font-medium">{update.data.price} {update.data.currency}</div>
                <div className="text-gray-600">{new Date(update.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Minting Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{mintingUpdates.length}</div>
            <p className="text-sm text-gray-600">Real-time minting updates</p>
            {mintingUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="mt-2 p-2 bg-orange-50 rounded text-xs">
                <div className="font-medium">{update.data.status}</div>
                <div className="text-gray-600">{new Date(update.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{transactionUpdates.length}</div>
            <p className="text-sm text-gray-600">All transaction updates</p>
            {transactionUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="mt-2 p-2 bg-purple-50 rounded text-xs">
                <div className="font-medium">{update.data.type} - {update.data.status}</div>
                <div className="text-gray-600">{new Date(update.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications yet. Start some transactions to see real-time updates!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div 
                  key={`${notification.type}-${notification.timestamp}`}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium capitalize">{notification.type.replace('_', ' ')}</span>
                      <div className="text-sm text-gray-600 mt-1">
                        {JSON.stringify(notification.data, null, 2)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Start the backend server with WebSocket integration</li>
            <li>Start the frontend application</li>
            <li>Open this demo page in your browser</li>
            <li>Click "Authenticate" to connect to WebSocket</li>
            <li>Subscribe to artwork or user transactions</li>
            <li>Create transactions, bids, or start minting in the app</li>
            <li>Watch real-time updates appear in the cards above</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This demo shows the WebSocket integration working. 
              To see actual updates, you need to perform real transactions in the application 
              or simulate them from the backend.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
