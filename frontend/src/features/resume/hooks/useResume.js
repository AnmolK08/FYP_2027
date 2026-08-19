import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useResumeRoles() {
  return useQuery({
    queryKey: ['resumeRoles'],
    queryFn: async () => {
      const data = await api.getRoles();
      return data.roles;
    },
  });
}

export function useScoreResume() {
  return useMutation({
    mutationFn: ({ text, targetRole }) => api.scoreResume(text, targetRole),
  });
}
