import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

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
      return data;
    },
    onMutate: () => {
      const toastId = toast.loading('Syncing LeetCode profile...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['leetcode-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['streak-summary'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(data?.message || 'LeetCode profile sync queued. Data will update shortly.', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Sync failed. Please check your LeetCode handle.', {
        id: context?.toastId,
      });
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
      return await api.checkIn();
    },
    onMutate: () => {
      const toastId = toast.loading('Recording daily check-in...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['streak-summary'] });
      toast.success(data?.message || 'Checked in for today! Keep the streak alive.', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Check-in failed. Please try again.', {
        id: context?.toastId,
      });
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates) => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.updateProfile(updates);
      return data.user || data;
    },
    onMutate: () => {
      const toastId = toast.loading('Updating profile...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success(data?.message || 'Profile updated successfully!', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Update failed. Please try again.', {
        id: context?.toastId,
      });
    },
  });
}
