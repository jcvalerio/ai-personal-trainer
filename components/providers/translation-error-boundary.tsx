'use client';

import React from 'react';

interface TranslationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface TranslationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

export class TranslationErrorBoundary extends React.Component<
  TranslationErrorBoundaryProps,
  TranslationErrorBoundaryState
> {
  constructor(props: TranslationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TranslationErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Translation Error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent =
        this.props.fallback || DefaultTranslationFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultTranslationFallback({
  error,
  retry,
}: {
  error?: Error;
  retry?: () => void;
}) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md rounded-lg border border-gray-200 bg-white p-6'>
        <div className='mb-4 flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
            <span className='text-xl text-red-600'>⚠️</span>
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Translation Error
            </h3>
            <p className='text-sm text-gray-600'>Failed to load translations</p>
          </div>
        </div>

        {error && (
          <div className='mb-4 rounded-lg bg-gray-50 p-3'>
            <p className='font-mono text-xs text-gray-700'>{error.message}</p>
          </div>
        )}

        <div className='flex gap-3'>
          <button
            onClick={retry}
            className='flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className='flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700'
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
