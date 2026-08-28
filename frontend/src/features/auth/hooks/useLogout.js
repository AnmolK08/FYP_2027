import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../services/tokenStore';
import { USER_QUERY_KEY } from './useCurrentUser';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Continue client-side teardown even if network fails
      }
    },
    onSettled: () => {
      tokenStore.clearAccessToken();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      queryClient.clear(); // Clear all cached server state
    },
  });
}

export default useLogout;
