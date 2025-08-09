/**
 * Error display and boundary components
 * Handles various error states throughout the application
 */

'use client'

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  title?: string
  message?: string
  code?: string
  showRetry?: boolean
  showHome?: boolean
  showBack?: boolean
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  code,
  showRetry = true,
  showHome = true,
  showBack = false,
  onRetry,
  className
}: ErrorDisplayProps) {
  const router = useRouter()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      
      {code && (
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-500 mb-6">
          Error code: {code}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-4">
        {showRetry && (
          <Button onClick={handleRetry} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {showBack && (
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {showHome && (
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

interface ErrorPageProps {
  title?: string
  message?: string
  code?: string
  showRetry?: boolean
}

export function ErrorPage({ 
  title = 'Page Error',
  message = 'The page encountered an error and could not be loaded.',
  code,
  showRetry = true 
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <ErrorDisplay
          title={title}
          message={message}
          code={code}
          showRetry={showRetry}
          showHome={true}
          showBack={true}
        />
      </div>
    </div>
  )
}

interface FormErrorProps {
  title?: string
  message: string
  onDismiss?: () => void
}

export function FormError({ title = 'Error', message, onDismiss }: FormErrorProps) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-600 hover:text-red-800 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

interface ApiErrorDisplayProps {
  error: {
    success: false
    error: string
    code?: string
    details?: any[]
  }
  onRetry?: () => void
  className?: string
}

export function ApiErrorDisplay({ error, onRetry, className }: ApiErrorDisplayProps) {
  // Map error codes to user-friendly messages
  const getErrorMessage = (code?: string, fallback?: string) => {
    const errorMessages: Record<string, string> = {
      'UNAUTHORIZED': 'You need to sign in to access this feature.',
      'FORBIDDEN': 'You don\'t have permission to perform this action.',
      'USER_NOT_FOUND': 'User account not found. Please check your login.',
      'ORGANIZATION_NOT_FOUND': 'Organization not found or you don\'t have access.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
      'INTERNAL_ERROR': 'Server error. Our team has been notified.',
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
    }
    
    return errorMessages[code || ''] || fallback || 'An unexpected error occurred.'
  }

  const message = getErrorMessage(error.code, error.error)

  return (
    <ErrorDisplay
      title="Request Failed"
      message={message}
      code={error.code}
      showRetry={!!onRetry}
      showHome={false}
      showBack={false}
      onRetry={onRetry}
      className={className}
    />
  )
}

// Auth-specific error component
interface AuthErrorProps {
  error: string
  code?: string
}

export function AuthError({ error, code }: AuthErrorProps) {
  const getAuthErrorMessage = (code?: string) => {
    const authErrors: Record<string, { title: string, message: string }> = {
      'SIGN_IN_REQUIRED': {
        title: 'Sign In Required',
        message: 'You need to sign in to access this page.'
      },
      'ONBOARDING_REQUIRED': {
        title: 'Complete Your Profile',
        message: 'Please complete your profile setup to continue.'
      },
      'INVALID_SESSION': {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.'
      },
      'ACCESS_DENIED': {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.'
      },
    }
    
    return authErrors[code || ''] || { 
      title: 'Authentication Error', 
      message: error 
    }
  }

  const { title, message } = getAuthErrorMessage(code)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <ErrorDisplay
          title={title}
          message={message}
          code={code}
          showRetry={false}
          showHome={true}
          showBack={false}
        />
        
        <div className="mt-6 text-center">
          <Link 
            href="/sign-in"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

// Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Connection Problem"
      message="Unable to connect to our servers. Please check your internet connection and try again."
      code="NETWORK_ERROR"
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  )
}

// Not found component  
export function NotFound({ 
  title = 'Page Not Found',
  message = 'The page you\'re looking for doesn\'t exist or has been moved.'
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex items-center justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}