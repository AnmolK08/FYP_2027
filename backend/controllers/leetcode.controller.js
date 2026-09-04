import * as leetcodeService from '../services/leetcode.service.js';
import { addSyncJob, isQueueReady } from '../queues/leetcodeSync.queue.js';

export const syncStats = async (req, res, next) => {
  try {
    const isServerless = Boolean(process.env.VERCEL);

    // Prefer async queue only in persistent container environments where a BullMQ worker runs
    if (!isServerless && isQueueReady()) {
      const result = await addSyncJob(req.user.id);

      if (result.queued) {
        return res.status(202).json({
          status: 'queued',
          message: 'LeetCode sync has been queued and will complete shortly',
        });
      }

      // If not queued (e.g. already in progress), inform the client
      if (result.reason === 'Sync already in progress') {
        return res.status(409).json({
          status: 'in_progress',
          message: 'A sync is already in progress for your account',
        });
      }
    }

    // Direct synchronous sync (required on Vercel Serverless or when queue is unavailable)
    const stats = await leetcodeService.syncLeetcodeStats(req.user.id);
    res.json({
      status: 'completed',
      message: 'LeetCode profile synced successfully',
      stats,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await leetcodeService.getStats(req.user.id);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};
