/**
 * Username validation rules:
 * - 3 to 20 characters
 * - Only lowercase English letters (a-z), digits (0-9), and underscores (_)
 * - Must not be a reserved system route or keyword
 */

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

/**
 * Validates a Lucy username.
 * Returns { valid: boolean, error?: string }
 */
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

/**
 * Normalizes an arbitrary string (like a LeetCode handle or full name)
 * into a valid Lucy username candidate.
 */
export function normalizeCandidateUsername(str) {
  if (!str || typeof str !== 'string') {
    return 'user_' + Math.random().toString(36).substring(2, 8);
  }

  // Lowercase and replace invalid characters with underscore
  let normalized = str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // strip leading/trailing underscores

  if (normalized.length === 0) {
    normalized = 'user_' + Math.random().toString(36).substring(2, 8);
  }

  // Ensure min length of 3
  if (normalized.length < 3) {
    normalized = (normalized + '_user').slice(0, 20);
  }

  // Ensure max length of 20
  if (normalized.length > 20) {
    normalized = normalized.slice(0, 20);
  }

  // If matches reserved keyword, append suffix
  if (RESERVED_USERNAMES.has(normalized)) {
    normalized = (normalized.slice(0, 16) + '_dev').slice(0, 20);
  }

  return normalized;
}
