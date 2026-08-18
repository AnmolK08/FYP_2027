import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../leaderboard.api';
import { useAuth } from '../../../contexts/AuthContext';

export function useLeaderboard(scope = 'global') {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', scope, profile?.college, profile?.department],
    queryFn: async () => {
      const data = await leaderboardApi.getLeaderboard(scope, 'universal_score');
      return data.leaderboard;
    },
    enabled: !!profile,
  });
}
