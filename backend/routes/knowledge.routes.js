import { Router } from 'express';
import * as knowledgeController from '../controllers/knowledge.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', knowledgeController.getDocs);
router.post('/upload', knowledgeController.uploadDoc);
router.delete('/:id', knowledgeController.deleteDoc);
router.post('/ask', knowledgeController.askQuestion);

export default router;
