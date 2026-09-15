import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as codeforcesController from '../controllers/codeforces.controller.js';

const router = Router();

router.use(authenticate);

router.post('/sync', codeforcesController.syncStats);
router.get('/stats', codeforcesController.getStats);

export default router;
