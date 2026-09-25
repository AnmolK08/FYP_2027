import { tokenStore } from './tokenStore';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

// Single shared promise so concurrent 401s only trigger one refresh round-trip
let refreshPromise = null;

async function executeTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // sends the HttpOnly refresh cookie
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const data = await response.json();
        if (data.accessToken) {
          tokenStore.setAccessToken(data.accessToken);
          return data.accessToken;
        }
        throw new Error('No access token returned');
      } catch (err) {
        tokenStore.clearAccessToken();
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiClient(endpoint, options = {}) {
  const isAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/logout');

  const buildConfig = () => {
    const token = tokenStore.getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
      credentials: 'include', // always include cookies for refresh + CORS sessions
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  };

  // On page load the in-memory token is gone. Attempt a silent refresh so the
  // user doesn't have to log in again just because they refreshed the tab.
  if (!tokenStore.hasAccessToken() && !isAuthEndpoint) {
    try {
      await executeTokenRefresh();
    } catch {
      // If silent refresh fails, let the request proceed and 401 cleanly
    }
  }

  let config = buildConfig();
  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // On 401, try one token refresh before giving up
  if (response.status === 401 && !isAuthEndpoint) {
    try {
      const newAccessToken = await executeTokenRefresh();
      config = buildConfig();
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (refreshErr) {
      tokenStore.clearAccessToken();
      const error = new Error('Session expired. Please log in again.');
      error.status = 401;
      throw error;
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      const error = new Error('Network response was not ok');
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    let message = 'Request failed';
    if (typeof data?.error === 'string') {
      message = data.error;
    } else if (typeof data?.error?.message === 'string') {
      message = data.error.message;
    } else if (typeof data?.message === 'string') {
      message = data.message;
    } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
      message = data.errors
        .map((e) => (typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e)))
        .join(', ');
    } else if (typeof data === 'string') {
      message = data;
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function extractErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message !== '[object Object]') return error.message;
  if (typeof error.data?.error === 'string') return error.data.error;
  if (typeof error.data?.error?.message === 'string') return error.data.error.message;
  if (typeof error.data?.message === 'string') return error.data.message;
  if (Array.isArray(error.data?.errors) && error.data.errors.length > 0) {
    return error.data.errors
      .map((e) => (typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e)))
      .join(', ');
  }
  return fallback;
}

export default apiClient;
