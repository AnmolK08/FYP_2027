import { Router } from 'express';
import * as resumeController from '../controllers/resume.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/score', authenticate, resumeController.scoreResume);
router.get('/roles', resumeController.getRoles);

export default router;
