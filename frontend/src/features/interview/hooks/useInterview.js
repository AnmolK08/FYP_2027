import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';

export function useMockInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const data = await api.getInterviews();
      return data.interviews;
    },
  });
}

export function useCreateMockInterview() {
  return useMutation({
    mutationFn: (interview) => api.createInterview(interview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useUpdateMockInterview() {
  return useMutation({
    mutationFn: ({ id, updates }) => api.updateInterview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}
