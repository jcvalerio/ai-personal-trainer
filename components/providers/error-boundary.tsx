'use client';

import React from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { AlertTriangle, Bug, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Custom fallback component
   */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /**
   * Called when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /**
   * Error boundary level for specialized handling
   */
  level?: 'page' | 'component' | 'query' | 'form';
  /**
   * Context name for debugging
   */
  context?: string;
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retry?: () => void;
  level?: string;
  context?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    const context = this.props.context || 'Unknown';
    const level = this.props.level || 'component';
    
    console.error(`[ErrorBoundary:${level}:${context}]`, error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.retry}
          level={this.props.level}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  retry,
  level = 'component',
  context = 'Unknown',
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Different layouts based on error level
  if (level === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <PageErrorContent 
            error={error} 
            retry={retry} 
            context={context}
            isDevelopment={isDevelopment}
            errorInfo={errorInfo}
          />
        </div>
      </div>
    );
  }

  // Component-level error - inline display
  return (
    <ErrorState
      message="Something went wrong"
      description={`Error in ${context}${error?.message ? `: ${error.message}` : ''}`}
      onRetry={retry}
      variant="card"
      icon={AlertTriangle}
      className="m-4"
    />
  );
}

/**
 * Page-level error content
 */
function PageErrorContent({
  error,
  retry,
  context,
  isDevelopment,
  errorInfo,
}: {
  error?: Error;
  retry?: () => void;
  context: string;
  isDevelopment: boolean;
  errorInfo?: React.ErrorInfo;
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Bug className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Oops! Something went wrong
          </h3>
          <p className="text-sm text-gray-600">
            We're sorry, but an error occurred in {context}
          </p>
        </div>
      </div>

      {/* Error details for development */}
      {isDevelopment && error && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Error Details:</p>
          <p className="font-mono text-xs text-gray-700 mb-2">{error.message}</p>
          {error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Stack Trace
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-gray-600">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {retry && (
          <Button
            onClick={retry}
            variant="default"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Reload Page
        </Button>
      </div>

      {/* Report issue link */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          If this problem persists, please{' '}
          <a 
            href="https://github.com/anthropics/claude-code/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            report the issue
          </a>
        </p>
      </div>
    </>
  );
}

/**
 * Higher-order component for easy error boundary wrapping
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for manual error reporting to error boundary
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    // Trigger error boundary by throwing
    throw error;
  }, []);
}