/**
 * Authenticated Navigation Component
 * Smart navigation for authenticated users
 */

'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

interface AuthenticatedNavProps {
  user: any; // Clerk user type
}

export function AuthenticatedNav({ user }: AuthenticatedNavProps) {
  return (
    <div className='hidden items-center space-x-6 sm:flex'>
      <Link
        href='/dashboard'
        className='font-medium text-gray-600 transition-colors hover:text-primary-600'
      >
        Dashboard
      </Link>
      <Link
        href='/workouts'
        className='text-gray-600 transition-colors hover:text-gray-900'
      >
        Workouts
      </Link>
      <Link
        href='/progress'
        className='text-gray-600 transition-colors hover:text-gray-900'
      >
        Progress
      </Link>
      <Link
        href='/exercises'
        className='text-gray-600 transition-colors hover:text-gray-900'
      >
        Exercises
      </Link>
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
            userButtonPopoverCard: 'shadow-lg border',
          },
        }}
        showName={false}
      />
    </div>
  );
}
