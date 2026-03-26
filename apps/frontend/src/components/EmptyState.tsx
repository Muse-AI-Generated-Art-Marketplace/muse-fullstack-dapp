import { Search, Filter, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  type: 'no-results' | 'no-artworks' | 'no-favorites'
  onClearFilters?: () => void
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  const renderContent = (icon: React.ReactNode, title: string, text: string, showButton = false) => (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-labelledby="empty-state-title"
    >
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 id="empty-state-title" className="text-lg font-semibold text-secondary-900 mb-2">
        {title}
      </h3>
      <p className="text-secondary-600 mb-6 max-w-md">
        {text}
      </p>
      {showButton && onClearFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          size="md"
          aria-label="Clear all active filters"
        >
          Clear Filters
        </Button>
      )}
    </div>
  )

  if (type === 'no-results') {
    return renderContent(
      <Filter className="w-8 h-8 text-secondary-400" />,
      "No artworks found",
      "Try adjusting your filters or search terms to find what you're looking for.",
      true
    )
  }

  if (type === 'no-favorites') {
    return renderContent(
      <Heart className="w-8 h-8 text-secondary-400" />,
      "No favorites yet",
      "Heart your favorite AI artworks to save them for later and support the artists."
    )
  }

  return renderContent(
    <Search className="w-8 h-8 text-secondary-400" />,
    "No artworks available",
    "Be the first to mint and showcase your AI-generated artwork on the marketplace."
  )
}
