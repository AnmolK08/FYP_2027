import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export function useLeaderboard(scope = 'global') {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', scope, profile?.college, profile?.department],
    queryFn: async () => {
      const data = await api.getLeaderboard(scope, 'universal_score');
      return data.leaderboard;
    },
    enabled: !!profile,
  });
}
