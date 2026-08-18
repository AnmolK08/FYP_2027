import { apiClient } from '../../services/apiClient';

export const predictorApi = {
  async predictContest(currentRating, predictedRank, participants) {
    return apiClient('/predict/contest', {
      method: 'POST',
      body: {
        current_rating: currentRating,
        predicted_rank: predictedRank,
        participants: participants || 20000,
      },
    });
  },
};
