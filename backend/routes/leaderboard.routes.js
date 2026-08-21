import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', leaderboardController.getLeaderboard);
router.get('/me', leaderboardController.getMyRank);
router.post('/rebuild', leaderboardController.rebuildLeaderboard);

export default router;
