import { apiClient } from '../../services/apiClient';

export const tracksApi = {
  async getTracks() {
    return apiClient('/tracks');
  },
};
