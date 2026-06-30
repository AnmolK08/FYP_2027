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
  async register(name, email, password, college, department, leetcode_handle) {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: { name, email, password, college, department, leetcode_handle },
    });
    if (data.token || data.access_token) {
      localStorage.setItem('token', data.token || data.access_token);
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
    await apiCall('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
  },

  async getMe() {
    return apiCall('/auth/me');
  },

  async updateProfile(updates) {
    return apiCall('/users/me', {
      method: 'PATCH',
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

  async getChatHistory(sessionId) {
    return apiCall(`/mentor/history/${sessionId}`);
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
    return apiCall('/knowledge/docs');
  },

  async uploadKbDoc(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/knowledge/upload`, {
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
    return apiCall(`/knowledge/docs/${id}`, { method: 'DELETE' });
  },

  async askKb(question) {
    return apiCall('/knowledge/ask', {
      method: 'POST',
      body: { question },
    });
  },

  async getStreakSummary() {
    return apiCall('/streak/summary');
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

  // DSA Bank (M4)
  async getProblems(difficulty, tag, q) {
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);
    return apiCall(`/problems?${params}`);
  },

  // Resume Builder (M6)
  async scoreResume(text, targetRole) {
    return apiCall('/resume/score', {
      method: 'POST',
      body: { text, target_role: targetRole },
    });
  },

  async getResumeRoles() {
    return apiCall('/resume/roles');
  },

  // System Design (M7)
  async getSdTopics() {
    return apiCall('/sd/topics');
  },

  // Contest Predictor (M9)
  async predictContest(currentRating, predictedRank, participants) {
    return apiCall('/predict/contest', {
      method: 'POST',
      body: {
        current_rating: currentRating,
        predicted_rank: predictedRank,
        participants: participants || 20000,
      },
    });
  },

  // Flashcards (M11)
  async getFlashcards() {
    return apiCall('/quiz/flashcards');
  },

  // Learning Tracks (M12)
  async getTracks() {
    return apiCall('/tracks');
  },

  // Activity (streaks)
  async getActivity() {
    return apiCall('/activity');
  },

  // Health check
  async health() {
    return apiCall('/');
  },

  // Streaming chat for mentor
  async streamChat(message, sessionId, onChunk, onDone, onError) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Chat failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              if (onDone) onDone();
              return;
            }
            if (data.startsWith('[ERROR]')) {
              if (onError) onError(data.slice(7));
              return;
            }
            if (onChunk) onChunk(data);
          } else if (line.startsWith('event: meta')) {
            // Metadata event, can extract session_id if needed
          }
        }
      }
    } catch (err) {
      if (onError) onError(err.message);
      throw err;
    }
  },
};

export default api;
