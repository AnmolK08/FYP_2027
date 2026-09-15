const CF_BASE = 'https://codeforces.com/api';

// Shared fetch timeout (ms).  Codeforces can be slow under load.
const FETCH_TIMEOUT_MS = 15_000;

async function cfFetch(url) {
  let response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lucy-FYP/1.0 (educational project)' },
    });
    clearTimeout(timer);
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Codeforces API timed out');
      error.statusCode = 504;
      throw error;
    }
    const error = new Error('Unable to reach Codeforces API');
    error.statusCode = 502;
    throw error;
  }

  let body;
  try {
    body = await response.json();
  } catch {
    const error = new Error('Codeforces API returned an invalid response');
    error.statusCode = 502;
    throw error;
  }

  if (body.status !== 'OK') {
    // surface CF's own error message but sanitise it for users
    const comment = body.comment || 'Unknown Codeforces API error';

    // Handle very common "handles: User with handle X not found" comment
    if (
      comment.toLowerCase().includes('not found') ||
      comment.toLowerCase().includes('illegal')
    ) {
      const error = new Error('Codeforces user not found');
      error.statusCode = 404;
      throw error;
    }

    // Rate-limit / overload
    if (comment.toLowerCase().includes('limit') || response.status === 429) {
      const error = new Error('Codeforces API rate limit reached — please try again later');
      error.statusCode = 429;
      throw error;
    }

    const error = new Error('Codeforces API error');
    error.statusCode = 502;
    error.cfComment = comment; // logged server-side only, never sent to client
    throw error;
  }

  return body.result;
}

export const fetchUserInfo = async (handle) => {
  const url = `${CF_BASE}/user.info?handles=${encodeURIComponent(handle)}`;
  const result = await cfFetch(url);
  // result is an array; we asked for one handle
  if (!result || result.length === 0) {
    const error = new Error('Codeforces user not found');
    error.statusCode = 404;
    throw error;
  }
  return result[0];
};


export const fetchUserStatus = async (handle) => {
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 10; // safety cap — 10 000 submissions total
  let all = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const from = (page - 1) * PAGE_SIZE + 1;
    const url = `${CF_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${PAGE_SIZE}`;

    let batch;
    try {
      batch = await cfFetch(url);
    } catch (err) {
      // New accounts with no submissions return FAILED — treat as empty
      if (err.statusCode === 404) break;
      // On the first page a hard error is a real error; on later pages
      // we stop gracefully (partial data is better than nothing)
      if (page === 1) throw err;
      console.warn(`[CF Provider] user.status page ${page} failed (partial data):`, err.message);
      break;
    }

    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);

    // CF returns fewer items than PAGE_SIZE on the last page
    if (batch.length < PAGE_SIZE) break;
  }

  return all;
};

export const fetchUserRating = async (handle) => {
  const url = `${CF_BASE}/user.rating?handle=${encodeURIComponent(handle)}`;
  try {
    return await cfFetch(url);
  } catch (err) {
    // Unrated users return FAILED "Rating changes are unavailable for this user"
    if (err.statusCode === 404 || (err.cfComment && err.cfComment.toLowerCase().includes('unavailable'))) {
      return [];
    }
    throw err;
  }
};
