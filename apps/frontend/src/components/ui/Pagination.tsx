import React from 'react'
import { Button } from './Button'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  maxVisiblePages = 5,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1)

  const pageNumbers = Array.from(
    { length: adjustedStart === 1 ? endPage : endPage - adjustedStart + 1 },
    (_, i) => adjustedStart + i
  )

  return (
    <div className={`flex items-center justify-center gap-2 py-8 flex-wrap ${className}`}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="min-w-[80px]"
      >
        ← Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex gap-1">
        {/* First page (if not visible) */}
        {adjustedStart > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={isLoading}
              className="min-w-[40px]"
            >
              1
            </Button>
            {adjustedStart > 2 && (
              <span className="px-2 py-1 text-secondary-500">...</span>
            )}
          </>
        )}

        {/* Page number buttons */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}

        {/* Last page (if not visible) */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 py-1 text-secondary-500">...</span>
            )}
            <Button
              variant={currentPage === totalPages ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={isLoading}
              className="min-w-[40px]"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="min-w-[80px]"
      >
        Next →
      </Button>

      {/* Page Info */}
      <div className="w-full text-center text-sm text-secondary-600 mt-2">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}

export interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className = ''
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex items-center justify-between text-sm text-secondary-600 px-4 py-4 ${className}`}>
      <span>
        Showing {startItem} to {endItem} of {totalItems} artworks
      </span>
      <span className="font-medium">
        Page {currentPage} / {totalPages}
      </span>
    </div>
  )
}
