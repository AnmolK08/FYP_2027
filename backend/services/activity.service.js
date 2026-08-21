import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { invalidateDashboardCache } from './dashboard.service.js';

export const getUserActivity = async (userId) => {
  return await prisma.activity.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

export const getUserStreakSummary = async (userId) => {
  const [user, stats, activities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoal: true },
    }),
    prisma.leetcodeStats.findUnique({
      where: { userId },
      select: { submissionCalendar: true },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    }),
  ]);

  const submissionCalendar = stats?.submissionCalendar && typeof stats.submissionCalendar === 'object'
    ? stats.submissionCalendar
    : {};
  const submissionCounts = new Map();
  for (const [timestamp, count] of Object.entries(submissionCalendar)) {
    const submissions = Number(count);
    if (!Number.isFinite(submissions) || submissions <= 0) continue;
    const date = new Date(Number(timestamp) * 1000);
    if (Number.isNaN(date.getTime())) continue;
    const dateString = date.toISOString().split('T')[0];
    submissionCounts.set(dateString, (submissionCounts.get(dateString) || 0) + submissions);
  }

  const checkInDates = new Set(
    activities
      .filter((activity) => activity.checkedIn)
      .map((activity) => activity.date),
  );
  const today = new Date();
  const dates = [];
  for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    dates.push(date.toISOString().split('T')[0]);
  }

  const activeDates = dates.filter((date) => submissionCounts.has(date) || checkInDates.has(date));
  const activeDateSet = new Set(activeDates);
  const todayDate = dates[dates.length - 1];

  let currentStreak = 0;
  const streakStart = activeDateSet.has(todayDate) ? today : new Date(today.getTime() - 86400000);
  let cursor = new Date(streakStart);
  while (activeDateSet.has(cursor.toISOString().split('T')[0])) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let longestStreak = 0;
  let run = 0;
  let previousDate = null;
  for (const date of activeDates) {
    if (previousDate) {
      const previous = new Date(`${previousDate}T00:00:00Z`);
      const current = new Date(`${date}T00:00:00Z`);
      const diffDays = Math.round((current - previous) / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    previousDate = date;
  }

  const heatmap = dates.map((date) => ({
    date,
    count: submissionCounts.get(date) || 0,
    active: activeDateSet.has(date),
  }));

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_active_days: activeDates.length,
    daily_goal: user?.dailyGoal || 3,
    heatmap,
  };
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
  // Invalidate dashboard cache so activity section is fresh
  await invalidateDashboardCache(userId);

  return { success: true };
};
