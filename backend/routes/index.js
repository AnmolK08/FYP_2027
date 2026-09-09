import { Router } from 'express';

// Import all modular routers
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import activityRoutes from './activity.routes.js';
import resumeRoutes from './resume.routes.js';
import knowledgeRoutes from './knowledge.routes.js';
import mentorRoutes from './mentor.routes.js';
import aiMiscRoutes from './ai-misc.routes.js';
import interviewRoutes from './interview.routes.js';
import flashcardRoutes from './flashcard.routes.js';
import leetcodeRoutes from './leetcode.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import routineRoutes from './routine.routes.js';

import * as interviewController from '../controllers/interview.controller.js';
import * as aiMiscController from '../controllers/ai-misc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Auth service routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/activity', activityRoutes);
router.use('/resume', resumeRoutes);

// AI service routes
router.use('/knowledge', knowledgeRoutes);
router.use('/mentor', mentorRoutes);
router.use('/ai', aiMiscRoutes);
router.use('/flashcards', flashcardRoutes);

// Interview service routes
router.use('/interviews', interviewRoutes);

// Direct route aliases for frontend client compatibility
router.get('/problems', authenticate, interviewController.getProblems);
router.get('/sd/topics', authenticate, interviewController.getSystemDesignTopics);
router.get('/system-design', authenticate, interviewController.getSystemDesignTopics);
router.get('/tracks', authenticate, interviewController.getTracks);
router.get('/quiz/flashcards', authenticate, aiMiscController.getFlashcards);

// Leetcode service routes
router.use('/leetcode', leetcodeRoutes);

// Dashboard & Leaderboard (Redis-backed)
router.use('/dashboard', dashboardRoutes);
router.use('/leaderboard', leaderboardRoutes);

// Routine & Habit Tracker
router.use('/routines', routineRoutes);

export default router;
