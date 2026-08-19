import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useProblems(difficulty, tag, searchStr) {
  return useQuery({
    queryKey: ['problems', difficulty, tag, searchStr],
    queryFn: async () => {
      const data = await api.getProblems(difficulty, tag, searchStr);
      return data.problems;
    },
  });
}
