import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

/**
 * Configure global settings for React Query.
 *
 * StaleTime: Data is considered fresh for 1 minute before refetching.
 * Retries: Queries will retry once on failure, but not for 4xx errors (e.g., Auth/NotFound).
 * Error Handling: Centralized error handling can be configured here or in the QueryProvider.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false, // Don't refetch on every window focus to preserve API calls
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          // Do not retry on client errors
          return false;
        }
        // Retry exactly once for network or 500 errors
        return failureCount < 1;
      },
      // You can also add default error handling using meta
      // meta: {
      //   errorMessage: 'Failed to fetch data'
      // }
    },
    mutations: {
      retry: false, // Do not automatically retry mutations to prevent duplicate submissions
    },
  },
});
