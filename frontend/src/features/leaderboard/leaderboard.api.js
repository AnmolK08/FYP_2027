import { apiClient } from '../../services/apiClient';

export const leaderboardApi = {
  async getLeaderboard(scope, sort) {
    return apiClient(`/leaderboard?scope=${scope}&sort=${sort}`);
  },
};
