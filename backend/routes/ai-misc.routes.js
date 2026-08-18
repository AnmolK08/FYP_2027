import { Router } from 'express';
import * as aiMiscController from '../controllers/ai-misc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/contest', aiMiscController.predictContest);
router.get('/flashcards', aiMiscController.getFlashcards);

export default router;
