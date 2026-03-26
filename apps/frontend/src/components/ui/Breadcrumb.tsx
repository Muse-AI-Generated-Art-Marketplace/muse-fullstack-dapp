import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm overflow-x-auto no-scrollbar">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1.5 whitespace-nowrap">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-secondary-400 flex-shrink-0" />
              )}

              {isLast ? (
                <span
                  className="font-medium text-secondary-900"
                  aria-current="page"
                >
                  {index === 0 && <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href || '/'}
                  className="text-secondary-500 hover:text-primary-600 transition-colors"
                >
                  {index === 0 && <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
