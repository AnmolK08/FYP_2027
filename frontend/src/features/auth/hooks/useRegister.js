import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../services/tokenStore';
import { USER_QUERY_KEY } from './useCurrentUser';
import { toast } from 'sonner';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const data = await authApi.register(userData);
      return data;
    },
    onMutate: () => {
      const toastId = toast.loading('Creating your account...');
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

      toast.success(data?.message || 'Account created successfully! Welcome to PrepSphere.', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to create account. Please check your details.', {
        id: context?.toastId,
      });
    },
  });
}

export default useRegister;
