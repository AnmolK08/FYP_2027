import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export function useLeaderboard(page = 1, limit = 20) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', page, limit],
    queryFn: async () => {
      const data = await api.getLeaderboard(page, limit);
      return data;
    },
    enabled: !!profile,
  });
}

export function useMyLeaderboardRank() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', 'me', profile?.id],
    queryFn: async () => {
      const data = await api.getMyLeaderboardRank();
      return data;
    },
    enabled: !!profile,
  });
}
