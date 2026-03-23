import { Search, Filter } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-results' | 'no-artworks'
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
          <button
            onClick={onClearFilters}
            className="btn-outline px-6 py-2 touch-manipulation"
          >
            Clear Filters
          </button>
        )}
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
