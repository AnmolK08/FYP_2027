import prisma from '../config/prisma.js';
import { invalidateDashboardCache } from './dashboard.service.js';
import { updatePlatformScores, updateUserScore } from './leaderboard.service.js';
import { calcLeetcodeScore, calcLucyScore } from '../utils/scoring.js';


export const syncLeetcodeStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Also grab current CF score so we can recompute lucyScore
    select: { leetcodeUsername: true, codeforcesStats: { select: { codeforcesScore: true } } },
  });

  if (!user || !user.leetcodeUsername) {
    const error = new Error('LeetCode username not set in profile');
    error.statusCode = 400;
    throw error;
  }

  // fetching the data from graphql api
  const parsedData = await fetchAndParseLeetcodeData(user.leetcodeUsername);
  // storing in the db
  const stats = await persistLeetcodeData(userId, parsedData);

  // Compute lucyScore = leetcodeScore + current codeforcesScore
  const currentCFScore = user.codeforcesStats?.codeforcesScore || 0;
  const lucyScore      = calcLucyScore(stats.leetcodeScore, currentCFScore);

  // Persist lucyScore on the User row
  await prisma.user.update({
    where: { id: userId },
    data: { lucyScore },
  });

  // Update all three Redis ZSETs AFTER PostgreSQL succeeds
  await postSyncRedisUpdates(userId, stats.universalScore, stats.leetcodeScore, currentCFScore, lucyScore);

  return stats;
};

