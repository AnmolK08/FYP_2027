import prisma from '../config/prisma.js';

/**
 * Service responsibilities:
 * - Handle business logic
 * - Communicate with the database
 * - Do NOT depend on Express req/res
 */

export const findAllUsers = async () => {
  return await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
  });
};

export const findUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const createUser = async (userData) => {
  // Logic usually overlaps with authService.registerUser
  // Kept here for structure completion
  return await prisma.user.create({
    data: userData,
  });
};

export const updateUser = async (id, updateData) => {
  // 1. Verify user exists
  await findUserById(id); // Will throw if not found

  // 2. Update user
  return await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, updatedAt: true },
  });
};

export const deleteUser = async (id) => {
  await findUserById(id); // Will throw if not found

  return await prisma.user.delete({
    where: { id },
  });
};
