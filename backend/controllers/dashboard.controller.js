import * as dashboardService from '../services/dashboard.service.js';

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

export const getLeetcodeDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getLeetcodeDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getCodeforcesDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getCodeforcesDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};
