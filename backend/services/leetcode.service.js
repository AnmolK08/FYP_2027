import prisma from '../config/prisma.js';

export const syncLeetcodeStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.leetcodeUsername) {
    const error = new Error('LeetCode username not set in profile');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': `https://leetcode.com/${user.leetcodeUsername}/`,
      'User-Agent': 'Mozilla/5.0 PrepSphere/1.0',
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
            tagProblemCounts {
              advanced { tagName problemsSolved }
              intermediate { tagName problemsSolved }
              fundamental { tagName problemsSolved }
            }
          }
          userContestRanking(username: $username) {
            attendedContestsCount rating globalRanking topPercentage
          }
        }
      `,
      variables: { username: user.leetcodeUsername },
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

  const stats = await prisma.leetcodeStats.upsert({
    where: { userId },
    update: {
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
      universalScore,
      lastSynced: new Date(),
    },
    create: {
      userId,
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
      universalScore,
      lastSynced: new Date(),
    },
  });

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

export const getStats = async (userId) => {
  return await prisma.leetcodeStats.findUnique({
    where: { userId },
  });
};

export const getLeaderboard = async (userId, scope = 'global', sort = 'universalScore') => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  let whereClause = {};
  if (scope === 'college' && currentUser?.college) {
    whereClause = { college: currentUser.college };
  } else if (scope === 'department' && currentUser?.department) {
    whereClause = { department: currentUser.department };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      leetcodeStats: true,
    },
  });

  const leaderboard = users.map((u) => {
    const stats = u.leetcodeStats || {};
    return {
      user_id: u.id,
      name: u.name,
      avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`,
      college: u.college,
      department: u.department,
      leetcode_username: u.leetcodeUsername,
      total_solved: stats.totalSolved || 0,
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
      contest_rating: stats.contestRating || 0,
      universal_score: stats.universalScore || 0,
      is_me: u.id === userId,
    };
  });

  const sortKey = sort === 'contest_rating' ? 'contest_rating' : sort === 'total_solved' ? 'total_solved' : sort === 'hard' ? 'hard' : 'universal_score';

  leaderboard.sort((a, b) => b[sortKey] - a[sortKey]);

  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return leaderboard;
};
