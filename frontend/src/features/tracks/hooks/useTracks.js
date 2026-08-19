import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useTracks() {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      const data = await api.getTracks();
      return data.tracks;
    },
  });
}
