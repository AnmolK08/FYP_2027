import { Router } from 'express';
import * as mentorController from '../controllers/mentor.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/sessions', mentorController.getSessions);
router.get('/messages/:sessionId', mentorController.getMessages);
router.post('/chat', mentorController.chat);
router.post('/weakness-plan', mentorController.getWeaknessPlan);

export default router;
