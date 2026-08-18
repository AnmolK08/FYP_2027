import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Mock Interviews
router.get('/mock', interviewController.getInterviews);
router.post('/mock', interviewController.createInterview);
router.put('/mock/:id', interviewController.updateInterview);

// Problems
router.get('/problems', interviewController.getProblems);

// System Design
router.get('/system-design', interviewController.getSystemDesignTopics);

// Tracks
router.get('/tracks', interviewController.getTracks);

export default router;
