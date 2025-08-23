/**
 * Client Wrapper Component
 * Ensures proper client-side rendering for workout creation forms
 */
'use client';

import { ReactNode, useState, useEffect } from 'react';

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      fallback || (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
          <div className='h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600'></div>
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
