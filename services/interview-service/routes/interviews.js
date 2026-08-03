import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from 'database';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get mock interviews
router.get('/', authMiddleware, async (req, res) => {
  try {
    const interviews = await prisma.mockInterview.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({ interviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to get interviews' });
  }
});

// Create interview
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      problemTitle,
      problemDescription,
      starterCode,
      language,
      durationMinutes
    } = req.body;

    const interview = await prisma.mockInterview.create({
      data: {
        id: uuidv4(),
        userId: req.user.id,
        type: type || 'coding',
        problemTitle,
        problemDescription,
        starterCode,
        language: language || 'javascript',
        durationMinutes: durationMinutes || 30,
        status: 'in_progress',
        startedAt: new Date(),
      }
    });

    res.json({ interview });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, code, score, feedback } = req.body;

    const interview = await prisma.mockInterview.updateMany({
      where: {
        id,
        userId: req.user.id
      },
      data: {
        status: status || undefined,
        code: code !== undefined ? code : undefined,
        score: score !== undefined ? score : undefined,
        feedback: feedback !== undefined ? feedback : undefined,
        completedAt: status === 'completed' || status === 'abandoned' ? new Date() : undefined,
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

export default router;
