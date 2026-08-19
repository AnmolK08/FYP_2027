import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useFlashcards() {
  return useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const data = await api.getFlashcards();
      return data.flashcards;
    },
  });
}
