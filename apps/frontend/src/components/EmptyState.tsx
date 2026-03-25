import { Search, Filter, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  type: 'no-results' | 'no-artworks' | 'no-favorites'
  onClearFilters?: () => void
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
          <Filter className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          No artworks found
        </h3>
        <p className="text-secondary-600 mb-6 max-w-md">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
        {onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="md"
          >
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  if (type === 'no-favorites') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          No favorites yet
        </h3>
        <p className="text-secondary-600 max-w-md">
          Heart your favorite AI artworks to save them for later and support the artists.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-secondary-400" />
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        No artworks available
      </h3>
      <p className="text-secondary-600 max-w-md">
        Be the first to mint and showcase your AI-generated artwork on the marketplace.
      </p>
    </div>
  )
}
