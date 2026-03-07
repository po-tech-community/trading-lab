import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { queryClient } from '../lib/query-client';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Global provider for TanStack React Query.
 * Wrap your root App or Layout component with this provider.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* You can add ReactQueryDevtools here for development */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      {children}
    </QueryClientProvider>
  );
}
