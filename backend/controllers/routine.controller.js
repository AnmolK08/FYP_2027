import * as routineService from '../services/routine.service.js';
import * as analyticsService from '../services/routine-analytics.service.js';
import * as suggestionsService from '../services/routine-suggestions.service.js';

export const createRoutine = async (req, res, next) => {
  try {
    const routine = await routineService.createRoutine(req.user.id, req.body);
    res.status(201).json({ success: true, routine });
  } catch (error) {
    next(error);
  }
};

export const getRoutines = async (req, res, next) => {
  try {
    const routines = await routineService.getRoutines(req.user.id);
    res.json({ success: true, count: routines.length, routines });
  } catch (error) {
    next(error);
  }
};

export const getRoutineById = async (req, res, next) => {
  try {
    const routine = await routineService.getRoutineById(req.user.id, req.params.routineId);
    res.json({ success: true, routine });
  } catch (error) {
    next(error);
  }
};

export const updateRoutine = async (req, res, next) => {
  try {
    const routine = await routineService.updateRoutine(req.user.id, req.params.routineId, req.body);
    res.json({ success: true, routine });
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
    res.json({ success: true, routine });
  } catch (error) {
    next(error);
  }
};

export const addTask = async (req, res, next) => {
  try {
    const task = await routineService.addTask(req.user.id, req.params.routineId, req.body);
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await routineService.updateTask(req.user.id, req.params.taskId, req.body);
    res.json({ success: true, task });
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
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getRoutineDay = async (req, res, next) => {
  try {
    const result = await routineService.getRoutineDay(req.user.id, req.params.date);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateTaskLog = async (req, res, next) => {
  try {
    const { dayId, taskLogId } = req.params;
    const result = await routineService.updateTaskLog(req.user.id, dayId, taskLogId, req.body);
    res.json({ success: true, ...result });
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
