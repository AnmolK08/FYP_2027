import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function usePublicProfile(username) {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;
      return await api.getPublicProfile(username);
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
