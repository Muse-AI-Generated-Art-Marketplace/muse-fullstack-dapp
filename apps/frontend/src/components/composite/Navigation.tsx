import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Wallet, ArtStation, Compass, PlusSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { label: 'Explore', path: '/explore', icon: Compass },
  { label: 'Mint', path: '/mint', icon: PlusSquare },
  { label: 'Profile', path: '/profile', icon: User },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <nav 
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-secondary-100"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md"
              aria-label="Muse Home"
              onClick={closeMenu}
            >
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                M
              </div>
              <span className="text-xl font-bold text-secondary-900 hidden sm:block">Muse</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md px-2 py-1',
                  location.pathname === item.path ? 'text-primary-600' : 'text-secondary-600'
                )}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Wallet size={16} />}
              aria-label="Connect wallet"
            >
              Connect
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close main menu" : "Open main menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div 
          className="md:hidden animate-in slide-in-from-top fixed inset-x-0 top-16 bg-white border-b border-secondary-100 shadow-lg" 
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium',
                  location.pathname === item.path 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'
                )}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <item.icon size={18} className="mr-3" aria-hidden="true" />
                  {item.label}
                </div>
              </Link>
            ))}
            <div className="pt-4 pb-2 px-3">
              <Button
                variant="primary"
                fullWidth
                leftIcon={<Wallet size={18} />}
                aria-label="Connect wallet"
                onClick={closeMenu}
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
