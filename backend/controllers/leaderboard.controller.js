import * as leaderboardService from '../services/leaderboard.service.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const type  = req.query.type  || 'lucy';
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await leaderboardService.getLeaderboard(type, page, limit, req.user.id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

export const getMyRank = async (req, res, next) => {
  try {
    const type   = req.query.type || 'lucy';
    const result = await leaderboardService.getUserRank(type, req.user.id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

export const getNearbyUsers = async (req, res, next) => {
  try {
    const type   = req.query.type || 'lucy';
    const window = Math.min(10, Math.max(1, parseInt(req.query.window, 10) || 2));
    const result = await leaderboardService.getNearbyUsers(type, req.user.id, window);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

export const rebuildLeaderboard = async (req, res, next) => {
  try {
    const type   = req.query.type || undefined;
    const result = await leaderboardService.rebuildLeaderboard(type);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};
