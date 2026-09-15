/**
 * usePlatformDashboard.js
 *
 * TanStack Query hooks for platform-specific dashboard views.
 *
 * useLeetcodeDashboard()   → GET /api/dashboard/leetcode
 * useCodeforcesDashboard() → GET /api/dashboard/codeforces
 *
 * Both return:
 *   { platform, connected, synced, user, stats }
 *
 * `stats` is null when the user has never synced that platform.
 * `connected` is true when the username field is set in the profile.
 * The combined dashboard (useDashboard) remains unchanged.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export const platformDashboardKeys = {
  leetcode:   (userId) => ['platform-dashboard', 'leetcode',   userId],
  codeforces: (userId) => ['platform-dashboard', 'codeforces', userId],
};

/**
 * LeetCode-only platform dashboard for the authenticated user.
 */
export function useLeetcodeDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: platformDashboardKeys.leetcode(user?.id),
    queryFn:  () => api.getLeetcodeDashboard(),
    enabled:  !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Codeforces-only platform dashboard for the authenticated user.
 */
export function useCodeforcesDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: platformDashboardKeys.codeforces(user?.id),
    queryFn:  () => api.getCodeforcesDashboard(),
    enabled:  !!user,
    staleTime: 1000 * 60 * 2,
  });
}
