import { apiClient, API_BASE_URL } from '../../services/apiClient';

export const knowledgeApi = {
  async getDocs() {
    return apiClient('/knowledge/docs');
  },

  async uploadDoc(file) {
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

  async deleteDoc(id) {
    return apiClient(`/knowledge/docs/${id}`, { method: 'DELETE' });
  },

  async ask(question) {
    return apiClient('/knowledge/ask', {
      method: 'POST',
      body: { question },
    });
  },
};
