import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useSdTopics() {
  return useQuery({
    queryKey: ['sdTopics'],
    queryFn: async () => {
      const data = await api.getTopics();
      return data.topics;
    },
  });
}
