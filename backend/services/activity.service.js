import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';

export const getUserActivity = async (userId) => {
  return await prisma.activity.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

export const checkInUser = async (userId) => {
  const today = new Date().toISOString().split('T')[0];

  await prisma.activity.upsert({
    where: {
      userId_date: { userId, date: today },
    },
    update: {
      checkedIn: true,
    },
    create: {
      id: uuidv4(),
      userId,
      date: today,
      checkedIn: true,
    },
  });

  return { success: true };
};
