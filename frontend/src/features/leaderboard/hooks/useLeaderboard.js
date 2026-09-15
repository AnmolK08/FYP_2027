/**
 * useLeaderboard.js
 *
 * TanStack Query hooks for the three Lucy leaderboard types:
 *   'lucy'       — combined LeetCode + Codeforces score
 *   'leetcode'   — LeetCode score only
 *   'codeforces' — Codeforces score only
 *
 * All hooks accept a `type` argument that defaults to 'lucy' so existing
 * call-sites that pass no type continue to work without changes.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export const LEADERBOARD_TYPES = ['lucy', 'leetcode', 'codeforces'];

export const LEADERBOARD_LABELS = {
  lucy:       'Lucy Score',
  leetcode:   'LeetCode',
  codeforces: 'Codeforces',
};

// ─── Key factory ──────────────────────────────────────────────────────────────
export const leaderboardKeys = {
  list:   (type, page, limit) => ['leaderboard', type, page, limit],
  me:     (type, userId)      => ['leaderboard', 'me', type, userId],
  nearby: (type, userId)      => ['leaderboard', 'nearby', type, userId],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Paginated leaderboard for a given type.
 *
 * @param {'lucy'|'leetcode'|'codeforces'} type
 * @param {number} page
 * @param {number} limit
 */
export function useLeaderboard(type = 'lucy', page = 1, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.list(type, page, limit),
    queryFn:  () => api.getLeaderboard(page, limit, type),
    enabled:  !!user,
    staleTime: 1000 * 60, // 1 minute
    keepPreviousData: true,
  });
}

/**
 * Current user's rank and score for a given leaderboard type.
 *
 * @param {'lucy'|'leetcode'|'codeforces'} type
 */
export function useMyLeaderboardRank(type = 'lucy') {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.me(type, user?.id),
    queryFn:  () => api.getMyLeaderboardRank(type),
    enabled:  !!user,
    staleTime: 1000 * 60,
  });
}

/**
 * Nearby users (the rows immediately above and below the current user).
 * Useful for an "around me" section alongside the main table.
 *
 * @param {'lucy'|'leetcode'|'codeforces'} type
 * @param {number} window  — rows above and below (default 2)
 */
export function useNearbyUsers(type = 'lucy', window = 2) {
  const { user } = useAuth();

  return useQuery({
    queryKey: leaderboardKeys.nearby(type, user?.id),
    queryFn:  () => api.getNearbyUsers(type, window),
    enabled:  !!user,
    staleTime: 1000 * 60,
  });
}
