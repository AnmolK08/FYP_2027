import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', activityController.getActivity);
router.get('/streaks', activityController.getStreakSummary);
router.post('/checkin', activityController.checkIn);

export default router;
