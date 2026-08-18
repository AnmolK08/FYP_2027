import { useQuery, useMutation } from '@tanstack/react-query';
import { interviewApi } from '../interview.api';
import { queryClient } from '../../../services/queryClient';

export function useMockInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const data = await interviewApi.getInterviews();
      return data.interviews;
    },
  });
}

export function useCreateMockInterview() {
  return useMutation({
    mutationFn: (interview) => interviewApi.createInterview(interview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useUpdateMockInterview() {
  return useMutation({
    mutationFn: ({ id, updates }) => interviewApi.updateInterview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}