// leetcode graphql api call function
export const fetchAndParseLeetcodeData = async (leetcodeUsername) => {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': `https://leetcode.com/${leetcodeUsername}/`,
      'User-Agent': 'Mozilla/5.0 Lucy/1.0',
    },
    body: JSON.stringify({
      query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile { realName ranking userAvatar countryName }
            submitStats: submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
            submissionCalendar
            tagProblemCounts {
              advanced { tagName problemsSolved }
              intermediate { tagName problemsSolved }
              fundamental { tagName problemsSolved }
            }
          }
          userContestRanking(username: $username) {
            attendedContestsCount rating globalRanking topPercentage
          }
          userContestRankingHistory(username: $username) {
            attended
            rating
            ranking
            contest { title startTime }
          }
        }
      `,
      variables: { username: leetcodeUsername },
    }),
  });

  const profileData = await response.json();
  const mu = profileData?.data?.matchedUser;

  if (!mu) {
    const error = new Error('LeetCode user not found');
    error.statusCode = 404;
    throw error;
  }

  const ac = {};
  for (const item of mu.submitStats?.acSubmissionNum || []) {
    ac[item.difficulty] = item.count;
  }

  const contest = profileData.data?.userContestRanking || {};

  // Build rating history from contest ranking history
  const contestHistory = profileData.data?.userContestRankingHistory || [];
  const ratingHistory = contestHistory
    .filter((entry) => entry.attended)
    .map((entry) => ({
      contest: entry.contest?.title || '',
      timestamp: entry.contest?.startTime || 0,
      rating: Math.round(entry.rating || 0),
      ranking: entry.ranking || 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Parse submission calendar
  let submissionCalendar = {};
  try {
    submissionCalendar = mu.submissionCalendar ? JSON.parse(mu.submissionCalendar) : {};
  } catch {
    submissionCalendar = {};
  }

  // Compute streak and active days from submission calendar
  const calEntries = Object.entries(submissionCalendar);
  const daySet = new Set();
  for (const [ts, count] of calEntries) {
    if (count > 0) {
      const d = new Date(Number(ts) * 1000);
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      daySet.add(dayKey);
    }
  }

  // Count active days in last 30 days
  let activeDays = 0;
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (daySet.has(dayKey)) activeDays++;
  }

  // Compute current streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (daySet.has(dayKey)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  const tags = [];
  for (const t of mu.tagProblemCounts?.fundamental || []) {
    tags.push({ tag: t.tagName, solved: t.problemsSolved, level: 'fundamental' });
  }
  for (const t of mu.tagProblemCounts?.intermediate || []) {
    tags.push({ tag: t.tagName, solved: t.problemsSolved, level: 'intermediate' });
  }
  for (const t of mu.tagProblemCounts?.advanced || []) {
    tags.push({ tag: t.tagName, solved: t.problemsSolved, level: 'advanced' });
  }

  const universalScore = (ac['Easy'] || 0) * 1 + (ac['Medium'] || 0) * 3 + (ac['Hard'] || 0) * 6 + Math.floor((contest.rating || 0) * 0.5);

  // Lucy V1: leetcodeScore uses the same formula (universalScore kept for compat)
  const leetcodeScore = calcLeetcodeScore({
    easy: ac['Easy'] || 0,
    medium: ac['Medium'] || 0,
    hard: ac['Hard'] || 0,
    contestRating: contest.rating || 0,
  });

  return {
    leetcodeUsername: mu.username,
    realName: mu.profile?.realName || '',
    avatar: mu.profile?.userAvatar || '',
    totalSolved: ac['All'] || 0,
    easy: ac['Easy'] || 0,
    medium: ac['Medium'] || 0,
    hard: ac['Hard'] || 0,
    contestRating: contest.rating || 0,
    contestsAttended: contest.attendedContestsCount || 0,
    globalRanking: contest.globalRanking || 0,
    topPercentage: contest.topPercentage || 0,
    tags: tags.slice(0, 15),
    ratingHistory,
    submissionCalendar,
    streak,
    activeDays,
    universalScore,
    leetcodeScore,
  };
};

// storing the leetcode data to db helper function
export const persistLeetcodeData = async (userId, data) => {
  const stats = await prisma.leetcodeStats.upsert({
    where: { userId },
    update: {
      leetcodeUsername: data.leetcodeUsername,
      realName: data.realName,
      avatar: data.avatar,
      totalSolved: data.totalSolved,
      easy: data.easy,
      medium: data.medium,
      hard: data.hard,
      contestRating: data.contestRating,
      contestsAttended: data.contestsAttended,
      globalRanking: data.globalRanking,
      topPercentage: data.topPercentage,
      tags: data.tags,
      ratingHistory: data.ratingHistory,
      submissionCalendar: data.submissionCalendar,
      streak: data.streak,
      activeDays: data.activeDays,
      universalScore: data.universalScore,
      leetcodeScore: data.leetcodeScore,
      lastSynced: new Date(),
    },
    create: {
      userId,
      leetcodeUsername: data.leetcodeUsername,
      realName: data.realName,
      avatar: data.avatar,
      totalSolved: data.totalSolved,
      easy: data.easy,
      medium: data.medium,
      hard: data.hard,
      contestRating: data.contestRating,
      contestsAttended: data.contestsAttended,
      globalRanking: data.globalRanking,
      topPercentage: data.topPercentage,
      tags: data.tags,
      ratingHistory: data.ratingHistory,
      submissionCalendar: data.submissionCalendar,
      streak: data.streak,
      activeDays: data.activeDays,
      universalScore: data.universalScore,
      leetcodeScore: data.leetcodeScore,
      lastSynced: new Date(),
    },
  });

  // Upsert today's activity
  const today = new Date().toISOString().split('T')[0];
  await prisma.activity.upsert({
    where: {
      userId_date: { userId, date: today },
    },
    update: {
      synced: true,
      solvedSnapshot: stats.totalSolved,
    },
    create: {
      userId,
      date: today,
      synced: true,
      solvedSnapshot: stats.totalSolved,
    },
  });

  return stats;
};

//helper function for updating the redis cache after the leetcode data is synced
export const postSyncRedisUpdates = async (userId, universalScore, leetcodeScore = 0, codeforcesScore = 0, lucyScore = 0) => {
  try {
    await invalidateDashboardCache(userId);
  } catch (err) {
    console.error('[LeetCode] Dashboard cache invalidation failed:', err.message);
  }

  // Legacy: keep leaderboard:global in sync so old code paths still work
  try {
    await updateUserScore(userId, universalScore);
  } catch (err) {
    console.error('[LeetCode] Legacy leaderboard update failed:', err.message);
  }

  // V1: push all three platform ZSETs
  try {
    await updatePlatformScores(userId, { leetcodeScore, codeforcesScore, lucyScore });
  } catch (err) {
    console.error('[LeetCode] Platform leaderboard update failed:', err.message);
  }
};

// fetching the leetcode data from the db
export const getStats = async (userId) => {
  return await prisma.leetcodeStats.findUnique({
    where: { userId },
  });
};
