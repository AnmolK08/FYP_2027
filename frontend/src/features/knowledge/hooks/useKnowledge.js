import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

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
    onMutate: (file) => {
      const toastId = toast.loading(`Uploading ${file?.name || 'document'}...`);
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
      toast.success(data?.message || `Uploaded ${variables?.name || 'document'} successfully!`, {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to upload document', {
        id: context?.toastId,
      });
    },
  });
}

export function useDeleteKbDoc() {
  return useMutation({
    mutationFn: (id) => api.deleteKbDoc(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting document...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['kbDocs'] });
      toast.success(data?.message || 'Document deleted successfully', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to delete document', {
        id: context?.toastId,
      });
    },
  });
}

export function useAskKb() {
  return useMutation({
    mutationFn: (payload) => api.askKb(payload),
    onMutate: () => {
      const toastId = toast.loading('Searching notes...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      toast.success(data?.message || 'Answer generated successfully', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to get answer from notes', {
        id: context?.toastId,
      });
    },
  });
}
