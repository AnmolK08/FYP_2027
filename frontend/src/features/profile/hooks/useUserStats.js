import { useQuery, useMutation } from '@tanstack/react-query';
import { profileApi } from '../profile.api';
import { useAuth } from '../../../contexts/AuthContext';
import { queryClient } from '../../../services/queryClient';

export function useLeetCodeStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['leetcode-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await profileApi.getLeetCodeStats();
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
      const data = await profileApi.syncLeetCode();
      return data.stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leetcode-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
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
      const data = await profileApi.getActivity();
      return data.activity;
    },
    enabled: !!user,
  });
}

export function useCheckIn() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await profileApi.checkIn();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates) => {
      if (!user) throw new Error('Not authenticated');
      const data = await profileApi.updateProfile(updates);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
