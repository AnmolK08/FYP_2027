import prisma from '../config/prisma.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDateStr = (date) => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getWeeklyStats = async (userId, startDateStr = null, endDateStr = null) => {
  let start;
  let end;

  if (startDateStr && endDateStr) {
    start = new Date(`${startDateStr}T00:00:00.000Z`);
    end = new Date(`${endDateStr}T23:59:59.999Z`);
  } else {
    // Default to last 7 days ending today
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    end = today;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    start = sevenDaysAgo;
  }

  const routineDays = await prisma.routineDay.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      routine: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const dayMap = new Map();
  routineDays.forEach((day) => {
    const key = formatDateStr(new Date(day.date));
    dayMap.set(key, day);
  });

  // Generate full range array
  const days = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = formatDateStr(cursor);
    const dayData = dayMap.get(dateStr);
    const dayOfWeek = DAY_NAMES[cursor.getUTCDay()];

    days.push({
      date: dateStr,
      dayOfWeek,
      hasRoutine: Boolean(dayData),
      routineName: dayData?.routine?.name || null,
      totalTasks: dayData?.totalTasks || 0,
      completedTasks: dayData?.completedTasks || 0,
      completionPercentage: dayData?.completionPercentage || 0,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const trackedDays = days.filter((d) => d.hasRoutine);
  const totalCompleted = trackedDays.reduce((acc, d) => acc + d.completedTasks, 0);
  const totalScheduled = trackedDays.reduce((acc, d) => acc + d.totalTasks, 0);
  const avgPercentage = trackedDays.length > 0
    ? Math.round(trackedDays.reduce((acc, d) => acc + d.completionPercentage, 0) / trackedDays.length * 10) / 10
    : 0;
  const perfectDays = trackedDays.filter((d) => d.completionPercentage === 100).length;

  return {
    startDate: formatDateStr(start),
    endDate: formatDateStr(end),
    summary: {
      daysTracked: trackedDays.length,
      totalDaysInRange: days.length,
      totalTasksCompleted: totalCompleted,
      totalTasksScheduled: totalScheduled,
      averageCompletionPercentage: avgPercentage,
      perfectDaysCount: perfectDays,
    },
    days,
  };
};

export const getMonthlyStats = async (userId, month = null, year = null) => {
  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getUTCFullYear();
  const targetMonth = month ? parseInt(month, 10) : now.getUTCMonth() + 1; // 1-indexed

  const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
  const totalDaysInMonth = endOfMonth.getUTCDate();

  const routineDays = await prisma.routineDay.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      routine: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const dayMap = new Map();
  routineDays.forEach((day) => {
    const key = formatDateStr(new Date(day.date));
    dayMap.set(key, day);
  });

  const calendarDays = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(Date.UTC(targetYear, targetMonth - 1, d));
    const dateStr = formatDateStr(dateObj);
    const dayData = dayMap.get(dateStr);

    calendarDays.push({
      date: dateStr,
      day: d,
      dayOfWeek: DAY_NAMES[dateObj.getUTCDay()],
      hasRoutine: Boolean(dayData),
      totalTasks: dayData?.totalTasks || 0,
      completedTasks: dayData?.completedTasks || 0,
      completionPercentage: dayData?.completionPercentage || 0,
      routineName: dayData?.routine?.name || null,
    });
  }

  // Calculate streaks across all days in user history or up to this month
  const allUserDays = await prisma.routineDay.findMany({
    where: {
      userId,
      date: {
        lte: endOfMonth,
      },
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      date: true,
      completionPercentage: true,
      completedTasks: true,
    },
  });

  // A day counts towards consistency if at least 1 task completed or >= 50%
  const qualifyingDateSet = new Set(
    allUserDays
      .filter((d) => d.completedTasks > 0)
      .map((d) => formatDateStr(new Date(d.date)))
  );

  // Current streak counting backwards from today
  const todayStr = formatDateStr(now);
  let currentStreak = 0;
  let streakCursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Check if today is completed; if not, check from yesterday
  if (!qualifyingDateSet.has(todayStr)) {
    streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
  }

  while (qualifyingDateSet.has(formatDateStr(streakCursor))) {
    currentStreak++;
    streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
  }

  // Longest streak
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  const sortedActiveDates = Array.from(qualifyingDateSet).sort();
  for (const dateStr of sortedActiveDates) {
    if (prevDate) {
      const prev = new Date(`${prevDate}T00:00:00.000Z`);
      const curr = new Date(`${dateStr}T00:00:00.000Z`);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    } else {
      currentRun = 1;
    }
    longestStreak = Math.max(longestStreak, currentRun);
    prevDate = dateStr;
  }

  const trackedInMonth = calendarDays.filter((d) => d.hasRoutine);
  const avgCompletion = trackedInMonth.length > 0
    ? Math.round(trackedInMonth.reduce((acc, d) => acc + d.completionPercentage, 0) / trackedInMonth.length * 10) / 10
    : 0;

  return {
    year: targetYear,
    month: targetMonth,
    summary: {
      totalDaysInMonth,
      daysTracked: trackedInMonth.length,
      averageCompletionPercentage: avgCompletion,
      currentStreak,
      longestStreak,
      perfectDaysCount: trackedInMonth.filter((d) => d.completionPercentage === 100).length,
    },
    calendar: calendarDays,
  };
};

export const getTaskPerformance = async (userId, taskId, startDateStr = null, endDateStr = null) => {
  const task = await prisma.routineTask.findUnique({
    where: { id: taskId },
    include: {
      routine: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  });

  if (!task || task.routine.userId !== userId) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const whereClause = {
    userId,
    routineTaskId: taskId,
  };

  if (startDateStr && endDateStr) {
    whereClause.createdAt = {
      gte: new Date(`${startDateStr}T00:00:00.000Z`),
      lte: new Date(`${endDateStr}T23:59:59.999Z`),
    };
  }

  const logs = await prisma.routineTaskLog.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
    take: 60, // Last 60 occurrences
  });

  const total = logs.length;
  const completed = logs.filter((l) => l.status === 'COMPLETED').length;
  const skipped = logs.filter((l) => l.status === 'SKIPPED').length;
  const pending = logs.filter((l) => l.status === 'PENDING').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;

  return {
    taskId: task.id,
    taskTitle: task.title,
    category: task.category,
    startTime: task.startTime,
    endTime: task.endTime,
    daysOfWeek: task.daysOfWeek,
    routineName: task.routine.name,
    summary: {
      totalOccurrences: total,
      completedCount: completed,
      skippedCount: skipped,
      pendingCount: pending,
      completionRate,
    },
    history: logs.map((l) => ({
      id: l.id,
      date: formatDateStr(new Date(l.createdAt)),
      status: l.status,
      completedAt: l.completedAt,
    })),
  };
};
