import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from 'database';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get chat sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Group by session
    const grouped = {};
    for (const msg of messages) {
      if (!grouped[msg.sessionId]) {
        grouped[msg.sessionId] = {
          session_id: msg.sessionId,
          preview: msg.content.slice(0, 80),
          ts: msg.createdAt,
        };
      }
    }

    const sessions = Object.values(grouped).slice(0, 30);
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get messages for a session
router.get('/messages/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: req.user.id,
        sessionId
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message and get AI response
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sid = sessionId || uuidv4();

    // Save user message
    await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        userId,
        sessionId: sid,
        role: 'user',
        content: message,
      }
    });

    // Get user's LeetCode stats for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leetcodeStats: true
      }
    });

    const stats = user?.leetcodeStats;

    // Generate AI response based on context
    let response = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('weakness') || lowerMessage.includes('improve')) {
      const weakTags = (stats?.tags || []).sort((a, b) => a.solved - b.solved).slice(0, 5);
      response = `Based on your LeetCode stats, focus on: ${weakTags.map(t => `${t.tag}(${t.solved})`).join(', ')}. Practice these topics daily.`;
    } else if (lowerMessage.includes('plan')) {
      response = `Weekly plan: Mon-Wed focus on weak topics, Thu-Fri contest practice, Sat mock contest, Sun review.`;
    } else if (lowerMessage.includes('stats') || lowerMessage.includes('progress')) {
      response = `You have solved ${stats?.totalSolved || 0} problems: Easy ${stats?.easy || 0}, Medium ${stats?.medium || 0}, Hard ${stats?.hard || 0}. Contest rating: ${Math.round(stats?.contestRating || 0)}.`;
    } else {
      response = `I'm your AI mentor! Ask me about your weak topics, study plans, or problem-solving strategies. Stats: ${stats?.totalSolved || 0} problems solved.`;
    }

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        userId,
        sessionId: sid,
        role: 'assistant',
        content: response,
      }
    });

    res.json({ response, session_id: sid });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Generate weakness plan
router.post('/weakness-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.leetcodeStats.findUnique({
      where: { userId }
    });

    if (!stats || !stats.tags) {
      return res.status(400).json({ error: 'Sync LeetCode first' });
    }

    const weakTags = stats.tags.sort((a, b) => a.solved - b.solved).slice(0, 6);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const plan = `## Weekly Focus Plan

### Weak Areas
${weakTags.map(t => `- **${t.tag}**: ${t.solved} problems solved`).join('\n')}

### Day-by-Day
${days.map((day, i) => {
  const tag = weakTags[i % weakTags.length];
  return `**${day}**: Practice ${tag.tag} problems (2-3 problems)`;
}).join('\n\n')}

### Tips
- Start with easier problems in each topic
- Use a timer (20-30 min per medium problem)
- Review solutions after each session`;

    res.json({ plan, weak_tags: weakTags });
  } catch (error) {
    console.error('Weakness plan error:', error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

export default router;
