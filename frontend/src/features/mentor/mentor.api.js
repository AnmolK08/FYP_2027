import { apiClient, API_BASE_URL } from '../../services/apiClient';

export const mentorApi = {
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

  async streamChat(message, sessionId, onChunk, onDone, onError) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/mentor/chat`, {
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
          }
        }
      }
    } catch (err) {
      if (onError) onError(err.message);
      throw err;
    }
  },
};
