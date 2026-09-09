import * as routineService from '../services/routine.service.js';
import * as analyticsService from '../services/routine-analytics.service.js';
import * as suggestionsService from '../services/routine-suggestions.service.js';

// --- Data Optimization & Response Serialization Helpers ---

/**
 * Strips internal metadata (createdAt, updatedAt, userId) from a routine task.
 */
const serializeTask = (task) => {
  if (!task) return null;
  return {
    id: task.id,
    routineId: task.routineId,
    title: task.title,
    description: task.description || null,
    startTime: task.startTime,
    endTime: task.endTime,
    category: task.category,
    daysOfWeek: task.daysOfWeek,
    priority: task.priority,
    isActive: task.isActive,
  };
};

/**
 * Strips internal fields (userId, isArchived, createdAt, updatedAt, _count) from a routine.
 */
const serializeRoutine = (routine) => {
  if (!routine) return null;
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description || null,
    isActive: routine.isActive,
    tasks: Array.isArray(routine.tasks) ? routine.tasks.map(serializeTask) : [],
  };
};

/**
 * Strips userId, routineDayId, createdAt, and updatedAt from daily task logs.
 */
const serializeTaskLog = (log) => {
  if (!log) return null;
  return {
    id: log.id,
    routineTaskId: log.routineTaskId,
    taskTitleSnapshot: log.taskTitleSnapshot,
    startTimeSnapshot: log.startTimeSnapshot,
    endTimeSnapshot: log.endTimeSnapshot,
    status: log.status,
    completedAt: log.completedAt || null,
    routineTask: log.routineTask
      ? {
          category: log.routineTask.category,
          priority: log.routineTask.priority,
        }
      : undefined,
  };
};

/**
 * Strips userId, createdAt, and updatedAt from daily routine snapshot.
 */
const serializeRoutineDay = (day) => {
  if (!day) return null;
  return {
    id: day.id,
    date: day.date,
    totalTasks: day.totalTasks,
    completedTasks: day.completedTasks,
    completionPercentage: day.completionPercentage,
    routine: day.routine
      ? {
          id: day.routine.id,
          name: day.routine.name,
          description: day.routine.description || null,
        }
      : undefined,
    taskLogs: Array.isArray(day.taskLogs) ? day.taskLogs.map(serializeTaskLog) : [],
  };
};

// --- Controllers ---

export const createRoutine = async (req, res, next) => {
  try {
    const routine = await routineService.createRoutine(req.user.id, req.body);
    res.status(201).json({
      success: true,
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutines = async (req, res, next) => {
  try {
    const routines = await routineService.getRoutines(req.user.id);
    res.json({
      success: true,
      count: routines.length,
      routines: routines.map(serializeRoutine),
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutineById = async (req, res, next) => {
  try {
    const routine = await routineService.getRoutineById(req.user.id, req.params.routineId);
    res.json({
      success: true,
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoutine = async (req, res, next) => {
  try {
    const routine = await routineService.updateRoutine(req.user.id, req.params.routineId, req.body);
    res.json({
      success: true,
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    next(error);
  }
};

export const archiveRoutine = async (req, res, next) => {
  try {
    const result = await routineService.archiveRoutine(req.user.id, req.params.routineId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const activateRoutine = async (req, res, next) => {
  try {
    const routine = await routineService.activateRoutine(req.user.id, req.params.routineId);
    res.json({
      success: true,
      routine: {
        id: routine.id,
        name: routine.name,
        isActive: routine.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addTask = async (req, res, next) => {
  try {
    const task = await routineService.addTask(req.user.id, req.params.routineId, req.body);
    res.status(201).json({
      success: true,
      task: serializeTask(task),
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await routineService.updateTask(req.user.id, req.params.taskId, req.body);
    res.json({
      success: true,
      task: serializeTask(task),
    });
  } catch (error) {
    next(error);
  }
};

export const removeTask = async (req, res, next) => {
  try {
    const result = await routineService.removeTask(req.user.id, req.params.taskId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTodayRoutine = async (req, res, next) => {
  try {
    const result = await routineService.getTodayRoutine(req.user.id, req.query.date);
    res.json({
      success: true,
      activeRoutine: result.activeRoutine
        ? {
            id: result.activeRoutine.id,
            name: result.activeRoutine.name,
            description: result.activeRoutine.description || null,
            isActive: result.activeRoutine.isActive,
          }
        : null,
      routineDay: result.routineDay ? serializeRoutineDay(result.routineDay) : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutineDay = async (req, res, next) => {
  try {
    const result = await routineService.getRoutineDay(req.user.id, req.params.date);
    res.json({
      success: true,
      routineDay: result.routineDay ? serializeRoutineDay(result.routineDay) : null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskLog = async (req, res, next) => {
  try {
    const { dayId, taskLogId } = req.params;
    const result = await routineService.updateTaskLog(req.user.id, dayId, taskLogId, req.body);
    res.json({
      success: true,
      taskLog: serializeTaskLog(result.taskLog),
      routineDay: serializeRoutineDay(result.routineDay),
    });
  } catch (error) {
    next(error);
  }
};

export const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getWeeklyStats(req.user.id, startDate, endDate);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const stats = await analyticsService.getMonthlyStats(req.user.id, month, year);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getTaskPerformance = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { startDate, endDate } = req.query;
    const performance = await analyticsService.getTaskPerformance(req.user.id, taskId, startDate, endDate);
    res.json({ success: true, performance });
  } catch (error) {
    next(error);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const result = await suggestionsService.getRoutineSuggestions(req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
