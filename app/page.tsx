import Link from 'next/link'

import { HeroSection } from '@/components/sections/hero-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { CTASection } from '@/components/sections/cta-section'

export default function HomePage() {
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

            {/* Mobile menu button */}
            <button className='sm:hidden touch-target'>
              <span className='sr-only'>Open menu</span>
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

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