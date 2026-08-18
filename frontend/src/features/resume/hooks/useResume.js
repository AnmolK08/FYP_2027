import { useQuery, useMutation } from '@tanstack/react-query';
import { resumeApi } from '../resume.api';

export function useResumeRoles() {
  return useQuery({
    queryKey: ['resumeRoles'],
    queryFn: async () => {
      const data = await resumeApi.getRoles();
      return data.roles;
    },
  });
}

export function useScoreResume() {
  return useMutation({
    mutationFn: ({ text, targetRole }) => resumeApi.scoreResume(text, targetRole),
  });
}
