/**
 * Client Wrapper Component
 * Ensures proper client-side rendering for workout creation forms
 */
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientWrapper ensures components only render on the client side
 * This helps prevent hydration mismatches in Next.js 15 App Router
 */
export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations('loading');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      fallback || (
        <div
          className='flex min-h-screen items-center justify-center bg-gray-50'
          role='status'
          aria-live='polite'
          aria-label={t('ariaLabel')}
        >
          <div className='flex flex-col items-center space-y-4'>
            <div
              className='h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600'
              aria-label={t('screenReader.spinner')}
            ></div>
            <div className='text-lg font-medium text-gray-600'>
              {t('workoutCreator')}
            </div>
            <div className='sr-only' aria-live='assertive'>
              {t('screenReader.loading')}
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for wrapping client components
 */
export function withClientWrapper<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const WrappedComponent = (props: T) => (
    <ClientWrapper>
      <Component {...props} />
    </ClientWrapper>
  );

  WrappedComponent.displayName = `withClientWrapper(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
