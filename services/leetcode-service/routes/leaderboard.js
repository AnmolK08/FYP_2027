import express from 'express';
import prisma from 'database';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get leaderboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { scope = 'global', sort = 'universalScore' } = req.query;
    const userId = req.user.id;

    // Get current user for college/department filtering
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Build where clause for users
    let whereClause = {};
    if (scope === 'college' && currentUser?.college) {
      whereClause = { college: currentUser.college };
    } else if (scope === 'department' && currentUser?.department) {
      whereClause = { department: currentUser.department };
    }

    // Get users with their stats
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        leetcodeStats: true
      }
    });

    // Build leaderboard
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

    // Sort
    const sortKey = sort === 'contest_rating' ? 'contest_rating' :
                    sort === 'total_solved' ? 'total_solved' :
                    sort === 'hard' ? 'hard' : 'universal_score';
    leaderboard.sort((a, b) => b[sortKey] - a[sortKey]);

    // Add ranks
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
