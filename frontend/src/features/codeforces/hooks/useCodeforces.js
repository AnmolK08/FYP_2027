import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../auth/hooks/useAuth';
import { queryClient } from '../../../services/queryClient';
import { syncCodeforces, getCodeforcesStats } from '../api/codeforcesApi';

export const codeforcesKeys = {
  stats: (userId) => ['codeforces-stats', userId],
};

export function useCodeforcesStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: codeforcesKeys.stats(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const data = await getCodeforcesStats();
      return data.stats; // null when never synced — handled in the UI
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useSyncCodeforces() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return syncCodeforces();
    },

    onMutate: () => {
      const toastId = toast.loading('Syncing Codeforces profile...');
      return { toastId };
    },

    onSuccess: (data, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: codeforcesKeys.stats(user?.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(data?.message || 'Codeforces profile synced successfully', {
        id: context?.toastId,
      });
    },

    onError: (err, _variables, context) => {
      // Map CF-specific status codes to actionable messages
      let message = err.message || 'Codeforces sync failed. Please try again.';

      if (err.status === 400) {
        message = 'Codeforces username not set. Please update your profile first.';
      } else if (err.status === 404) {
        message = 'Codeforces handle not found. Please check your username.';
      } else if (err.status === 409) {
        message = 'A sync is already in progress. Please wait a moment.';
      } else if (err.status === 429) {
        message = 'Codeforces rate limit reached. Please try again in a few minutes.';
      } else if (err.status === 502 || err.status === 504) {
        message = 'Codeforces API is currently unavailable. Please try again later.';
      }

      toast.error(message, { id: context?.toastId });
    },
  });
}
