import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/hooks/useAuth';

export function useDashboard() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await api.getDashboard();
      return data;
    },
    enabled: !!user,
  });
}
