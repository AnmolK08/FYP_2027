import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { invalidateDashboardCache } from './dashboard.service.js';

export const registerUser = async (userData) => {
  const { email, password, name, college, department, leetcodeUsername } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
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

  // Create empty leetcode stats
  await prisma.leetcodeStats.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      leetcodeUsername: leetcodeUsername || null,
    },
  });

  // Since we cannot mock jwt easily if we have a real secret, let's keep the user object lean
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      leetcodeStats: true,
    },
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      leetcodeStats: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
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

  const { password: _, ...userWithoutPassword } = user;

  // Invalidate dashboard cache so next read picks up the profile changes
  await invalidateDashboardCache(id);

  return userWithoutPassword;
};
