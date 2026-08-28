import { apiClient } from '../../../services/apiClient';

export const authApi = {
  /**
   * Register a new user account.
   */
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

  /**
   * Log into an existing account.
   */
  async login(email, password) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  /**
   * Refresh session and retrieve a new short-lived access token.
   */
  async refresh() {
    return apiClient('/auth/refresh', {
      method: 'POST',
    });
  },

  /**
   * Log out of the account and revoke server-side session.
   */
  async logout() {
    return apiClient('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Fetch currently authenticated user identity.
   */
  async getMe() {
    return apiClient('/auth/me');
  },
};

export default authApi;
