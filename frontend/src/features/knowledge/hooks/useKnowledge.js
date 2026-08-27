import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';

export function useKbDocs() {
  return useQuery({
    queryKey: ['kbDocs'],
    queryFn: async () => {
      const data = await api.getKbDocs();
      return data.docs;
    },
  });
}

export function useUploadKbDoc() {
  return useMutation({
    mutationFn: (file) => api.uploadKbDoc(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useDeleteKbDoc() {
  return useMutation({
    mutationFn: (id) => api.deleteKbDoc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useAskKb() {
  return useMutation({
    mutationFn: (payload) => api.askKb(payload),
  });
}
