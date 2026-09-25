const CF_BASE = 'https://codeforces.com/api';

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
    const comment = body.comment || 'Unknown Codeforces API error';

    if (
      comment.toLowerCase().includes('not found') ||
      comment.toLowerCase().includes('illegal')
    ) {
      const error = new Error('Codeforces user not found');
      error.statusCode = 404;
      throw error;
    }

    if (comment.toLowerCase().includes('limit') || response.status === 429) {
      const error = new Error('Codeforces API rate limit reached — please try again later');
      error.statusCode = 429;
      throw error;
    }

    const error = new Error('Codeforces API error');
    error.statusCode = 502;
    error.cfComment = comment;
    throw error;
  }

  return body.result;
}

export const fetchUserInfo = async (handle) => {
  const url = `${CF_BASE}/user.info?handles=${encodeURIComponent(handle)}`;
  const result = await cfFetch(url);
  if (!result || result.length === 0) {
    const error = new Error('Codeforces user not found');
    error.statusCode = 404;
    throw error;
  }
  return result[0];
};

export const fetchUserStatus = async (handle) => {
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 10;
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
      // On later pages, partial data is better than aborting the whole sync
      if (page === 1) throw err;
      console.warn(`[CF Provider] user.status page ${page} failed (partial data):`, err.message);
      break;
    }

    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);

    if (batch.length < PAGE_SIZE) break;
  }

  return all;
};

export const fetchUserRating = async (handle) => {
  const url = `${CF_BASE}/user.rating?handle=${encodeURIComponent(handle)}`;
  try {
    return await cfFetch(url);
  } catch (err) {
    // Unrated users return FAILED — return empty array rather than throwing
    if (err.statusCode === 404 || (err.cfComment && err.cfComment.toLowerCase().includes('unavailable'))) {
      return [];
    }
    throw err;
  }
};
