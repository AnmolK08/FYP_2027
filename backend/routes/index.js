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
import leetcodeRoutes from './leetcode.routes.js';

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

// Interview service routes
router.use('/interviews', interviewRoutes);

// Leetcode service routes
router.use('/leetcode', leetcodeRoutes);

export default router;
