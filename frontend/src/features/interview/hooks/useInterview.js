import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

export function useMockInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const data = await api.getMockInterviews();
      return data.interviews;
    },
  });
}

export function useCreateMockInterview() {
  return useMutation({
    mutationFn: (interview) => api.createMockInterview(interview),
    onMutate: () => {
      const toastId = toast.loading('Initializing mock interview...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      toast.success(data?.message || 'Mock interview session initialized', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to start interview', {
        id: context?.toastId,
      });
    },
  });
}

export function useUpdateMockInterview() {
  return useMutation({
    mutationFn: ({ id, updates }) => api.updateMockInterview(id, updates),
    onMutate: ({ updates }) => {
      const isEnding = updates?.status === 'completed' || updates?.status === 'abandoned';
      const toastId = toast.loading(isEnding ? 'Finalizing interview session...' : 'Saving interview progress...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      const updates = variables?.updates;
      let msg = data?.message;
      if (!msg) {
        if (updates?.status === 'completed') {
          msg = `Interview completed! Score: ${updates?.score ?? 0}%`;
        } else if (updates?.status === 'abandoned') {
          msg = 'Interview ended';
        } else {
          msg = 'Interview updated successfully';
        }
      }
      toast.success(msg, { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to update interview', {
        id: context?.toastId,
      });
    },
  });
}
