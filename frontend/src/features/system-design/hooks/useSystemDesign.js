import { useQuery } from '@tanstack/react-query';
import { systemDesignApi } from '../system-design.api';

export function useSdTopics() {
  return useQuery({
    queryKey: ['sdTopics'],
    queryFn: async () => {
      const data = await systemDesignApi.getTopics();
      return data.topics;
    },
  });
}
