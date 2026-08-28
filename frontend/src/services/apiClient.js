import { tokenStore } from './tokenStore';

export const API_BASE_URL = 'http://localhost:8000/api';

// Shared in-flight refresh promise to prevent multiple simultaneous refresh requests
let refreshPromise = null;

/**
 * Execute token refresh request against backend.
 * Browser automatically sends HttpOnly refresh cookie.
 */
async function executeTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send HttpOnly refresh cookie
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

  // Helper to build request config with current memory token
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
      credentials: 'include', // Always send cookies (for refresh cookie & CORS session)
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  };

  // If we don't have an access token in memory yet and this isn't an auth endpoint,
  // attempt a silent refresh first to recover the session seamlessly (e.g. on page refresh).
  if (!tokenStore.hasAccessToken() && !isAuthEndpoint) {
    try {
      await executeTokenRefresh();
    } catch {
      // If silent refresh fails, proceed to attempt the call which will cleanly 401 if unauthenticated
    }
  }

  let config = buildConfig();
  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // If 401 occurs and this is not a login/register/refresh attempt, try automatic token refresh
  if (response.status === 401 && !isAuthEndpoint) {
    try {
      const newAccessToken = await executeTokenRefresh();
      // Retry original request with newly obtained access token
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
    const error = new Error(data?.error || data?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiClient;
