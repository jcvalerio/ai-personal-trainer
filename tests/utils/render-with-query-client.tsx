import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithQueryClient(ui: ReactElement, options?: RenderOptions) {
  const queryClient = createQueryClient();

  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    options
  );

  return {
    ...result,
    queryClient,
  };
}
