const VALID_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const VALID_STATUSES = ['PENDING', 'COMPLETED', 'SKIPPED'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validateCreateRoutine = (req, res, next) => {
  const { name, tasks } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Routine name is required and must be a non-empty string',
    });
  }

  if (tasks !== undefined) {
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks must be an array',
      });
    }

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.title || typeof task.title !== 'string' || !task.title.trim()) {
        return res.status(400).json({
          success: false,
          message: `Task at index ${i} requires a title`,
        });
      }
      if (!task.startTime || !TIME_REGEX.test(task.startTime)) {
        return res.status(400).json({
          success: false,
          message: `Task "${task.title}" has invalid startTime (format must be HH:MM in 24-hr format)`,
        });
      }
      if (!task.endTime || !TIME_REGEX.test(task.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Task "${task.title}" has invalid endTime (format must be HH:MM in 24-hr format)`,
        });
      }
      if (task.daysOfWeek !== undefined) {
        if (!Array.isArray(task.daysOfWeek)) {
          return res.status(400).json({
            success: false,
            message: `Task "${task.title}" daysOfWeek must be an array of days`,
          });
        }
        for (const day of task.daysOfWeek) {
          if (!VALID_DAYS.includes(day)) {
            return res.status(400).json({
              success: false,
              message: `Invalid day "${day}". Must be one of: ${VALID_DAYS.join(', ')}`,
            });
          }
        }
      }
    }
  }

  next();
};

export const validateUpdateRoutine = (req, res, next) => {
  const { name, description, isActive } = req.body || {};

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Routine name must be a non-empty string',
    });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean',
    });
  }

  next();
};

export const validateCreateTask = (req, res, next) => {
  const { title, startTime, endTime, daysOfWeek } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Task title is required',
    });
  }

  if (!startTime || !TIME_REGEX.test(startTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid startTime (must be HH:MM in 24-hour format)',
    });
  }

  if (!endTime || !TIME_REGEX.test(endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid endTime (must be HH:MM in 24-hour format)',
    });
  }

  if (daysOfWeek !== undefined) {
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'daysOfWeek must be a non-empty array of days',
      });
    }
    for (const day of daysOfWeek) {
      if (!VALID_DAYS.includes(day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day "${day}". Must be one of: ${VALID_DAYS.join(', ')}`,
        });
      }
    }
  }

  next();
};

export const validateUpdateTask = (req, res, next) => {
  const { title, startTime, endTime, daysOfWeek } = req.body || {};

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Task title must be a non-empty string',
    });
  }

  if (startTime !== undefined && !TIME_REGEX.test(startTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid startTime (must be HH:MM in 24-hour format)',
    });
  }

  if (!endTime !== undefined && endTime && !TIME_REGEX.test(endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid endTime (must be HH:MM in 24-hour format)',
    });
  }

  if (daysOfWeek !== undefined) {
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'daysOfWeek must be a non-empty array of days',
      });
    }
    for (const day of daysOfWeek) {
      if (!VALID_DAYS.includes(day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day "${day}". Must be one of: ${VALID_DAYS.join(', ')}`,
        });
      }
    }
  }

  next();
};

export const validateUpdateTaskLog = (req, res, next) => {
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  next();
};

export const validateDateParam = (req, res, next) => {
  const { date } = req.params;
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Date parameter must be in YYYY-MM-DD format',
    });
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  if (isNaN(parsed.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date value',
    });
  }

  next();
};
