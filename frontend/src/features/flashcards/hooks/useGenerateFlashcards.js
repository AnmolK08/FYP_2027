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
    onSuccess: (data, variables) => {
      // Invalidate both general flashcards cache and document-specific query cache
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.documentId] });
      toast.success(
        `Generated ${data?.count || data?.flashcards?.length || 0} flashcards successfully!`
      );
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to generate flashcards. Please try again.');
    },
  });
}
