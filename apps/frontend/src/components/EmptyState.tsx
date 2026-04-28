import { Search, Filter, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  type: 'no-results' | 'no-artworks' | 'no-favorites'
  onClearFilters?: () => void
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  const { t } = useTranslation()
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
          aria-label={t('empty_state.clear_filters_aria')}
        >
          {t('empty_state.clear_filters')}
        </Button>
      )}
    </div>
  )

  if (type === 'no-results') {
    return renderContent(
      <Filter className="w-8 h-8 text-secondary-400" />,
      t('empty_state.no_results_title'),
      t('empty_state.no_results_desc'),
      true
    )
  }

  if (type === 'no-favorites') {
    return renderContent(
      <Heart className="w-8 h-8 text-secondary-400" />,
      t('empty_state.no_favorites_title'),
      t('empty_state.no_favorites_desc')
    )
  }

  return renderContent(
    <Search className="w-8 h-8 text-secondary-400" />,
    t('empty_state.no_artworks_title'),
    t('empty_state.no_artworks_desc')
  )
}
