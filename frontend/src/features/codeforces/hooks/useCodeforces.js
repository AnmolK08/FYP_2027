/**
 * useCodeforces.js
 *
 * TanStack Query hooks for the Codeforces feature.
 * Mirrors the patterns in features/profile/hooks/useUserStats.js.
 *
 * Exports:
 *   useCodeforcesStats  – read stored CF stats for the authenticated user
 *   useSyncCodeforces   – mutation to trigger a CF sync
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../auth/hooks/useAuth';
import { queryClient } from '../../../services/queryClient';
import { syncCodeforces, getCodeforcesStats } from '../api/codeforcesApi';

// ─── Query key factory ────────────────────────────────────────────────────────
// Centralised so all invalidations target the same key shape.
export const codeforcesKeys = {
  stats: (userId) => ['codeforces-stats', userId],
};

// ─── useCodeforcesStats ───────────────────────────────────────────────────────

/**
 * Fetches the stored CodeforcesStats for the authenticated user.
 *
 * Returns:
 *   data.stats  – CodeforcesStats object, or null when never synced
 *   isLoading   – true while the first fetch is in-flight
 *   isError     – true when the request failed (network / auth)
 *   error       – Error object with .message
 *
 * staleTime 2 min — avoids unnecessary refetches on tab focus.
 */
export function useCodeforcesStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: codeforcesKeys.stats(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const data = await getCodeforcesStats();
      return data.stats; // null when never synced — handled in UI
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

// ─── useSyncCodeforces ────────────────────────────────────────────────────────

/**
 * Mutation hook to trigger a Codeforces sync for the authenticated user.
 *
 * On success:  invalidates codeforces-stats and dashboard queries, shows toast.
 * On 400:      "Codeforces username not set" — prompts user to update profile.
 * On 404:      "Handle not found on Codeforces" — handle is invalid.
 * On 409:      "Sync already in progress" — tells user to wait.
 * On 429:      Rate limit from Codeforces.
 * On 502/504:  Codeforces API unreachable.
 */
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
      // Invalidate all queries that embed CF data
      queryClient.invalidateQueries({ queryKey: codeforcesKeys.stats(user?.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success(data?.message || 'Codeforces profile synced successfully', {
        id: context?.toastId,
      });
    },

    onError: (err, _variables, context) => {
      // Provide actionable error messages for common CF-specific failures
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
