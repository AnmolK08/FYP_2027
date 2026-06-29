const API_BASE = 'http://localhost:3001/api';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  async signup(email, password, name, college, department, leetcodeUsername) {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: { email, password, name, college, department, leetcodeUsername },
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async login(email, password) {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async logout() {
    localStorage.removeItem('token');
  },

  async getMe() {
    return apiCall('/auth/me');
  },

  async updateProfile(updates) {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: updates,
    });
  },

  async syncLeetCode() {
    return apiCall('/leetcode/sync', { method: 'POST' });
  },

  async getLeetCodeStats() {
    return apiCall('/leetcode/stats');
  },

  async getLeaderboard(scope, sort) {
    return apiCall(`/leaderboard?scope=${scope}&sort=${sort}`);
  },

  async getChatSessions() {
    return apiCall('/mentor/sessions');
  },

  async getChatMessages(sessionId) {
    return apiCall(`/mentor/messages/${sessionId}`);
  },

  async sendChatMessage(message, sessionId) {
    return apiCall('/mentor/chat', {
      method: 'POST',
      body: { message, sessionId },
    });
  },

  async generateWeaknessPlan() {
    return apiCall('/mentor/weakness-plan', { method: 'POST' });
  },

  async getKbDocs() {
    return apiCall('/knowledge');
  },

  async uploadKbDoc(title, content, filename, size) {
    return apiCall('/knowledge/upload', {
      method: 'POST',
      body: { title, content, filename, size },
    });
  },

  async deleteKbDoc(id) {
    return apiCall(`/knowledge/${id}`, { method: 'DELETE' });
  },

  async askKb(question, docIds) {
    return apiCall('/knowledge/ask', {
      method: 'POST',
      body: { question, docIds },
    });
  },

  async getActivity() {
    return apiCall('/activity');
  },

  async checkIn() {
    return apiCall('/activity/checkin', { method: 'POST' });
  },

  async getMockInterviews() {
    return apiCall('/interviews');
  },

  async createMockInterview(interview) {
    return apiCall('/interviews', {
      method: 'POST',
      body: interview,
    });
  },

  async updateMockInterview(id, updates) {
    return apiCall(`/interviews/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },
};

export default api;
