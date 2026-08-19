import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';

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
  });
}

export function useGenerateWeaknessPlan() {
  return useMutation({
    mutationFn: () => api.generateWeaknessPlan(),
  });
}
