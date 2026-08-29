import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { invalidateDashboardCache } from './dashboard.service.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    college: user.college || null,
    department: user.department || null,
    leetcodeUsername: user.leetcodeUsername || null,
    avatar: user.avatar || null,
    dailyGoal: user.dailyGoal ?? 3,
  };
};

export const refreshSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  // Verify user still exists in DB
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 401;
    throw error;
  }

  // Issue new access token and rotated refresh token
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return {
    accessToken,
    newRefreshToken,
    user: sanitizeUser(user),
  };
};

export const registerUser = async (userData) => {
  const { email, password, name, college, department, leetcodeUsername } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      college: college || null,
      department: department || null,
      leetcodeUsername: leetcodeUsername || null,
    },
  });

  await prisma.leetcodeStats.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      leetcodeUsername: leetcodeUsername || null,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};

export const updateUserProfile = async (id, updateData) => {
  const { name, college, department, leetcodeUsername, dailyGoal } = updateData;

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: name || undefined,
      college: college !== undefined ? college : undefined,
      department: department !== undefined ? department : undefined,
      leetcodeUsername: leetcodeUsername !== undefined ? leetcodeUsername : undefined,
      dailyGoal: dailyGoal !== undefined ? dailyGoal : undefined,
    },
  });

  await invalidateDashboardCache(id);
  return sanitizeUser(user);
};
