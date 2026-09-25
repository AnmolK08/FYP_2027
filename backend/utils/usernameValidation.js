// Rules: 3–20 chars, lowercase letters/digits/underscores only, no reserved words.
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'api',
  'u',
  'user',
  'users',
  'profile',
  'profiles',
  'dashboard',
  'leaderboard',
  'mentor',
  'routine',
  'routines',
  'knowledge',
  'interview',
  'interviews',
  'settings',
  'login',
  'signin',
  'signup',
  'register',
  'logout',
  'auth',
  'null',
  'undefined',
  'lucy',
  'system',
  'support',
  'help',
  'terms',
  'privacy',
  'about',
  'blog',
  'status',
  'health',
  'test',
  'app',
  'dev',
  'tracks',
  'flashcards',
  'problems',
  'predictor',
  'resume',
  'sd',
  'system-design',
]);

export function validateLucyUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters long' };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters (a-z), numbers (0-9), and underscores (_)',
    };
  }

  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return { valid: false, error: `Username '${trimmed}' is reserved. Please choose another.` };
  }

  return { valid: true, error: null };
}

// Turns an arbitrary string (LeetCode handle, full name, etc.) into a valid
// Lucy username candidate. Falls back to a random suffix when nothing usable remains.
export function normalizeCandidateUsername(str) {
  if (!str || typeof str !== 'string') {
    return 'user_' + Math.random().toString(36).substring(2, 8);
  }

  let normalized = str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized.length === 0) {
    normalized = 'user_' + Math.random().toString(36).substring(2, 8);
  }

  if (normalized.length < 3) {
    normalized = (normalized + '_user').slice(0, 20);
  }

  if (normalized.length > 20) {
    normalized = normalized.slice(0, 20);
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    normalized = (normalized.slice(0, 16) + '_dev').slice(0, 20);
  }

  return normalized;
}
