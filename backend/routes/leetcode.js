import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Sync LeetCode data
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's LeetCode username
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.leetcodeUsername) {
      return res.status(400).json({ error: 'LeetCode username not set in profile' });
    }

    // Fetch from LeetCode GraphQL API
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
      return res.status(404).json({ error: 'LeetCode user not found' });
    }

    // Parse stats
    const ac = {};
    for (const item of mu.submitStats?.acSubmissionNum || []) {
      ac[item.difficulty] = item.count;
    }

    const contest = profileData.data?.userContestRanking || {};

    // Build tags array
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

    // Calculate universal score
    const universalScore = (ac['Easy'] || 0) * 1 + (ac['Medium'] || 0) * 3 + (ac['Hard'] || 0) * 6 + Math.floor((contest.rating || 0) * 0.5);

    // Upsert leetcode stats
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
      }
    });

    // Record activity
    const today = new Date().toISOString().split('T')[0];
    await prisma.activity.upsert({
      where: {
        userId_date: { userId, date: today }
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
      }
    });

    res.json({ stats });
  } catch (error) {
    console.error('Leetcode sync error:', error);
    res.status(500).json({ error: 'Failed to sync LeetCode data' });
  }
});

// Get LeetCode stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await prisma.leetcodeStats.findUnique({
      where: { userId: req.user.id }
    });

    if (!stats) {
      return res.json({ stats: null });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
