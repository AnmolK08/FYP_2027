import express from 'express';
import * as routineController from '../controllers/routine.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateCreateRoutine,
  validateUpdateRoutine,
  validateCreateTask,
  validateUpdateTask,
  validateUpdateTaskLog,
  validateDateParam,
} from '../middleware/routine.validation.js';

const router = express.Router();

// Protect all routine routes
router.use(authenticate);

// 1. Static and specialized paths (must be defined before /:routineId)
router.get('/today', routineController.getTodayRoutine);
router.get('/suggestions', routineController.getSuggestions);
router.get('/analytics/weekly', routineController.getWeeklyAnalytics);
router.get('/analytics/monthly', routineController.getMonthlyAnalytics);
router.get('/days/:date', validateDateParam, routineController.getRoutineDay);
router.patch('/days/:dayId/tasks/:taskLogId', validateUpdateTaskLog, routineController.updateTaskLog);

// 2. Task-specific routes
router.patch('/tasks/:taskId', validateUpdateTask, routineController.updateTask);
router.delete('/tasks/:taskId', routineController.removeTask);
router.get('/tasks/:taskId/performance', routineController.getTaskPerformance);

// 3. Routine collection and ID routes
router.post('/', validateCreateRoutine, routineController.createRoutine);
router.get('/', routineController.getRoutines);
router.get('/:routineId', routineController.getRoutineById);
router.patch('/:routineId', validateUpdateRoutine, routineController.updateRoutine);
router.delete('/:routineId', routineController.archiveRoutine);
router.patch('/:routineId/activate', routineController.activateRoutine);
router.post('/:routineId/tasks', validateCreateTask, routineController.addTask);

export default router;
