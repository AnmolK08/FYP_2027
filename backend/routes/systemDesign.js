import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// System Design topics
const SD_TOPICS = [
  { id: 'url-shortener', title: 'Design URL Shortener (TinyURL)', level: 'easy', tags: ['hashing', 'db', 'cache'] },
  { id: 'rate-limiter', title: 'Design Rate Limiter', level: 'easy', tags: ['redis', 'sliding window'] },
  { id: 'chat-app', title: 'Design WhatsApp / Chat App', level: 'medium', tags: ['websocket', 'queue', 'fanout'] },
  { id: 'insta', title: 'Design Instagram Feed', level: 'medium', tags: ['timeline', 'cdn', 'sharding'] },
  { id: 'uber', title: 'Design Uber / Ride-hailing', level: 'hard', tags: ['geo', 'matching', 'payments'] },
  { id: 'youtube', title: 'Design YouTube / Video Streaming', level: 'hard', tags: ['cdn', 'transcoding', 'storage'] },
  { id: 'google-drive', title: 'Design Google Drive', level: 'medium', tags: ['storage', 'sync', 'chunking'] },
  { id: 'twitter', title: 'Design Twitter', level: 'medium', tags: ['timeline', 'fanout', 'cache'] },
  { id: 'search', title: 'Design Search Engine', level: 'hard', tags: ['crawler', 'index', 'ranking'] },
  { id: 'notif', title: 'Design Notification Service', level: 'easy', tags: ['queue', 'push', 'sms'] },
];

// Get system design topics
router.get('/topics', authMiddleware, (req, res) => {
  try {
    res.json({ topics: SD_TOPICS });
  } catch (error) {
    console.error('Get SD topics error:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

export default router;
