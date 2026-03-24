import { useState } from 'react'
import { Muse } from 'lucide-react'
import { Navigation, MobileMenuToggle } from '@/components/composite/Navigation'
import { WalletConnect } from './WalletConnect'
import { Palette, Menu, X } from 'lucide-react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Create', href: '/mint' },
    { label: 'Profile', href: '/profile' }
  ]

  const brand = {
    name: 'Muse',
    icon: <Muse className="h-8 w-8 text-primary-600" />,
    href: '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/80 backdrop-blur-sm nav-mobile">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">Muse</span>
            </Link>
          </div>
            
          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center justify-center space-x-16 lg:space-x-24 w-full">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Home
              </Link>
              <Link
                to="/explore"
                className={`text-sm font-medium transition-colors ${
                  isActive('/explore') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Explore
              </Link>
              <Link
                to="/mint"
                className={`text-sm font-medium transition-colors ${
                  isActive('/mint') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Create
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors ${
                  isActive('/profile') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                Profile
              </Link>
          </div>
          
          {/* Right: Wallet Connect & Mobile Menu */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            <div className="hidden md:block">
              <WalletConnect />
            </div>
            
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <Navigation
          items={navigationItems}
          mobile
          actions={<WalletConnect />}
        />
      )}
    </nav>
  )
}
