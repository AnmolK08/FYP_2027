import * as dashboardService from '../services/dashboard.service.js';

/**
 * Dashboard Controller
 * --------------------
 * Thin layer: extract userId from req, delegate to service, return result.
 */

export const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};
