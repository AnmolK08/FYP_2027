import * as leaderboardService from '../services/leaderboard.service.js';

/**
 * Leaderboard Controller
 * ----------------------
 * Handles leaderboard reads, user rank lookup, and admin rebuild.
 */

export const getLeaderboard = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await leaderboardService.getLeaderboard(page, limit, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyRank = async (req, res, next) => {
  try {
    const result = await leaderboardService.getUserRank(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const rebuildLeaderboard = async (req, res, next) => {
  try {
    const result = await leaderboardService.rebuildLeaderboard();
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
