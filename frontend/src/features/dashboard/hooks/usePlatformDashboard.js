import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export const platformDashboardKeys = {
  leetcode:   (userId) => ['platform-dashboard', 'leetcode',   userId],
  codeforces: (userId) => ['platform-dashboard', 'codeforces', userId],
};

export function useLeetcodeDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: platformDashboardKeys.leetcode(user?.id),
    queryFn:  () => api.getLeetcodeDashboard(),
    enabled:  !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCodeforcesDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: platformDashboardKeys.codeforces(user?.id),
    queryFn:  () => api.getCodeforcesDashboard(),
    enabled:  !!user,
    staleTime: 1000 * 60 * 2,
  });
}
