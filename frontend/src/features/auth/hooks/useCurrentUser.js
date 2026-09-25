import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const USER_QUERY_KEY = ['me'];

export function useCurrentUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await authApi.getMe();
        return data?.user || null;
      } catch (err) {
        // Treat 401/403 as unauthenticated — return null instead of throwing
        // so the rest of the app doesn't need to handle the error state
        if (err?.status === 401 || err?.status === 403) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 2;
    },
  });
}

export default useCurrentUser;
