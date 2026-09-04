import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { toast } from 'sonner';

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
    onMutate: () => {
      const toastId = toast.loading('Analyzing resume keywords & ATS match...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      toast.success(data?.message || 'Resume ATS evaluation complete!', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to analyze resume', {
        id: context?.toastId,
      });
    },
  });
}
