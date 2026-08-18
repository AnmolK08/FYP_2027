import * as leetcodeService from '../services/leetcode.service.js';

export const syncStats = async (req, res, next) => {
  try {
    const stats = await leetcodeService.syncLeetcodeStats(req.user.id);
    res.json({ stats });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await leetcodeService.getStats(req.user.id);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const { scope, sort } = req.query;
    const leaderboard = await leetcodeService.getLeaderboard(req.user.id, scope, sort);
    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};
