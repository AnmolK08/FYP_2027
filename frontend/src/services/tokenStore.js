/**
 * In-Memory Access Token Store.
 * The access token is held purely in JavaScript memory and NEVER persisted to localStorage or sessionStorage.
 */
let accessToken = null;
const listeners = new Set();

export const tokenStore = {
  /**
   * Get the current in-memory access token.
   */
  getAccessToken: () => accessToken,

  /**
   * Set or update the access token in memory.
   */
  setAccessToken: (token) => {
    accessToken = token;
    listeners.forEach((listener) => listener(accessToken));
  },

  /**
   * Clear the in-memory access token (e.g. on logout or refresh expiration).
   */
  clearAccessToken: () => {
    accessToken = null;
    listeners.forEach((listener) => listener(null));
  },

  /**
   * Check if an access token currently exists in memory.
   */
  hasAccessToken: () => Boolean(accessToken),

  /**
   * Subscribe to token changes.
   */
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export default tokenStore;
