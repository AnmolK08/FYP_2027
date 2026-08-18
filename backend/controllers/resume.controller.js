import * as resumeService from '../services/resume.service.js';

export const scoreResume = (req, res, next) => {
  try {
    const { text, target_role } = req.body;
    const result = resumeService.scoreResume(text, target_role);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getRoles = (req, res, next) => {
  try {
    const roles = resumeService.getAvailableRoles();
    res.json({ roles });
  } catch (error) {
    next(error);
  }
};
