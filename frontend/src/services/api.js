import { apiClient, API_BASE_URL } from './apiClient';

export const api = {
  // Auth
  async register(name, email, password, college, department, leetcodeUsername) {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, password, college, department, leetcode_handle: leetcodeUsername },
    });
    if (data.token || data.access_token) {
      localStorage.setItem('token', data.token || data.access_token);
    }
    return data;
  },

  async login(email, password) {
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

  async updateProfile(updates) {
    return apiClient('/users/me', {
      method: 'PATCH',
      body: updates,
    });
  },

  // Profile / LeetCode
  async syncLeetCode() {
    return apiClient('/leetcode/sync', { method: 'POST' });
  },

  async getLeetCodeStats() {
    return apiClient('/leetcode/stats');
  },

  async getStreakSummary() {
    return apiClient('/streak/summary');
  },

  async getActivity() {
    return apiClient('/activity');
  },

  async checkIn() {
    return apiClient('/activity/checkin', { method: 'POST' });
  },

  // Leaderboard
  async getLeaderboard(scope, sort) {
    return apiClient(`/leetcode/leaderboard?scope=${scope}&sort=${sort}`);
  },

  // Mentor / Chat
  async getChatSessions() {
    return apiClient('/mentor/sessions');
  },

  async getChatHistory(sessionId) {
    return apiClient(`/mentor/history/${sessionId}`);
  },

  async sendChatMessage(message, sessionId) {
    return apiClient('/mentor/chat', {
      method: 'POST',
      body: { message, sessionId },
    });
  },

  async generateWeaknessPlan() {
    return apiClient('/mentor/weakness-plan', { method: 'POST' });
  },

  // Knowledge
  async getKbDocs() {
    return apiClient('/knowledge/docs');
  },

  async uploadKbDoc(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/knowledge/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  },

  async deleteKbDoc(id) {
    return apiClient(`/knowledge/docs/${id}`, { method: 'DELETE' });
  },

  async askKb(question) {
    return apiClient('/knowledge/ask', {
      method: 'POST',
      body: { question },
    });
  },

  // Mock Interviews
  async getMockInterviews() {
    return apiClient('/interviews');
  },

  async createMockInterview(interview) {
    return apiClient('/interviews', {
      method: 'POST',
      body: interview,
    });
  },

  async updateMockInterview(id, updates) {
    return apiClient(`/interviews/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },

  // Problems
  async getProblems(difficulty, tag, q) {
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);
    return apiClient(`/problems?${params}`);
  },

  // Resume
  async scoreResume(text, targetRole) {
    return apiClient('/resume/score', {
      method: 'POST',
      body: { text, target_role: targetRole },
    });
  },

  async getResumeRoles() {
    return apiClient('/resume/roles');
  },

  // System Design
  async getSdTopics() {
    return apiClient('/sd/topics');
  },

  // Predictor
  async predictContest(currentRating, predictedRank, participants) {
    return apiClient('/ai/contest', {
      method: 'POST',
      body: {
        current_rating: currentRating,
        predicted_rank: predictedRank,
        participants: participants || 20000,
      },
    });
  },

  // Flashcards
  async getFlashcards() {
    return apiClient('/quiz/flashcards');
  },

  // Tracks
  async getTracks() {
    return apiClient('/tracks');
  },
};