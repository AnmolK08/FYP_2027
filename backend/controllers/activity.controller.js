import * as activityService from '../services/activity.service.js';

export const getActivity = async (req, res, next) => {
  try {
    const activity = await activityService.getUserActivity(req.user.id);
    res.json({ activity });
  } catch (error) {
    next(error);
  }
};

export const getStreakSummary = async (req, res, next) => {
  try {
    const summary = await activityService.getUserStreakSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    const result = await activityService.checkInUser(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
