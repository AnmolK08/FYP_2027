import { useQuery } from '@tanstack/react-query';
import { flashcardsApi } from '../flashcards.api';

export function useFlashcards() {
  return useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const data = await flashcardsApi.getFlashcards();
      return data.flashcards;
    },
  });
}
