'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Dumbbell, Menu, X, Home, Activity, Users, BarChart3 } from 'lucide-react'
import { ModernLocaleSwitch } from '../ui/modern-locale-switch'
import { useState } from 'react'

interface AppNavigationProps {
  locale: string
  variant?: 'dashboard' | 'app' | 'workouts' | 'progress' | 'organizations'
  className?: string
}

export function AppNavigation({ 
  locale, 
  variant = 'app',
  className = '' 
}: AppNavigationProps) {
  const tNav = useTranslations('nav')
  const tDashboard = useTranslations('dashboard')
  const tLocale = useTranslations('locale')
  const { user } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationLinks = [
    {
      href: `/${locale}/dashboard`,
      label: tNav('dashboard'),
      icon: Home,
      active: true // You can make this dynamic based on current path
    },
    {
      href: `/${locale}/workouts`,
      label: tNav('myWorkouts'),
      icon: Dumbbell
    },
    {
      href: `/${locale}/progress`,
      label: tNav('progress'),
      icon: BarChart3
    },
    {
      href: `/${locale}/organizations`,
      label: tNav('community'),
      icon: Users
    }
  ]

  const brandName = variant === 'dashboard' 
    ? tDashboard('title') 
    : tNav('brand')

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link 
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 bg-blue-100 rounded-xl">
              <Dumbbell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{brandName}</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    link.active 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <ModernLocaleSwitch 
              locale={locale} 
              variant="compact" 
              className="hidden sm:block"
            />

            {/* User Profile */}
            {user && (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                    userButtonPopoverCard: 'shadow-lg border border-gray-200',
                    userButtonPopoverActionButton: 'hover:bg-gray-50'
                  }
                }}
                showName={false}
              />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={tNav('toggleMenu')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      link.active 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Language Switcher */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {tLocale('select')}
                </p>
                <ModernLocaleSwitch 
                  locale={locale} 
                  variant="default" 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}