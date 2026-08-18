import { apiClient } from '../../services/apiClient';

export const systemDesignApi = {
  async getTopics() {
    return apiClient('/sd/topics');
  },
};
