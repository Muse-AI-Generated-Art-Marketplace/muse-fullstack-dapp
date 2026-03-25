import React from 'react'

export interface GridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  responsive?: boolean
  className?: string
}

export function Grid({
  children,
  columns = 1,
  gap = 'md',
  responsive = true,
  className = ''
}: GridProps) {
  const baseClasses = 'grid'
  
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }
  
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-5 md:gap-6',
    lg: 'gap-6 sm:gap-7 md:gap-8'
  }

  const responsiveClasses = responsive
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2 sm:px-4'
    : ''

  const classes = [
    baseClasses,
    responsive ? responsiveClasses : columnClasses[columns],
    gapClasses[gap],
    responsive && responsive || 'px-0',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

export interface GridItemProps {
  children: React.ReactNode
  span?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

export function GridItem({
  children,
  span = 1,
  className = ''
}: GridItemProps) {
  const spanClasses = {
    1: '',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6'
  }

  const classes = [
    spanClasses[span],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}
