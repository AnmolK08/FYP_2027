import { apiClient } from '../../services/apiClient';

export const flashcardsApi = {
  async getFlashcards() {
    return apiClient('/quiz/flashcards');
  },
};
