import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../services/tokenStore';
import { USER_QUERY_KEY } from './useCurrentUser';
import { toast } from 'sonner';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const data = await authApi.login(email, password);
      return data;
    },
    onMutate: () => {
      const toastId = toast.loading('Signing in...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      if (data?.accessToken) {
        tokenStore.setAccessToken(data.accessToken);
      }
      if (data?.user) {
        queryClient.setQueryData(USER_QUERY_KEY, data.user);
      }
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      const name = data?.user?.name ? `, ${data.user.name.split(' ')[0]}` : '';
      toast.success(data?.message || `Welcome back${name}!`, {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to sign in. Please check your credentials.', {
        id: context?.toastId,
      });
    },
  });
}

export default useLogin;
