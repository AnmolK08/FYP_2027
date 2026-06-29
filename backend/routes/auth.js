import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, college, department, leetcodeUsername } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        college: college || null,
        department: department || null,
        leetcodeUsername: leetcodeUsername || null,
      }
    });

    // Create empty leetcode stats
    await prisma.leetcodeStats.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        leetcodeUsername: leetcodeUsername || null,
      }
    });

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        department: user.department,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        dailyGoal: user.dailyGoal,
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        leetcodeStats: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        department: user.department,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        dailyGoal: user.dailyGoal,
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        leetcodeStats: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        department: user.department,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        dailyGoal: user.dailyGoal,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, college, department, leetcodeUsername, dailyGoal } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        college: college !== undefined ? college : undefined,
        department: department !== undefined ? department : undefined,
        leetcodeUsername: leetcodeUsername !== undefined ? leetcodeUsername : undefined,
        dailyGoal: dailyGoal !== undefined ? dailyGoal : undefined,
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        department: user.department,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        dailyGoal: user.dailyGoal,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
