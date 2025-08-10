'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { CTASection } from '@/components/sections/cta-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { HeroSection } from '@/components/sections/hero-section'
import { AuthenticatedNav } from '@/components/navigation/authenticated-nav'

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      // Give users a moment to see the personalized landing, then redirect
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
    return // Explicit return for when the condition is not met
  }, [isLoaded, user, router])

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className='flex flex-col'>
      {/* Navigation Bar */}
      <nav className='border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40'>
        <div className='container-safe'>
          <div className='flex h-16 items-center justify-between'>
            {/* Logo */}
            <div className='flex items-center space-x-2'>
              <div className='h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>AI</span>
              </div>
              <span className='font-semibold text-lg text-gray-900'>
                Personal Trainer
              </span>
            </div>

            {/* Navigation Links */}
            {user ? (
              <AuthenticatedNav user={user} />
            ) : (
              <div className='hidden sm:flex items-center space-x-6'>
                <Link 
                  href='#features' 
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Features
                </Link>
                <Link 
                  href='#pricing' 
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  For Gyms
                </Link>
                <Link 
                  href='/sign-in' 
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Sign In
                </Link>
                <Link 
                  href='/sign-up' 
                  className='btn-primary'
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button 
              className='sm:hidden touch-target'
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label='Toggle mobile menu'
            >
              <span className='sr-only'>Open menu</span>
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={showMobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
          
          {/* Mobile menu */}
          {showMobileMenu && (
            <div className='sm:hidden border-t border-gray-200 bg-white'>
              <div className='px-4 py-3 space-y-3'>
                {user ? (
                  <>
                    <div className='flex items-center space-x-3 pb-3 border-b border-gray-200'>
                      <div className='w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-semibold text-sm'>
                          {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {user.firstName || 'User'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {user.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>
                    </div>
                    <Link 
                      href='/dashboard' 
                      className='block w-full text-left px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors'
                    >
                      Go to Dashboard
                    </Link>
                    <Link href='/workouts' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      My Workouts
                    </Link>
                    <Link href='/progress' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      Progress
                    </Link>
                    <Link href='/exercises' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      Exercises
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href='#features' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      Features
                    </Link>
                    <Link href='#pricing' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      For Gyms
                    </Link>
                    <Link href='/sign-in' className='block text-gray-700 hover:text-gray-900 transition-colors py-2'>
                      Sign In
                    </Link>
                    <Link href='/sign-up' className='block w-full text-center px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors'>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Show personalized welcome for authenticated users */}
      {user && (
        <div className='bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200'>
          <div className='container-safe py-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Welcome back, {user.firstName || 'there'}! 👋
                </h2>
                <p className='text-gray-600'>
                  Redirecting you to your dashboard...
                </p>
              </div>
              <Link 
                href='/dashboard' 
                className='btn-primary whitespace-nowrap'
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection user={user} />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className='bg-gray-900 text-white'>
        <div className='container-safe py-12'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            {/* Brand */}
            <div className='col-span-1 md:col-span-2'>
              <div className='flex items-center space-x-2 mb-4'>
                <div className='h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>AI</span>
                </div>
                <span className='font-semibold text-lg'>Personal Trainer</span>
              </div>
              <p className='text-gray-400 text-sm max-w-md'>
                Transform your fitness journey with AI-powered workout plans, 
                progress tracking, and personalized coaching for families and gyms.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className='font-semibold mb-4'>Product</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li><Link href='#features' className='hover:text-white transition-colors'>Features</Link></li>
                <li><Link href='#pricing' className='hover:text-white transition-colors'>Pricing</Link></li>
                <li><Link href='/sign-up' className='hover:text-white transition-colors'>Get Started</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className='font-semibold mb-4'>Support</h3>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li><Link href='/help' className='hover:text-white transition-colors'>Help Center</Link></li>
                <li><Link href='/contact' className='hover:text-white transition-colors'>Contact</Link></li>
                <li><Link href='/privacy' className='hover:text-white transition-colors'>Privacy</Link></li>
                <li><Link href='/terms' className='hover:text-white transition-colors'>Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className='border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400'>
            <p>&copy; {new Date().getFullYear()} AI Personal Trainer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}