import { apiClient } from '../../services/apiClient';

export const profileApi = {
  async updateProfile(updates) {
    return apiClient('/users/me', {
      method: 'PATCH',
      body: updates,
    });
  },

  async syncLeetCode() {
    return apiClient('/leetcode/sync', { method: 'POST' });
  },

  async getLeetCodeStats() {
    return apiClient('/leetcode/stats');
  },

  async getActivity() {
    return apiClient('/activity');
  },

  async getStreakSummary() {
    return apiClient('/streak/summary');
  },

  async checkIn() {
    return apiClient('/activity/checkin', { method: 'POST' });
  },
};
