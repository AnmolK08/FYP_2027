// Access token lives purely in JS memory — never written to localStorage or sessionStorage.
// This prevents XSS from being able to read it. The refresh token lives in an HttpOnly cookie.

let accessToken = null;
const listeners = new Set();

export const tokenStore = {
  getAccessToken: () => accessToken,

  setAccessToken: (token) => {
    accessToken = token;
    listeners.forEach((listener) => listener(accessToken));
  },

  clearAccessToken: () => {
    accessToken = null;
    listeners.forEach((listener) => listener(null));
  },

  hasAccessToken: () => Boolean(accessToken),

  // Returns an unsubscribe function
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export default tokenStore;
