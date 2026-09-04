import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../services/tokenStore';
import { USER_QUERY_KEY } from './useCurrentUser';
import { toast } from 'sonner';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await authApi.logout();
      return data;
    },
    onMutate: () => {
      const toastId = toast.loading('Signing out...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      toast.success(data?.message || 'Signed out successfully', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err?.message || 'Failed to sign out cleanly', {
        id: context?.toastId,
      });
    },
    onSettled: () => {
      tokenStore.clearAccessToken();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      queryClient.clear(); // Clear all cached server state
    },
  });
}

export default useLogout;
