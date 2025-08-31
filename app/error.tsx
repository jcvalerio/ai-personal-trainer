'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home, Bug, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console and any error reporting service
    console.error('Global Error Boundary:', error);
    
    // Could integrate with error reporting services here
    // e.g., Sentry, LogRocket, Bugsnag, etc.
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        {/* Error Icon and Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Bug className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h1>
          <p className="text-gray-600">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
        </div>

        {/* Development Error Details */}
        {isDevelopment && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">
                Development Error Details:
              </span>
            </div>
            <p className="font-mono text-xs text-gray-700 mb-2">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-gray-600 mb-2">
                Digest: {error.digest}
              </p>
            )}
            {error.stack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 mb-1">
                  Stack Trace
                </summary>
                <pre className="whitespace-pre-wrap text-gray-600 max-h-32 overflow-y-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/en/dashboard'}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            Reload Page
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please{' '}
            <a 
              href="https://github.com/anthropics/claude-code/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              report the issue
            </a>{' '}
            or contact support.
          </p>
        </div>

        {/* Error ID for Support */}
        {error.digest && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Error ID: {error.digest}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}