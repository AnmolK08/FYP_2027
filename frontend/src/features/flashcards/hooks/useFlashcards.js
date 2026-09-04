import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

/**
 * Hook to fetch user flashcards, optionally filtered by documentId and difficulty.
 */
export function useFlashcards(documentId, difficulty) {
  return useQuery({
    queryKey: ['flashcards', documentId || 'all', difficulty || 'all'],
    queryFn: async () => {
      const data = await api.getFlashcards({ documentId, difficulty });
      return data?.flashcards || [];
    },
  });
}

/**
 * Hook to delete a flashcard by ID.
 */
export function useDeleteFlashcard() {
  return useMutation({
    mutationFn: (id) => api.deleteFlashcard(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting flashcard...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success(data?.message || 'Flashcard deleted successfully', {
        id: context?.toastId,
      });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to delete flashcard', {
        id: context?.toastId,
      });
    },
  });
}

/**
 * Hook for spaced-repetition card reviews.
 */
export function useReviewFlashcard() {
  return useMutation({
    mutationFn: ({ id, rating }) => api.reviewFlashcard(id, rating),
    onError: (err) => {
      console.error('[FlashcardReview] Review logging failed:', err.message);
    },
  });
}
