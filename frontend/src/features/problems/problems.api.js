import { apiClient } from '../../services/apiClient';

export const problemsApi = {
  async getProblems(difficulty, tag, q) {
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);
    return apiClient(`/problems?${params}`);
  },
};
