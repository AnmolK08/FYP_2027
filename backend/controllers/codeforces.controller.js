import * as codeforcesService from '../services/codeforces.service.js';


export const syncStats = async (req, res, next) => {
  try {
    const stats = await codeforcesService.syncCodeforcesStats(req.user.id);
    return res.json({
      status: 'completed',
      message: 'Codeforces profile synced successfully',
      stats,
    });
  } catch (error) {
    // Known operational errors — forward the statusCode directly
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};


export const getStats = async (req, res, next) => {
  try {
    const stats = await codeforcesService.getCodeforcesStats(req.user.id);
    return res.json({ stats });
  } catch (error) {
    next(error);
  }
};
