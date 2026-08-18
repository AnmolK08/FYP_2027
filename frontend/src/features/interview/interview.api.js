import { apiClient } from '../../services/apiClient';

export const interviewApi = {
  async getInterviews() {
    return apiClient('/interviews');
  },

  async createInterview(interview) {
    return apiClient('/interviews', {
      method: 'POST',
      body: interview,
    });
  },

  async updateInterview(id, updates) {
    return apiClient(`/interviews/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },
};
