import { apiClient } from '../../../services/apiClient';

export const authApi = {
  async register({ name, email, password, college, department, leetcodeUsername }) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: {
        name,
        email,
        password,
        college,
        department,
        leetcodeUsername,
      },
    });
  },

  async login(email, password) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async refresh() {
    return apiClient('/auth/refresh', {
      method: 'POST',
    });
  },

  async logout() {
    return apiClient('/auth/logout', {
      method: 'POST',
    });
  },

  async getMe() {
    return apiClient('/auth/me');
  },
};

export default authApi;
