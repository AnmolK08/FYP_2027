import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

export function useChatSessions() {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const data = await api.getChatSessions();
      return data.sessions;
    },
  });
}

export function useChatMessages(sessionId) {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const data = await api.getChatHistory(sessionId);
      return data.messages;
    },
    enabled: !!sessionId,
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: ({ message, sessionId }) => api.sendChatMessage(message, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send message');
    },
  });
}

export function useGenerateWeaknessPlan() {
  return useMutation({
    mutationFn: () => api.generateWeaknessPlan(),
    onMutate: () => {
      const toastId = toast.loading('Analyzing weaknesses and generating study plan...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      toast.success(data?.message || 'Custom study plan generated!', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to generate study plan. Make sure LeetCode is synced.', {
        id: context?.toastId,
      });
    },
  });
}
