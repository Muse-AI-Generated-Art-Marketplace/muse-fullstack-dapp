import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Palette, Menu, X, Plus } from 'lucide-react'
import { Navigation } from '@/components/composite/Navigation'
import { WalletConnect } from './WalletConnect'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { label: 'Explore', href: '/explore' },
    { label: 'Create', href: '/mint' },
    { label: 'Profile', href: '/profile' }
  ]

  const brand = {
    name: 'Muse',
    icon: <Palette className="h-8 w-8 text-primary-600" />,
    href: '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navActions = (
    <>
      <Link to="/mint">
        <Button variant="primary" size="md" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Mint</span>
        </Button>
      </Link>
      <WalletConnect />
    </>
  )

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <Navigation
          items={navigationItems}
          brand={brand}
          actions={navActions}
          className="hidden md:flex"
        />

        {/* Mobile Navbar Header */}
        <div className="flex h-16 items-center justify-between md:hidden">
          <Link to="/" className="flex items-center space-x-2">
            <Palette className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-secondary-900">Muse</span>
          </Link>

          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top duration-200">
          <Navigation
            items={navigationItems}
            mobile
            actions={navActions}
            className="border-t border-secondary-100"
          />
        </div>
      )}
    </nav>
  )
}
