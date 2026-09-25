import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export const LEADERBOARD_TYPES = ['lucy', 'leetcode', 'codeforces'];

export const LEADERBOARD_LABELS = {
  lucy:       'Lucy Score',
  leetcode:   'LeetCode',
  codeforces: 'Codeforces',
};

export const leaderboardKeys = {
  list:   (type, page, limit) => ['leaderboard', type, page, limit],
  me:     (type, userId)      => ['leaderboard', 'me', type, userId],
  nearby: (type, userId)      => ['leaderboard', 'nearby', type, userId],
};

export function useLeaderboard(type = 'lucy', page = 1, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.list(type, page, limit),
    queryFn:  () => api.getLeaderboard(page, limit, type),
    enabled:  !!user,
    staleTime: 1000 * 60,
    keepPreviousData: true, // keeps the previous page visible while the next loads
  });
}

export function useMyLeaderboardRank(type = 'lucy') {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.me(type, user?.id),
    queryFn:  () => api.getMyLeaderboardRank(type),
    enabled:  !!user,
    staleTime: 1000 * 60,
  });
}

export function useNearbyUsers(type = 'lucy', window = 2) {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.nearby(type, user?.id),
    queryFn:  () => api.getNearbyUsers(type, window),
    enabled:  !!user,
    staleTime: 1000 * 60,
  });
}
