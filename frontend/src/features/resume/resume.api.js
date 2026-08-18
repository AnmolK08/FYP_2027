import { apiClient } from '../../services/apiClient';

export const resumeApi = {
  async scoreResume(text, targetRole) {
    return apiClient('/resume/score', {
      method: 'POST',
      body: { text, target_role: targetRole },
    });
  },

  async getRoles() {
    return apiClient('/resume/roles');
  },
};
