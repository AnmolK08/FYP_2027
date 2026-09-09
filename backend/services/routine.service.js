import prisma from '../config/prisma.js';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const getUtcDateOnly = (dateInput) => {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T00:00:00.000Z`);
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
};

export const createRoutine = async (userId, { name, description, tasks = [], isActive }) => {
  return await prisma.$transaction(async (tx) => {
    // If isActive not explicitly provided, activate if user has no active routines
    let makeActive = isActive;
    if (makeActive === undefined) {
      const activeCount = await tx.routine.count({
        where: { userId, isActive: true, isArchived: false },
      });
      makeActive = activeCount === 0;
    }

    if (makeActive) {
      await tx.routine.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    const routine = await tx.routine.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        isActive: makeActive,
        tasks: tasks.length > 0 ? {
          create: tasks.map((t, index) => ({
            title: t.title.trim(),
            description: t.description?.trim() || null,
            startTime: t.startTime,
            endTime: t.endTime,
            category: t.category || 'general',
            daysOfWeek: t.daysOfWeek && t.daysOfWeek.length > 0
              ? t.daysOfWeek
              : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            priority: Number.isInteger(t.priority) ? t.priority : index + 1,
            isActive: true,
          })),
        } : undefined,
      },
      include: {
        tasks: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return routine;
  });
};

export const getRoutines = async (userId) => {
  return await prisma.routine.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      tasks: {
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      },
    },
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'desc' },
    ],
  });
};

export const getRoutineById = async (userId, routineId) => {
  const routine = await prisma.routine.findFirst({
    where: {
      id: routineId,
      userId,
      isArchived: false,
    },
    include: {
      tasks: {
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!routine) {
    const error = new Error('Routine not found');
    error.statusCode = 404;
    throw error;
  }

  return routine;
};

export const updateRoutine = async (userId, routineId, { name, description, isActive }) => {
  const existing = await prisma.routine.findFirst({
    where: { id: routineId, userId, isArchived: false },
  });

  if (!existing) {
    const error = new Error('Routine not found');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    if (isActive === true && !existing.isActive) {
      await tx.routine.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (isActive !== undefined) data.isActive = isActive;

    return await tx.routine.update({
      where: { id: routineId },
      data,
      include: {
        tasks: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  });
};

export const archiveRoutine = async (userId, routineId) => {
  const existing = await prisma.routine.findFirst({
    where: { id: routineId, userId, isArchived: false },
  });

  if (!existing) {
    const error = new Error('Routine not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.routine.update({
    where: { id: routineId },
    data: {
      isArchived: true,
      isActive: false,
    },
  });

  return { success: true, message: 'Routine archived successfully' };
};

export const activateRoutine = async (userId, routineId) => {
  const existing = await prisma.routine.findFirst({
    where: { id: routineId, userId, isArchived: false },
  });

  if (!existing) {
    const error = new Error('Routine not found');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.routine.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return await tx.routine.update({
      where: { id: routineId },
      data: { isActive: true },
      include: {
        tasks: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  });
};

export const addTask = async (userId, routineId, taskData) => {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId, isArchived: false },
  });

  if (!routine) {
    const error = new Error('Routine not found');
    error.statusCode = 404;
    throw error;
  }

  const task = await prisma.routineTask.create({
    data: {
      routineId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      category: taskData.category || 'general',
      daysOfWeek: taskData.daysOfWeek && taskData.daysOfWeek.length > 0
        ? taskData.daysOfWeek
        : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      priority: Number.isInteger(taskData.priority) ? taskData.priority : 1,
      isActive: true,
    },
  });

  // If this routine is active, check if today's RoutineDay exists
  if (routine.isActive) {
    const todayDate = getUtcDateOnly();
    const dayOfWeek = DAY_NAMES[todayDate.getUTCDay()];

    if (task.daysOfWeek.includes(dayOfWeek)) {
      const todayDay = await prisma.routineDay.findUnique({
        where: {
          userId_routineId_date: {
            userId,
            routineId,
            date: todayDate,
          },
        },
      });

      if (todayDay) {
        await prisma.$transaction(async (tx) => {
          await tx.routineTaskLog.create({
            data: {
              routineDayId: todayDay.id,
              routineTaskId: task.id,
              userId,
              taskTitleSnapshot: task.title,
              startTimeSnapshot: task.startTime,
              endTimeSnapshot: task.endTime,
              status: 'PENDING',
            },
          });

          const total = todayDay.totalTasks + 1;
          const percentage = Math.round((todayDay.completedTasks / total) * 100 * 10) / 10;

          await tx.routineDay.update({
            where: { id: todayDay.id },
            data: {
              totalTasks: total,
              completionPercentage: percentage,
            },
          });
        });
      }
    }
  }

  return task;
};

export const updateTask = async (userId, taskId, updates) => {
  const task = await prisma.routineTask.findUnique({
    where: { id: taskId },
    include: { routine: true },
  });

  if (!task || task.routine.userId !== userId || task.routine.isArchived) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const data = {};
  if (updates.title !== undefined) data.title = updates.title.trim();
  if (updates.description !== undefined) data.description = updates.description?.trim() || null;
  if (updates.startTime !== undefined) data.startTime = updates.startTime;
  if (updates.endTime !== undefined) data.endTime = updates.endTime;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.daysOfWeek !== undefined) data.daysOfWeek = updates.daysOfWeek;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;

  return await prisma.routineTask.update({
    where: { id: taskId },
    data,
  });
};

export const removeTask = async (userId, taskId) => {
  const task = await prisma.routineTask.findUnique({
    where: { id: taskId },
    include: { routine: true },
  });

  if (!task || task.routine.userId !== userId) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Soft delete to preserve historical integrity
  await prisma.routineTask.update({
    where: { id: taskId },
    data: { isActive: false },
  });

  return { success: true, message: 'Task removed successfully' };
};

export const getTodayRoutine = async (userId, customDate = null) => {
  const dateObj = getUtcDateOnly(customDate);
  const dayOfWeek = DAY_NAMES[dateObj.getUTCDay()];

  const activeRoutine = await prisma.routine.findFirst({
    where: {
      userId,
      isActive: true,
      isArchived: false,
    },
    include: {
      tasks: {
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!activeRoutine) {
    return {
      activeRoutine: null,
      routineDay: null,
      message: 'No active routine configured',
    };
  }

  // Check if RoutineDay already exists
  let routineDay = await prisma.routineDay.findUnique({
    where: {
      userId_routineId_date: {
        userId,
        routineId: activeRoutine.id,
        date: dateObj,
      },
    },
    include: {
      taskLogs: {
        orderBy: { startTimeSnapshot: 'asc' },
        include: {
          routineTask: {
            select: {
              category: true,
              priority: true,
            },
          },
        },
      },
    },
  });

  if (routineDay) {
    // Check if any active tasks for today are missing from taskLogs
    const applicableTasks = activeRoutine.tasks.filter((t) =>
      t.daysOfWeek.includes(dayOfWeek)
    );
    const existingTaskIds = new Set(routineDay.taskLogs.map((log) => log.routineTaskId).filter(Boolean));
    const missingTasks = applicableTasks.filter((t) => !existingTaskIds.has(t.id));

    if (missingTasks.length > 0) {
      await prisma.$transaction(async (tx) => {
        await Promise.all(
          missingTasks.map((task) =>
            tx.routineTaskLog.create({
              data: {
                routineDayId: routineDay.id,
                routineTaskId: task.id,
                userId,
                taskTitleSnapshot: task.title,
                startTimeSnapshot: task.startTime,
                endTimeSnapshot: task.endTime,
                status: 'PENDING',
              },
            })
          )
        );

        const allLogs = await tx.routineTaskLog.findMany({
          where: { routineDayId: routineDay.id },
        });

        const completedCount = allLogs.filter((l) => l.status === 'COMPLETED').length;
        const total = allLogs.length;
        const percentage = total > 0 ? Math.round((completedCount / total) * 100 * 10) / 10 : 0;

        await tx.routineDay.update({
          where: { id: routineDay.id },
          data: {
            totalTasks: total,
            completedTasks: completedCount,
            completionPercentage: percentage,
          },
        });
      });

      // Refetch
      routineDay = await prisma.routineDay.findUnique({
        where: { id: routineDay.id },
        include: {
          taskLogs: {
            orderBy: { startTimeSnapshot: 'asc' },
            include: {
              routineTask: {
                select: {
                  category: true,
                  priority: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      activeRoutine,
      routineDay,
    };
  }

  // RoutineDay does not exist yet for today — initialize it!
  const applicableTasks = activeRoutine.tasks.filter((t) =>
    t.daysOfWeek.includes(dayOfWeek)
  );

  routineDay = await prisma.$transaction(async (tx) => {
    const day = await tx.routineDay.create({
      data: {
        userId,
        routineId: activeRoutine.id,
        date: dateObj,
        totalTasks: applicableTasks.length,
        completedTasks: 0,
        completionPercentage: 0,
      },
    });

    if (applicableTasks.length > 0) {
      await tx.routineTaskLog.createMany({
        data: applicableTasks.map((task) => ({
          routineDayId: day.id,
          routineTaskId: task.id,
          userId,
          taskTitleSnapshot: task.title,
          startTimeSnapshot: task.startTime,
          endTimeSnapshot: task.endTime,
          status: 'PENDING',
        })),
      });
    }

    return await tx.routineDay.findUnique({
      where: { id: day.id },
      include: {
        taskLogs: {
          orderBy: { startTimeSnapshot: 'asc' },
          include: {
            routineTask: {
              select: {
                category: true,
                priority: true,
              },
            },
          },
        },
      },
    });
  });

  return {
    activeRoutine,
    routineDay,
  };
};

export const getRoutineDay = async (userId, dateStr) => {
  const dateObj = getUtcDateOnly(dateStr);

  const routineDay = await prisma.routineDay.findFirst({
    where: {
      userId,
      date: dateObj,
    },
    include: {
      routine: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      taskLogs: {
        orderBy: { startTimeSnapshot: 'asc' },
        include: {
          routineTask: {
            select: {
              category: true,
              priority: true,
            },
          },
        },
      },
    },
  });

  if (!routineDay) {
    return { routineDay: null, message: 'No routine log found for this date' };
  }

  return { routineDay };
};

export const updateTaskLog = async (userId, dayId, taskLogId, { status }) => {
  const taskLog = await prisma.routineTaskLog.findFirst({
    where: {
      id: taskLogId,
      routineDayId: dayId,
      userId,
    },
  });

  if (!taskLog) {
    const error = new Error('Task log not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const updatedLog = await tx.routineTaskLog.update({
      where: { id: taskLogId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: {
        routineTask: {
          select: {
            category: true,
            priority: true,
          },
        },
      },
    });

    const allLogs = await tx.routineTaskLog.findMany({
      where: { routineDayId: dayId },
    });

    const completedCount = allLogs.filter((l) => l.status === 'COMPLETED').length;
    const totalCount = allLogs.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100 * 10) / 10 : 0;

    const updatedRoutineDay = await tx.routineDay.update({
      where: { id: dayId },
      data: {
        completedTasks: completedCount,
        completionPercentage: percentage,
      },
      include: {
        taskLogs: {
          orderBy: { startTimeSnapshot: 'asc' },
          include: {
            routineTask: {
              select: {
                category: true,
                priority: true,
              },
            },
          },
        },
      },
    });

    return {
      taskLog: updatedLog,
      routineDay: updatedRoutineDay,
    };
  });
};
