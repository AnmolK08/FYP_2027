import { useQuery } from '@tanstack/react-query';
import { problemsApi } from '../problems.api';

export function useProblems(difficulty, tag, searchStr) {
  return useQuery({
    queryKey: ['problems', difficulty, tag, searchStr],
    queryFn: async () => {
      const data = await problemsApi.getProblems(difficulty, tag, searchStr);
      return data.problems;
    },
  });
}
