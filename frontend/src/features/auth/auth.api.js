import { apiClient } from '../../services/apiClient';

export const authApi = {
  async register({ name, email, password, college, department, leetcodeUsername }) {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, password, college, department, leetcode_handle: leetcodeUsername },
    });
    if (data.token || data.access_token) {
      localStorage.setItem('token', data.token || data.access_token);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async logout() {
    await apiClient('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
  },

  async getMe() {
    return apiClient('/auth/me');
  },
};
