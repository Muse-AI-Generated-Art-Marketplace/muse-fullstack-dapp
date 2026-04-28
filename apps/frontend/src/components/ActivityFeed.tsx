import React, { useState, useEffect } from 'react'
import { Clock, TrendingUp, User, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface ActivityItem {
  id: string
  type: 'bid' | 'sale' | 'mint' | 'listing'
  user: {
    name: string
    avatar?: string
    address: string
  }
  artwork: {
    title: string
    image?: string
    price: number
  }
  amount: number
  timestamp: Date
  transactionHash?: string
}

interface ActivityFeedProps {
  className?: string
  maxItems?: number
  showRefresh?: boolean
}

export function ActivityFeed({ className, maxItems = 10, showRefresh = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for development - replace with actual API calls
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'sale',
      user: {
        name: 'Alice',
        address: '0x1234...5678'
      },
      artwork: {
        title: 'Digital Sunset',
        price: 0.5
      },
      amount: 0.5,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      transactionHash: '0xabcd...1234'
    },
    {
      id: '2',
      type: 'bid',
      user: {
        name: 'Bob',
        address: '0x5678...9012'
      },
      artwork: {
        title: 'Abstract Dreams',
        price: 0.3
      },
      amount: 0.35,
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '3',
      type: 'mint',
      user: {
        name: 'Charlie',
        address: '0x9012...3456'
      },
      artwork: {
        title: 'Crypto Punk #1234',
        price: 0.1
      },
      amount: 0.1,
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '4',
      type: 'listing',
      user: {
        name: 'Diana',
        address: '0x3456...7890'
      },
      artwork: {
        title: 'Neon Nights',
        price: 0.8
      },
      amount: 0.8,
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    }
  ]

  const fetchActivities = async () => {
    try {
      setError(null)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real implementation, this would be an API call:
      // const response = await fetch('/api/activities')
      // const data = await response.json()
      
      setActivities(mockActivities.slice(0, maxItems))
    } catch (err) {
      setError('Failed to load activities')
      console.error('Error fetching activities:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchActivities()
  }

  useEffect(() => {
    fetchActivities()
    
    // Set up real-time updates (polling for demo)
    const interval = setInterval(fetchActivities, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [maxItems])

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'bid':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'mint':
        return <ArrowUpRight className="h-4 w-4 text-purple-600" />
      case 'listing':
        return <ArrowDownRight className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return 'bg-green-50 border-green-200'
      case 'bid':
        return 'bg-blue-50 border-blue-200'
      case 'mint':
        return 'bg-purple-50 border-purple-200'
      case 'listing':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getActivityText = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale':
        return 'sold'
      case 'bid':
        return 'bid on'
      case 'mint':
        return 'minted'
      case 'listing':
        return 'listed'
      default:
        return 'acted on'
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50',
                  getActivityColor(activity.type)
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activity.user.address}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{getActivityText(activity.type)}</span>{' '}
                    <span className="font-medium">"{activity.artwork.title}"</span>
                    {' '}for{' '}
                    <span className="font-semibold text-primary-600">
                      {activity.amount} ETH
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    {activity.transactionHash && (
                      <span className="text-xs text-gray-400">
                        • {activity.transactionHash.slice(0, 6)}...{activity.transactionHash.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
