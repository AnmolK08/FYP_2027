import prisma from '../config/prisma.js';

export const getRoutineSuggestions = async (userId) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

  // 1. Fetch recent task logs
  const logs = await prisma.routineTaskLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: fourteenDaysAgo,
      },
    },
    include: {
      routineTask: {
        select: {
          id: true,
          title: true,
          category: true,
          startTime: true,
          endTime: true,
          daysOfWeek: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const suggestions = [];

  if (logs.length < 3) {
    return {
      suggestions: [
        {
          id: 'sugg-welcome',
          type: 'INFO',
          category: 'GENERAL',
          title: 'Start Tracking Consistently',
          message: 'Complete at least 3 days of your routine to unlock personalized productivity suggestions and pattern insights.',
          badge: 'Getting Started',
          impact: 'medium',
        },
      ],
      metrics: {
        totalTrackedLogs: logs.length,
        timeSpanDays: 14,
      },
    };
  }

  // 2. Group by task title or routineTaskId
  const taskMap = new Map();
  for (const log of logs) {
    const key = log.routineTaskId || log.taskTitleSnapshot;
    if (!taskMap.has(key)) {
      taskMap.set(key, {
        taskId: log.routineTaskId,
        title: log.taskTitleSnapshot,
        category: log.routineTask?.category || 'general',
        startTime: log.startTimeSnapshot,
        endTime: log.endTimeSnapshot,
        total: 0,
        completed: 0,
        skipped: 0,
        pending: 0,
      });
    }
    const item = taskMap.get(key);
    item.total++;
    if (log.status === 'COMPLETED') item.completed++;
    else if (log.status === 'SKIPPED') item.skipped++;
    else item.pending++;
  }

  // 3. Evaluate Rule 1 & Rule 3: Low completion and Frequent Skipping
  for (const [_, item] of taskMap.entries()) {
    if (item.total >= 3) {
      const completionRate = Math.round((item.completed / item.total) * 100);
      const skipRate = Math.round((item.skipped / item.total) * 100);

      if (completionRate < 50) {
        suggestions.push({
          id: `sugg-low-${item.taskId || item.title}`,
          type: 'OPTIMIZATION',
          category: item.category,
          title: `Consider Rescheduling "${item.title}"`,
          message: `You've only completed "${item.title}" ${completionRate}% of the time (${item.completed}/${item.total} sessions) at ${item.startTime}. Try shifting it to a different time slot when your energy is higher.`,
          badge: 'Low Completion',
          impact: 'high',
          action: {
            taskId: item.taskId,
            suggestedChange: 'adjust_time',
          },
        });
      } else if (skipRate >= 40) {
        suggestions.push({
          id: `sugg-skip-${item.taskId || item.title}`,
          type: 'FREQUENCY',
          category: item.category,
          title: `High Skip Rate on "${item.title}"`,
          message: `"${item.title}" was skipped ${item.skipped} times in the last 2 weeks (${skipRate}% skip rate). Consider reducing its frequency to fewer days or shortening its duration.`,
          badge: 'High Skip Rate',
          impact: 'medium',
          action: {
            taskId: item.taskId,
            suggestedChange: 'reduce_frequency',
          },
        });
      } else if (completionRate >= 85 && item.total >= 5) {
        suggestions.push({
          id: `sugg-high-${item.taskId || item.title}`,
          type: 'STREAK',
          category: item.category,
          title: `Strong Habit Formed: "${item.title}"`,
          message: `Exceptional consistency! You have achieved an ${completionRate}% completion rate for "${item.title}" across ${item.total} days. This habit is solidified!`,
          badge: 'Mastered Habit',
          impact: 'positive',
        });
      }
    }
  }

  // 4. Time of Day Productivity Analysis
  // Morning: < 12:00, Afternoon: 12:00-17:00, Evening: >= 17:00
  const timeBuckets = {
    morning: { total: 0, completed: 0 },
    afternoon: { total: 0, completed: 0 },
    evening: { total: 0, completed: 0 },
  };

  for (const log of logs) {
    const timeStr = log.startTimeSnapshot || '12:00';
    const hour = parseInt(timeStr.split(':')[0], 10) || 12;

    let bucket = 'evening';
    if (hour < 12) bucket = 'morning';
    else if (hour < 17) bucket = 'afternoon';

    timeBuckets[bucket].total++;
    if (log.status === 'COMPLETED') timeBuckets[bucket].completed++;
  }

  const morningRate = timeBuckets.morning.total > 0
    ? Math.round((timeBuckets.morning.completed / timeBuckets.morning.total) * 100)
    : null;
  const afternoonRate = timeBuckets.afternoon.total > 0
    ? Math.round((timeBuckets.afternoon.completed / timeBuckets.afternoon.total) * 100)
    : null;
  const eveningRate = timeBuckets.evening.total > 0
    ? Math.round((timeBuckets.evening.completed / timeBuckets.evening.total) * 100)
    : null;

  if (morningRate !== null && eveningRate !== null && morningRate >= 70 && eveningRate <= 50) {
    suggestions.push({
      id: 'sugg-energy-morning',
      type: 'INSIGHT',
      category: 'PRODUCTIVITY',
      title: 'Peak Productivity Window: Mornings',
      message: `Your morning completion rate is ${morningRate}%, compared to ${eveningRate}% in the evening. Schedule your most demanding learning or coding tasks before noon.`,
      badge: 'Time Insight',
      impact: 'high',
    });
  } else if (eveningRate !== null && morningRate !== null && eveningRate >= 70 && morningRate <= 50) {
    suggestions.push({
      id: 'sugg-energy-evening',
      type: 'INSIGHT',
      category: 'PRODUCTIVITY',
      title: 'Night Owl Advantage',
      message: `You perform best in the evenings (${eveningRate}% completion vs ${morningRate}% morning). Align your key focus blocks after 5 PM.`,
      badge: 'Time Insight',
      impact: 'medium',
    });
  }

  // 5. Category Balance Insight
  const categoryCounts = {};
  for (const log of logs) {
    const cat = log.routineTask?.category || 'general';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const categories = Object.keys(categoryCounts);
  if (categories.length === 1 && logs.length >= 7) {
    suggestions.push({
      id: 'sugg-category-balance',
      type: 'BALANCE',
      category: 'WELLNESS',
      title: 'Diversify Your Routine',
      message: `Your routine is 100% focused on "${categories[0]}". Adding a short fitness or wellness break can boost cognitive endurance.`,
      badge: 'Work-Life Balance',
      impact: 'medium',
    });
  }

  return {
    suggestions,
    metrics: {
      totalTrackedLogs: logs.length,
      timeSpanDays: 14,
      timeBuckets: {
        morning: { rate: morningRate, ...timeBuckets.morning },
        afternoon: { rate: afternoonRate, ...timeBuckets.afternoon },
        evening: { rate: eveningRate, ...timeBuckets.evening },
      },
    },
  };
};
