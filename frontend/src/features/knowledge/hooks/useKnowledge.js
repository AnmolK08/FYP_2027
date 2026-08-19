import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';

export function useKbDocs() {
  return useQuery({
    queryKey: ['kbDocs'],
    queryFn: async () => {
      const data = await api.getDocs();
      return data.docs;
    },
  });
}

export function useUploadKbDoc() {
  return useMutation({
    mutationFn: (file) => api.uploadDoc(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useDeleteKbDoc() {
  return useMutation({
    mutationFn: (id) => api.deleteDoc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useAskKb() {
  return useMutation({
    mutationFn: (question) => api.ask(question),
  });
}
