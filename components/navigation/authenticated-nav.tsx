/**
 * Authenticated Navigation Component
 * Smart navigation for authenticated users
 */

'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

interface AuthenticatedNavProps {
  user: any // Clerk user type
}

export function AuthenticatedNav({ user }: AuthenticatedNavProps) {
  return (
    <div className='hidden sm:flex items-center space-x-6'>
      <Link 
        href='/dashboard' 
        className='text-gray-600 hover:text-primary-600 transition-colors font-medium'
      >
        Dashboard
      </Link>
      <Link 
        href='/workouts' 
        className='text-gray-600 hover:text-gray-900 transition-colors'
      >
        Workouts
      </Link>
      <Link 
        href='/progress' 
        className='text-gray-600 hover:text-gray-900 transition-colors'
      >
        Progress
      </Link>
      <Link 
        href='/exercises' 
        className='text-gray-600 hover:text-gray-900 transition-colors'
      >
        Exercises
      </Link>
      <UserButton 
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
            userButtonPopoverCard: 'shadow-lg border',
          }
        }}
        showName={false}
      />
    </div>
  )
}