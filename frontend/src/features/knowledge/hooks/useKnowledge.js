import { useQuery, useMutation } from '@tanstack/react-query';
import { knowledgeApi } from '../knowledge.api';
import { queryClient } from '../../../services/queryClient';

export function useKbDocs() {
  return useQuery({
    queryKey: ['kbDocs'],
    queryFn: async () => {
      const data = await knowledgeApi.getDocs();
      return data.docs;
    },
  });
}

export function useUploadKbDoc() {
  return useMutation({
    mutationFn: (file) => knowledgeApi.uploadDoc(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useDeleteKbDoc() {
  return useMutation({
    mutationFn: (id) => knowledgeApi.deleteDoc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
    },
  });
}

export function useAskKb() {
  return useMutation({
    mutationFn: (question) => knowledgeApi.ask(question),
  });
}
