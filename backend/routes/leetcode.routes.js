import { Router } from 'express';
import * as leetcodeController from '../controllers/leetcode.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/sync', leetcodeController.syncStats);
router.get('/stats', leetcodeController.getStats);
router.get('/leaderboard', leetcodeController.getLeaderboard);

export default router;
