import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get activity
router.get('/', authMiddleware, async (req, res) => {
  try {
    const activity = await prisma.activity.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'asc' }
    });

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Check in
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await prisma.activity.upsert({
      where: {
        userId_date: { userId: req.user.id, date: today }
      },
      update: {
        checkedIn: true
      },
      create: {
        id: uuidv4(),
        userId: req.user.id,
        date: today,
        checkedIn: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

export default router;
