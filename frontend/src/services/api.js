import { apiClient, API_BASE_URL } from './apiClient';

export const api = {
  // Auth
  async register(name, email, password, college, department, leetcodeUsername) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, password, college, department, leetcodeUsername },
    });
  },

  async login(email, password) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async logout() {
    return apiClient('/auth/logout', { method: 'POST' });
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
  async getDashboard() {
    return apiClient('/dashboard');
  },

  async syncLeetCode() {
    return apiClient('/leetcode/sync', { method: 'POST' });
  },

  async getLeetCodeStats() {
    return apiClient('/leetcode/stats');
  },

  async getStreakSummary() {
    return apiClient('/activity/streaks');
  },

  async getActivity() {
    return apiClient('/activity');
  },

  async checkIn() {
    return apiClient('/activity/checkin', { method: 'POST' });
  },

  // Leaderboard
  async getLeaderboard(page = 1, limit = 20) {
    return apiClient(`/leaderboard?page=${page}&limit=${limit}`);
  },

  async getMyLeaderboardRank() {
    return apiClient('/leaderboard/me');
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
    return apiClient('/knowledge/');
  },

  async uploadKbDoc(file) {
    // Extract text content based on file type
    const ext = file.name.split('.').pop().toLowerCase();
    let content;

    if (ext === 'docx') {
      // .docx is a ZIP archive — must use mammoth to extract text
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      content = result.value;
    } else if (ext === 'pdf') {
      // PDF binary — must use pdfjs-dist to extract text
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        pages.push(textContent.items.map((item) => item.str).join(' '));
      }
      content = pages.join('\n\n');
    } else {
      // Plain text files (.txt, .md) — readAsText is fine
      content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result || '');
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsText(file);
      });
    }

    // Strip null bytes to prevent PostgreSQL errors
    content = content.replace(/\0/g, '');

    return apiClient('/knowledge/upload', {
      method: 'POST',
      body: {
        title: file.name,
        content,
        filename: file.name,
        size: file.size,
      },
    });
  },

  async deleteKbDoc(id) {
    return apiClient(`/knowledge/${id}`, { method: 'DELETE' });
  },

  async askKb({ question, docIds }) {
    return apiClient('/knowledge/ask', {
      method: 'POST',
      body: { question, docIds },
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

  async getRoles() {
    return apiClient('/resume/roles');
  },

  // System Design
  async getSdTopics() {
    return apiClient('/sd/topics');
  },

  async getTopics() {
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