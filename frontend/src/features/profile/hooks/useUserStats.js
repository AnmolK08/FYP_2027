import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';
import { queryClient } from '../../../services/queryClient';

export function useLeetCodeStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['leetcode-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await api.getLeetCodeStats();
      return data.stats;
    },
    enabled: !!user,
  });
}

export function useSyncLeetCode() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.syncLeetCode();
      return data.stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leetcode-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['streak-summary'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useActivity() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.getActivity();
      return data.activity;
    },
    enabled: !!user,
  });
}

export function useStreakSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['streak-summary', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return api.getStreakSummary();
    },
    enabled: !!user,
  });
}

export function useCheckIn() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await api.checkIn();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['streak-summary'] });
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates) => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.updateProfile(updates);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
