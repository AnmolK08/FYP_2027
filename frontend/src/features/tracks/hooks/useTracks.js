import { useQuery } from '@tanstack/react-query';
import { tracksApi } from '../tracks.api';

export function useTracks() {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      const data = await tracksApi.getTracks();
      return data.tracks;
    },
  });
}
