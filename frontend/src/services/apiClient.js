export const API_BASE_URL = 'http://localhost:8000/api';

export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // If using FormData, remove Content-Type so browser sets boundary automatically
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}
