import { ReactNode } from 'react'

interface GridProps {
  children: ReactNode
  columns?: number
  gap?: string
  responsive?: boolean
}

export function Grid({ children, columns = 3, gap = 'md', responsive = true }: GridProps) {
  return (
    <div
      className={`grid ${responsive ? 'sm:grid-cols-1 md:grid-cols-' + columns : ''} gap-${gap}`}
    >
      {children}
    </div>
  )
}