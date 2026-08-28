import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const USER_QUERY_KEY = ['me'];

/**
 * Hook to retrieve and cache the currently authenticated user identity.
 * Serves as the single source of truth for user profile & session data.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await authApi.getMe();
        return data?.user || null;
      } catch (err) {
        // 401/403 means user is unauthenticated
        if (err?.status === 401 || err?.status === 403) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Do not retry auth errors
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 2;
    },
  });
}

export default useCurrentUser;
