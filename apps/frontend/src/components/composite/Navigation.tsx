import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { WalletConnect } from '@/components/WalletConnect'

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface NavigationProps {
  items: NavigationItem[]
  brand?: {
    name: string
    icon?: React.ReactNode
    href: string
  }
  actions?: React.ReactNode
  mobile?: boolean
  className?: string
}

export function Navigation({
  items,
  brand,
  actions,
  mobile = false,
  className = ''
}: NavigationProps) {
  const location = useLocation()
  const isActive = (href: string) => location.pathname === href

  const renderBrand = () => {
    if (!brand) return null
    
    return (
      <Link to={brand.href} className="flex items-center space-x-2">
        {brand.icon}
        <span className="text-xl font-bold text-secondary-900">{brand.name}</span>
      </Link>
    )
  }

  const renderNavigationItems = () => {
    const itemClasses = mobile
      ? 'block px-3 py-2 rounded-md text-base font-medium transition-colors'
      : 'text-sm font-medium transition-colors'

    return items.map((item) => {
      const activeClasses = isActive(item.href)
        ? mobile
          ? 'text-primary-600 bg-primary-50'
          : 'text-primary-600'
        : 'text-secondary-600 hover:text-secondary-900'

      const hoverClasses = mobile
        ? 'hover:bg-secondary-50'
        : ''

      return (
        <Link
          key={item.href}
          to={item.href}
          className={`${itemClasses} ${activeClasses} ${hoverClasses}`}
        >
          <div className="flex items-center space-x-2">
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        </Link>
      )
    })
  }

  const renderActions = () => {
    if (actions) {
      return (
        <div className={`flex ${mobile ? 'flex-col space-y-4' : 'items-center space-x-4'}`}>
          {actions}
        </div>
      )
    }
    
    return <WalletConnect />
  }

  if (mobile) {
    return (
      <div className={`bg-white border-b border-secondary-200 overflow-hidden ${className}`}>
        <div className="px-4 py-3 space-y-1">
          {renderNavigationItems()}
          <div className="pt-6 pb-4 border-t border-secondary-200 mt-4">
            {renderActions()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <nav className={`flex items-center justify-between py-4 ${className}`}>
      <div className="flex items-center space-x-12">
        {renderBrand()}
        <div className="hidden md:flex items-center space-x-8">
          {renderNavigationItems()}
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden md:block">
          {renderActions()}
        </div>
      </div>
    </nav>
  )
}

export interface MobileMenuToggleProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function MobileMenuToggle({
  isOpen,
  onToggle,
  className = ''
}: MobileMenuToggleProps) {
  return (
    <Button
      variant="outline"
      onClick={onToggle}
      className={`p-2 ${className}`}
      aria-label="Toggle mobile menu"
    >
      {isOpen ? (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </Button>
  )
}
