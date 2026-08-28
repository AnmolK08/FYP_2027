import * as authService from '../services/auth.service.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshTokenCookieOptions,
} from '../utils/token.js';

export const signup = async (req, res, next) => {
  try {
    const { email, password, name, college, department, leetcodeUsername, leetcode_handle } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const { user, accessToken, refreshToken } = await authService.registerUser({
      email,
      password,
      name,
      college,
      department,
      leetcodeUsername: leetcodeUsername || leetcode_handle,
    });

    // Set refresh token in HttpOnly cookie — NEVER expose to JavaScript
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

    // Return only the short-lived access token and sanitized user object
    res.status(201).json({ user, accessToken });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, accessToken, refreshToken } = await authService.loginUser({
      email,
      password,
    });

    // Set refresh token in HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

    // Return only the short-lived access token and sanitized user object
    res.json({ user, accessToken });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      return res.status(401).json({ error: 'No refresh token provided in cookies' });
    }

    const { accessToken, newRefreshToken, user } = await authService.refreshSession(
      rawRefreshToken
    );

    // Rotate refresh token in HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions());

    // Return new access token and user info
    res.json({ accessToken, user });
  } catch (error) {
    // Clear the invalid cookie if refresh fails
    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear the refresh cookie
    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...getRefreshTokenCookieOptions(),
      maxAge: 0,
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
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
