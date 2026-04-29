import React from 'react'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Filter, ArrowUpDown } from 'lucide-react'

export function ActivityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with the latest marketplace activity, bids, and transactions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button variant="outline" leftIcon={<Filter size={16} />}>
                Filter
              </Button>
              <Button variant="outline" leftIcon={<ArrowUpDown size={16} />}>
                Sort
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Activity Type Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Activity Type</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'All Activities', count: 1234 },
                      { label: 'Sales', count: 456 },
                      { label: 'Bids', count: 321 },
                      { label: 'Mints', count: 234 },
                      { label: 'Listings', count: 223 }
                    ].map((type) => (
                      <label key={type.label} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            defaultChecked={type.label === 'All Activities'}
                          />
                          <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {type.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Range Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Time Range</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500">
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>All time</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range (ETH)</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <Button variant="primary" fullWidth>
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3">
            <ActivityFeed maxItems={50} showRefresh={true} />
          </div>
        </div>
      </main>
    </div>
  )
}
