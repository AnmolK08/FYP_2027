import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../services/tokenStore';
import { USER_QUERY_KEY } from './useCurrentUser';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const data = await authApi.register(userData);
      return data;
    },
    onSuccess: (data) => {
      if (data?.accessToken) {
        tokenStore.setAccessToken(data.accessToken);
      }
      if (data?.user) {
        queryClient.setQueryData(USER_QUERY_KEY, data.user);
      }
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export default useRegister;
