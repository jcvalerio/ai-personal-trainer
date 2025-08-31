/**
 * React Query Provider Configuration
 * Provides React Query client with optimized settings for the AI Personal Trainer app
 */
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryErrorBoundary } from './query-error-boundary';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Data is kept in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect for most queries (will be overridden per query as needed)
      refetchOnReconnect: true,
      // Network mode - fail fast on network errors
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Global error handler for queries
queryClient.setQueryDefaults(['error'], {
  retry: (failureCount, error: any) => {
    // Don't retry on 401/403 errors (authentication/authorization)
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }
    // Don't retry on 4xx client errors (except 401/403)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    // Retry server errors up to 3 times
    return failureCount < 3;
  },
});

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary context="React Query Operations">
        {children}
        {/* Show React Query DevTools in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools 
            initialIsOpen={false}
            position="bottom"
            buttonPosition="bottom-right"
          />
        )}
      </QueryErrorBoundary>
    </QueryClientProvider>
  );
}

// Export the query client for use in other files if needed
export { queryClient };