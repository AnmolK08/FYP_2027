import * as authService from '../services/auth.service.js';

export const signup = async (req, res, next) => {
  try {
    const userData = req.body;
    if (!userData.email || !userData.password || !userData.name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const result = await authService.registerUser(userData);
    // Note: To perfectly replicate old API, token generation should happen in service or controller.
    // Given the architectural rules, token could be returned by service.
    // For now, I'll generate it here or in service.
    // Let's assume authService returns { user, token }
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const credentials = req.body;
    if (!credentials.email || !credentials.password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.loginUser(credentials);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateUserProfile(req.user.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
