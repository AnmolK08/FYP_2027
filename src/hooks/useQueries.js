import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export function useLeetCodeStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leetcode-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await api.getLeetCodeStats();
      return data.stats;
    },
    enabled: !!user,
  });
}

export function useSyncLeetCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.syncLeetCode();
      return data.stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leetcode-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.getActivity();
      return data.activity;
    },
    enabled: !!user,
  });
}

export function useCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await api.checkIn();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.updateProfile(updates);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useLeaderboard(scope = 'global') {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', scope, profile?.college, profile?.department],
    queryFn: async () => {
      const data = await api.getLeaderboard(scope, 'universal_score');
      return data.leaderboard;
    },
    enabled: !!profile,
  });
}

export function useChatSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.getChatSessions();
      return data.sessions;
    },
    enabled: !!user,
  });
}

export function useChatMessages(sessionId) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      if (!user || !sessionId) return [];
      const data = await api.getChatMessages(sessionId);
      return data.messages;
    },
    enabled: !!user && !!sessionId,
  });
}

export function useSendChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, sessionId }) => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.sendChatMessage(message, sessionId);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useGenerateWeaknessPlan() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.generateWeaknessPlan();
      return data;
    },
  });
}

export function useKbDocs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['kb-docs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.getKbDocs();
      return data.docs;
    },
    enabled: !!user,
  });
}

export function useUploadKbDoc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      if (!user) throw new Error('Not authenticated');
      const text = await file.text();
      const data = await api.uploadKbDoc(file.name, text, file.name, file.size);
      return data.doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-docs'] });
    },
  });
}

export function useDeleteKbDoc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId) => {
      if (!user) throw new Error('Not authenticated');
      await api.deleteKbDoc(docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-docs'] });
    },
  });
}

export function useAskKb() {
  return useMutation({
    mutationFn: async ({ question, docIds }) => {
      const data = await api.askKb(question, docIds);
      return data;
    },
  });
}

export function useMockInterviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mock-interviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await api.getMockInterviews();
      return data.interviews;
    },
    enabled: !!user,
  });
}

export function useSaveMockInterview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interview) => {
      if (!user) throw new Error('Not authenticated');
      const data = await api.createMockInterview(interview);
      return data.interview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-interviews'] });
    },
  });
}

export function useUpdateMockInterview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!user) throw new Error('Not authenticated');
      await api.updateMockInterview(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-interviews'] });
    },
  });
}
