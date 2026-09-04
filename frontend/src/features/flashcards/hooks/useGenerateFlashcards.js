import { useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

/**
 * Mutation hook for generating AI-powered flashcards from a KnowledgeDoc.
 */
export function useGenerateFlashcards() {
  return useMutation({
    mutationFn: async ({ documentId, count = 10, difficulty = 'mixed' }) => {
      if (!documentId) {
        throw new Error('Please select a document to generate flashcards from.');
      }
      return await api.generateFlashcards(documentId, { count, difficulty });
    },
    onMutate: () => {
      const toastId = toast.loading('Generating flashcards...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate both general flashcards cache and document-specific query cache
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.documentId] });
      const count = data?.count || data?.flashcards?.length || 0;
      const msg = data?.message || `Generated ${count} flashcard${count === 1 ? '' : 's'} successfully!`;
      toast.success(msg, { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to generate flashcards. Please try again.', {
        id: context?.toastId,
      });
    },
  });
}
