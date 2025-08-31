'use client';

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { ErrorState } from '@/components/ui/error-state';
import { AlertTriangle, Database, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryErrorFallbackProps {
  error?: Error;
  retry?: () => void;
  context?: string;
}

/**
 * Error boundary specifically for React Query operations
 */
export function QueryErrorBoundary({ 
  children, 
  context = 'API Query' 
}: { 
  children: React.ReactNode;
  context?: string;
}) {
  return (
    <ErrorBoundary
      fallback={QueryErrorFallback}
      level="query"
      context={context}
      onError={(error, errorInfo) => {
        // Log query-specific errors
        console.error(`[QueryError:${context}]`, {
          error,
          errorInfo,
          timestamp: new Date().toISOString(),
        });
        
        // Could integrate with error reporting service here
        // e.g., Sentry, LogRocket, etc.
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized fallback for React Query errors
 */
function QueryErrorFallback({ error, retry, context }: QueryErrorFallbackProps) {
  const errorType = getQueryErrorType(error);
  const { icon: Icon, title, description } = getErrorDisplayInfo(errorType, context);

  return (
    <ErrorState
      message={title}
      description={description}
      onRetry={retry}
      variant="card"
      icon={Icon}
      className="m-4"
    />
  );
}

/**
 * Determine the type of query error
 */
function getQueryErrorType(error?: Error): 'network' | 'server' | 'auth' | 'validation' | 'unknown' {
  if (!error) return 'unknown';

  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'auth';
  }
  
  if (message.includes('400') || message.includes('validation')) {
    return 'validation';
  }
  
  if (message.includes('500') || message.includes('server')) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Get display information for different error types
 */
function getErrorDisplayInfo(errorType: string, context?: string) {
  switch (errorType) {
    case 'network':
      return {
        icon: Network,
        title: 'Connection Issue',
        description: `Unable to connect to the server. Please check your internet connection and try again.`
      };
    
    case 'auth':
      return {
        icon: AlertTriangle,
        title: 'Authentication Required',
        description: 'Your session has expired. Please sign in again to continue.'
      };
    
    case 'validation':
      return {
        icon: AlertTriangle,
        title: 'Invalid Data',
        description: 'The request contains invalid data. Please check your input and try again.'
      };
    
    case 'server':
      return {
        icon: Database,
        title: 'Server Error',
        description: 'The server encountered an error. Please try again in a few moments.'
      };
    
    default:
      return {
        icon: AlertTriangle,
        title: 'Something went wrong',
        description: context 
          ? `An error occurred while loading ${context.toLowerCase()}. Please try again.`
          : 'An unexpected error occurred. Please try again.'
      };
  }
}

/**
 * Component wrapper for query error boundary
 */
export function withQueryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  const WrappedComponent = (props: P) => (
    <QueryErrorBoundary context={context}>
      <Component {...props} />
    </QueryErrorBoundary>
  );

  WrappedComponent.displayName = `withQueryErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Custom error component for API errors with detailed information
 */
export function ApiErrorDisplay({ 
  error, 
  onRetry, 
  context 
}: {
  error: any;
  onRetry?: () => void;
  context?: string;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorType = getQueryErrorType(error);
  const { icon: Icon, title, description } = getErrorDisplayInfo(errorType, context);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <Icon className="h-4 w-4 text-red-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800">{title}</h4>
          <p className="mt-1 text-sm text-red-700">{description}</p>
          
          {/* Development error details */}
          {isDevelopment && error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                Error Details (Development Only)
              </summary>
              <pre className="mt-1 whitespace-pre-wrap text-xs text-red-600">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
          
          {onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}