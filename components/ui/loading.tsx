/**
 * Loading spinner and skeleton components
 * Used throughout the application for loading states
 */

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('animate-spin', sizeClasses[size], className)}>
      <svg 
        className="w-full h-full text-blue-600" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function Skeleton({ className, children }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)}>
      {children}
    </div>
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number, className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl p-6 border border-gray-200', className)}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  )
}