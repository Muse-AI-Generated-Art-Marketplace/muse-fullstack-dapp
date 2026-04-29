import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface GridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'none'
  responsive?: boolean
  className?: string
}

export function Grid({ 
  children, 
  columns = 3, 
  gap = 'md', 
  responsive = true,
  className = ''
}: GridProps) {
  
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div
      className={cn(
        'grid w-full',
        responsive ? 'grid-responsive' : columnClasses[columns],
        !responsive && gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}