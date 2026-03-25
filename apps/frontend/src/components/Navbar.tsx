import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation } from "@/components/composite/Navigation";
import { WalletConnect } from "./WalletConnect";
import { Palette, Menu, X } from "lucide-react";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Create", href: "/mint" },
    { label: "Profile", href: "/profile" },
  ];

  const brand = {
    name: "Muse",
    icon: <Palette className="h-8 w-8 text-primary-600" />,
    href: "/",
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/80 backdrop-blur-sm nav-mobile">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 1. Left: Logo (Occupies 1/3 of the space) */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">Muse</span>
            </Link>
          </div>

          {/* 2. Center: Navigation Links (Centered perfectly) */}
          <div className="hidden md:flex items-center justify-center space-x-8 lg:space-x-12">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-primary-600"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Home
            </Link>
            <Link
              to="/explore"
              className={`text-sm font-medium transition-colors ${
                isActive("/explore")
                  ? "text-primary-600"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Explore
            </Link>
            <Link
              to="/mint"
              className={`text-sm font-medium transition-colors ${
                isActive("/mint")
                  ? "text-primary-600"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Create
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors ${
                isActive("/profile")
                  ? "text-primary-600"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Profile
            </Link>
          </div>

          {/* 3. Right: Wallet & Mobile Menu */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            <div className="hidden md:block relative">
              {/* THE FIX: 
      1. We target ANY div with 'border-red-200' (the ErrorDisplay) that appears here.
      2. We force it to be 'absolute' so it floats over the content.
      3. We push it 64px (top-16) down so it clears the Navbar height.
    */}
              <div className="flex items-center h-16 [&_div.border-red-200]:absolute [&_div.border-red-200]:top-16 [&_div.border-red-200]:right-0 [&_div.border-red-200]:w-72 [&_div.border-red-200]:z-[100] [&_div.border-red-200]:shadow-xl">
                <WalletConnect />
              </div>
            </div>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors"
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
  );
}
